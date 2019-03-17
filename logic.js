//------------------------------------------------------------------------
// Visualizing Data with Leaflet
// - See README.md for description of the application. 

// Initialize global constants
const queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
const magColors = [[0,'#dac292'], [2,'#ada397'], [4,'#622569'], [6,'#c83349']];
const magScales = [[1,.5], [2,1], [3,1.5], [4,2.5], [5,4], [6,7], [7,10]];

//------------------------------------------------------------------------
// Application Entry
// - Perform request for current earthquake data. 
// - When received, process the earthquake data and create the map
//
d3.json(queryUrl, function(earthquakeData) {

  // Create map object
  let myMap = L.map("map", {
    center : [37.09, -95.71],
    zoom   : 2,
    maxBounds : [[-90,-180], [90,180]]
  });

  // Create layers for earthquake data based GeoJSON query
  earthquakes = createFeatures(earthquakeData);

  // Create the layer control for the map
  baseMaps = createBasemaps();
  overlayMaps = createOverlays(myMap);
  overlayMaps.Earthquakes = earthquakes;

  // Add primary basemap and earthquake data overlay to the map
  // Add legend for circle colors / magnitude to the map
  // Create the layer control, and add it to the map
  myMap.addLayer(baseMaps["Street Map"]).addLayer(earthquakes)
       .addControl(createLegend())
       .addControl(L.control.layers(baseMaps, overlayMaps, {collapsed: false}));
});

//------------------------------------------------------------------------
// Function : createFeatures(earthquakeData)
// - For each feature (earthquake) in the GeoJSON data create a circle 
//   layer, with color and size indicative of maginitude, and popup
//   with event details : time, location, position and maginitude
//
function createFeatures(earthquakeData) {

  function magColor(mag) {
    for (i=magColors.length-1; i>0; i--) {if (mag > magColors[i][0]) return magColors[i][1];} 
    return magColors[0][1];
  }
  function magScale(mag) {
    for (i=magScales.length-1; i>0 ; i--) { if (mag > magScales[i][0]) return magScales[i][1]}
    return magScales[0][1];
  }
  function magCircle (feature, latlng) {
    let radius = magScale(feature.properties.mag) * 20000;
    let color  = magColor(feature.properties.mag);
    let date   = new Date(feature.properties.time)
    let label  = `<p>Time: ${date.toISOString()}`+
                `<br>Location: ${feature.properties.place}`+
                `<br>Position: (${parseFloat(latlng.lat).toFixed(2)},`+
                              `${parseFloat(latlng.lng).toFixed(2)})`+
                `<br>Magnitude: ${feature.properties.mag}</p>`;

    return L.circle(latlng, {radius:radius, color:color, fillColor:color, opacity:.25, fillOpacity:0.75}).bindPopup(label);
  }
  return L.geoJSON(earthquakeData, {pointToLayer : magCircle});
}

//------------------------------------------------------------------------
// Function : createBasemaps()
// 
// - Create 2 tile layers for the map and return a "base layer" object
//
function createBasemaps() {
    // Initila layer using street maps
    let streetmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
      attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
      maxZoom: 18,
      minZoom: 1,
      id: "mapbox.streets",
      accessToken: API_KEY,
      noWrap: true
    });
  
    // Secondary layer using "dark" map
    let darkmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
      attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
      maxZoom: 18,
      minZoom: 1,
      id: "mapbox.dark",
      accessToken: API_KEY,
      noWrap: true
    });
  
    // Define a baseMaps object to hold our base layers
    return {
      "Street Map" : streetmap,
      "Dark Map"   : darkmap
    };
}

//------------------------------------------------------------------------
// Function : createOverlays(myMap)
// - Create layers for overlay layers and return the "overlay layer" object
// - Additionally a new pane is added to the map with z-index lower than the
//   earthquake data to maintain popups when the overlays are enabled
//
function createOverlays(myMap) {

  // Create an intermediate pane with Z order lower than our circle markers
  // Without this, boundary overlays cover circle markers and popups are not available
  myMap.createPane("boundaries").style.zIndex = 300;

  // Create overlay object to hold our overlay layer
  let overlayMaps = {
    Plates      : L.geoJSON(pb2002Plates,{pane:"boundaries", fillOpacity:0}),
    Orogens     : L.geoJSON(pb2002Orogens, {pane:"boundaries", fillOpacity:0}),
//  Boundaries  : L.geoJSON(pb2002Boundaries, {pane:"boundaries", fillOpacity:0})  // Seems duplicate
  };

  return overlayMaps;
}

//------------------------------------------------------------------------
// Function : createLegend()
// - Create legend for the map marker coloring
//
function createLegend() {
   // Create control for circle/magnitude color legend
   let legend = L.control({position: 'bottomright'});

   // Add html for legend control, static colors and maginitude values
   legend.onAdd = function (map) {
       let div = L.DomUtil.create('div', 'info legend');
       
       for (i=0; i<magColors.length-1; i++) {
         div.innerHTML += `<i style="background:${magColors[i][1]}"></i>Mag < ${magColors[i+1][0]} <br>`;
       }
       div.innerHTML += `<i style="background:${magColors[magColors.length-1][1]}"></i>Mag >= ${magColors[magColors.length-1][0]} <br>`;
 
       return div;
   };
   return legend;
}
