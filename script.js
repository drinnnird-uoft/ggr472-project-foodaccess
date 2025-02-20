mapboxgl.accessToken = 'pk.eyJ1IjoiZHJpbm5pcmQiLCJhIjoiY201b2RyYXRhMGt1YTJvcHQ4ZjU4dDYycSJ9.jHNRKSu149-F5s157m1GwA'; // Add default public map token from your Mapbox account
const map = new mapboxgl.Map({
    container: 'my-map', // map container ID
    style: 'mapbox://styles/drinnird/cm6twaxlw01bc01ryeat9ddox', // style URL
    center: [-79.39, 46.662], // starting position [lng, lat]
    zoom: 4
});

map.on('load', () => {
    // add geoJSON source files
    // fs-data is field stations (points)
    // provpark-data is federal protected areas (polygons)
    map.addSource('fs-data', {
        type: 'geojson',
        data: 'https://drinnnird-uoft.github.io/ggr472-lab02/data/fs.geojson' // Your URL to your buildings.geojson file
    });

    map.addSource('provpark-data', {
        type: 'geojson',
        data: 'https://drinnnird-uoft.github.io/ggr472-lab02/data/provpark.geojson' // Your URL to your buildings.geojson file
    });

    // draw features from geoJSON source files

    // draw field stations as purple circles
    map.addLayer({
        'id': 'fs-point',
        'type': 'circle',
        'source': 'fs-data',
        'paint': {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 4, 15, 10, 22, 15], /* make the dot get bigger as the zoom level increases */
            'circle-color': '#9326ff'
        }
    });

    // shade in provincial park areas with partial transparency
    map.addLayer({
        'id': 'provpark-poly',
        'type': 'fill',
        'source': 'provpark-data',
        'paint': {
            'fill-color': '#888888', // Test alternative colours and style properties
            'fill-opacity': 0.7,
            'fill-outline-color': '#9326ff'
        }
    })

    // Create a popup, but don't add it to the map yet.
    const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    // create dynamically generated popups based on the properties set in the geoJSON file
    map.on('mouseenter', 'fs-point', (e) => {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';

        // Copy coordinates array.
        // extract properties we want to build the HTML string
        const coordinates = e.features[0].geometry.coordinates.slice(); // get the coordinates of the hovered-over location
        const description = e.features[0].properties.placeName; // extract the place name of this location
        const ecosystems = JSON.parse(e.features[0].properties.ecosystems); // extract the list of ecosystems for this location, JSONparse because it is a JSON array but has been loaded by AJAX as an unparsed string
        const unilinked = e.features[0].properties.universityLinked; // whether the location is university-linked

        // build the HTML that will be dynamically appended to the popup
        let formattedHTML = '<p><b>' +
            description +
            '</b><br />' +
            'Linked to a university? ' + unilinked + '<br />' +
            "Connected ecosystems: ";

        // iterate through ecosystems to produce a list
        ecosystems.forEach(function (entry) {
            formattedHTML += entry + ', '
        });

        formattedHTML = formattedHTML.replace(/,\s*$/, ""); // remove trailing comma with regex

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to. (tutorial suggested this)
        if (['mercator', 'equirectangular'].includes(map.getProjection().name)) {
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
        }

        // Populate the popup and set its coordinates
        // based on the feature found.
        popup.setLngLat(coordinates).setHTML('<b>' + formattedHTML + "</b><br />").addTo(map);
    });

    // hide the popups when the mouse stops hovering over a location
    map.on('mouseleave', 'fs-point', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });
    
});