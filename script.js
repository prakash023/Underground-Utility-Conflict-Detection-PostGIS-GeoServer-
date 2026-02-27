// Initialize map
var map = L.map('map').setView([51.3397, 12.3731], 12);

// ---------------- BASE MAP ----------------
var osm = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: '© OpenStreetMap contributors' }
).addTo(map);

// ---------------- GEOSERVER URL ----------------
var geoserverUrl = "http://localhost:8081/geoserver/leipzig/wms";

// ---------------- BASE DATA ----------------
var buildings = L.tileLayer.wms(geoserverUrl, {
    layers: 'leipzig:clean_buildings_CRS',
    format: 'image/png',
    transparent: true
});

var landuse = L.tileLayer.wms(geoserverUrl, {
    layers: 'leipzig:clean_landuse',
    format: 'image/png',
    transparent: true
});

var railways = L.tileLayer.wms(geoserverUrl, {
    layers: 'leipzig:clean_railways',
    format: 'image/png',
    transparent: true
});

// ---------------- INFRASTRUCTURE ----------------
var roads = L.tileLayer.wms(geoserverUrl, {
    layers: 'leipzig:clean_roads',
    format: 'image/png',
    transparent: true
});

var fiber = L.tileLayer.wms(geoserverUrl, {
    layers: 'leipzig:clean_fiber_lines',
    format: 'image/png',
    transparent: true
});

var gas = L.tileLayer.wms(geoserverUrl, {
    layers: 'leipzig:clean_gas_lines',
    format: 'image/png',
    transparent: true
});

var water = L.tileLayer.wms(geoserverUrl, {
    layers: 'leipzig:clean_water_lines',
    format: 'image/png',
    transparent: true
});

// ---------------- BOUNDARY (TOP PANE) ----------------
map.createPane('boundaryPane');
map.getPane('boundaryPane').style.zIndex = 650;

var boundary = L.tileLayer.wms(geoserverUrl, {
    layers: 'leipzig:clean_leipzig_boundary',
    format: 'image/png',
    transparent: true,
    pane: 'boundaryPane'
}).addTo(map);

// ---------------- LAYER CONTROL ----------------
L.control.layers(null, {
    "Buildings": buildings,
    "Landuse": landuse,
    "Railways": railways,
    "Roads": roads,
    "Fiber Lines": fiber,
    "Gas Lines": gas,
    "Water Lines": water,
    "Boundary": boundary
}).addTo(map);

// Legend has been removed


//Conflicts layer for clickable and those are WFS, so we need to fetch them separately 
// and add as GeoJSON layer
// ================= CONSTRUCTION RISK (WFS) =================
fetch("http://localhost:8081/geoserver/leipzig/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=leipzig:construction_with_risk&outputFormat=application/json&srsName=EPSG:4326")
.then(res => res.json())
.then(data => {

    console.log("Construction Features:", data.features.length);

    var constructionLayer = L.geoJSON(data, {

        style: function(feature) {
            return {
                color: "#000000",
                fillColor: "#00ff00",
                fillOpacity: 0.8,
                weight: 2
            };
        }

    }).addTo(map);

    // FORCE zoom to data
    map.fitBounds(constructionLayer.getBounds());

});



// ================= CONFLICT HOTSPOTS (WFS) =================
fetch("http://localhost:8081/geoserver/leipzig/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=leipzig:utility_conflicts&outputFormat=application/json&srsName=EPSG:4326")
.then(res => res.json())
.then(data => {

    console.log("Conflict Features:", data.features.length);

    var conflictLayer = L.geoJSON(null, {

        onEachFeature: function(feature, layer) {

            layer.bindPopup(
                "<b>Project:</b> " + feature.properties.project_name + "<br>" +
                "<b>Utility:</b> " + feature.properties.utility_type + "<br>" +
                "<b>Utility Depth:</b> " + feature.properties.utility_depth + " m<br>" +
                "<b>Excavation Depth:</b> " + feature.properties.excavation_depth_m + " m<br>" +
                "<b>Risk Level:</b> " + feature.properties.risk_level
            );

            layer.on("click", function() {
                let originalRadius = layer.getRadius();
                layer.setRadius(14);
                setTimeout(function() {
                    layer.setRadius(originalRadius);
                }, 600);
            });
        }

    });

    // Convert each polygon to centroid circle marker
    data.features.forEach(function(feature) {

        let coords = feature.geometry.coordinates[0][0];

        // Calculate centroid manually using Leaflet
        let polygon = L.polygon(feature.geometry.coordinates[0]);
        let center = polygon.getBounds().getCenter();

        let risk = feature.properties.risk_level;

        let fillColor = "#ffff00";
        if (risk === "HIGH") fillColor = "#ff0000";
        if (risk === "MEDIUM") fillColor = "#ff9900";

        let marker = L.circleMarker(center, {
            radius: 8,
            fillColor: fillColor,
            color: "#000000",
            weight: 2,
            opacity: 1,
            fillOpacity: 1
        });

        marker.feature = feature;
        conflictLayer.addLayer(marker);

    });

    conflictLayer.addTo(map);
    conflictLayer.bringToFront();

});

// ================= LEGEND =================
var legend = L.control({ position: "bottomright" });

legend.onAdd = function () {

    var div = L.DomUtil.create("div", "info legend");

    div.innerHTML = `
        <div style="
            background: white;
            padding: 10px 12px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(0,0,0,0.2);
            font-size: 14px;
            line-height: 20px;
        ">
            <b>Project Risk</b><br>
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#8b0000;margin-right:6px;"></span> Critical<br>
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ff8c00;margin-right:6px;"></span> Moderate<br>
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#2ecc71;margin-right:6px;"></span> Low<br>
            <hr style="margin:6px 0;">
            <b>Conflict Level</b><br>
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ff0000;margin-right:6px;"></span> High<br>
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ffa500;margin-right:6px;"></span> Medium<br>
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ffff00;margin-right:6px;"></span> Low
        </div>
    `;

    return div;
};

legend.addTo(map);