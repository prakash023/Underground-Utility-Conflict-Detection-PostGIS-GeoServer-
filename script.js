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

map.on('click', function (e) {

    var url = utilitiesLayer.getFeatureInfoUrl(
        e.latlng,
        map.getZoom(),
        {
            info_format: 'application/json'
        }
    );

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.features.length > 0) {
                var props = data.features[0].properties;

                L.popup()
                    .setLatLng(e.latlng)
                    .setContent(
                        "<b>Project:</b> " + props.project_name + "<br>" +
                        "<b>Utility:</b> " + props.utility_type
                    )
                    .openOn(map);
            }
        });
});
//Conflicts layer for clickable and those are WFS, so we need to fetch them separately 
// and add as GeoJSON layer
fetch("http://localhost:8081/geoserver/leipzig/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=leipzig:fiber_network&outputFormat=application/json")
.then(res => res.json())
.then(data => {

    var fiberLayer = L.geoJSON(data, {
        style: {
            color: "blue",
            weight: 2
        },
        onEachFeature: function (feature, layer) {
            layer.bindPopup(
                "<b>Utility:</b> Fiber<br>" +
                "<b>Depth:</b> " + feature.properties.depth + " m<br>" +
                "<b>Installed:</b> " + feature.properties.installation_year
            );
        }
    }).addTo(map);

});