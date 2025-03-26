mapboxgl.accessToken = 'pk.eyJ1IjoiZHJpbm5pcmQiLCJhIjoiY201b2RyYXRhMGt1YTJvcHQ4ZjU4dDYycSJ9.jHNRKSu149-F5s157m1GwA'; // Add default public map token from your Mapbox account
const map = new mapboxgl.Map({
    container: 'my-map', // map container ID
    style: 'mapbox://styles/mapbox/light-v11', // style URL
    center: [-79.41, 43.7], // starting position [lng, lat]
    zoom: 10
});

const returnbutton = document.getElementById("returnbutton")

returnbutton.addEventListener('click', (e) => {
    map.flyTo({
        center: [-79.41, 43.7],
        zoom: 10,
        essential: true
    })
})

map.on('load', () => {

    //Add search control to map overlay
    //Requires plugin as source in HTML body
    map.addControl(
        new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            countries: "ca" //Try searching for places inside and outside of canada to test the geocoder
        })
    );

    //Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl());
    // add geoJSON source files
    // torboundary-data - toronto boundary line
    // torneigh-data is toronto neighbourhoods (polygons)
    // supermarkets.geoJSON is a point feature collection of all the supermarkets in Toronto
    map.addSource('torboundary-data', {
        type: 'geojson',
        data: 'https://drinnnird-uoft.github.io/ggr472-project-foodaccess/data/tor_boundry.geojson'
    });

    map.addSource('torneigh-data', {
        type: 'geojson',
        data: 'https://drinnnird-uoft.github.io/ggr472-project-foodaccess/data/tor_neigh.geojson'
    });

    map.addSource('super-data', {
        type: 'geojson',
        data: 'https://drinnnird-uoft.github.io/ggr472-project-foodaccess/data/supermarkets.geoJSON'
    })

    // draw features from geoJSON source files

    // draw boundary as grey lines
    map.addLayer({
        'id': 'torboundary-line',
        'type': 'line',
        'source': 'torboundary-data',
        'paint': {
            'line-color' : '#6D6D6D'
        }
    });

    // draw neighbourhoods as lighter grey lines
    map.addLayer({
        'id' : 'torneigh-line',
        'type' : 'line',
        'source' : 'torneigh-data',
        'paint' : {
            'line-color' : '#A2A2A2'
        }
    })

    // draw supermarkets as blue dots, adjusting dot size with zoom
    map.addLayer({
        'id' : 'super-point',
        'type' : 'circle',
        'source' : 'super-data',
        'paint': {
                'circle-color': '#4264fb',
                'circle-radius': 6,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
        },
        'filter': ['all', ['has', 'brand'], ['!=', ['get', 'brand'], null]] // show only supermarkets that have a brand set
    })

    // Create a popup, but don't add it to the map yet.
    const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    map.on('mouseenter', 'super-point', (e) => {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';

        // Copy coordinates array.
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.name;

        console.log(e.features[0].properties)

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        if (['mercator', 'equirectangular'].includes(map.getProjection().name)) {
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
        }

        // Populate the popup and set its coordinates
        // based on the feature found.
        popup.setLngLat(coordinates).setHTML(description).addTo(map);
    });

    map.on('mouseleave', 'super-point', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });

})

$(document).ready(function() {
    // interactivity handling for the buttons that allow you to select which
    // mode of transport you want to calculate for
    // handle colorizing the buttons on hover and click
    $("#btnWalk").hover(function() {
        $(this).addClass("iconfilter-hover")
    }, function() {
        $(this).removeClass("iconfilter-hover")
    })
    $("#btnBike").hover(function() {
        $(this).addClass("iconfilter-hover")
    }, function() {
        $(this).removeClass("iconfilter-hover")
    })
    $("#btnTransit").hover(function() {
        $(this).addClass("iconfilter-hover")
    }, function() {
        $(this).removeClass("iconfilter-hover")
    })
    $("#btnCar").hover(function() {
        $(this).addClass("iconfilter-hover")
    }, function() {
        $(this).removeClass("iconfilter-hover")
    })
    $("#btnWalk").click(function() {
        $(this).addClass("iconfilter-clicked")
        $("#btnBike").removeClass("iconfilter-clicked")
        $("#btnTransit").removeClass("iconfilter-clicked")
        $("#btnCar").removeClass("iconfilter-clicked")
    })
    $("#btnBike").click(function() {
        $(this).addClass("iconfilter-clicked")
        $("#btnWalk").removeClass("iconfilter-clicked")
        $("#btnTransit").removeClass("iconfilter-clicked")
        $("#btnCar").removeClass("iconfilter-clicked")
    })
    $("#btnTransit").click(function() {
        $(this).addClass("iconfilter-clicked")
        $("#btnBike").removeClass("iconfilter-clicked")
        $("#btnWalk").removeClass("iconfilter-clicked")
        $("#btnCar").removeClass("iconfilter-clicked")
    })
    $("#btnCar").click(function() {
        $(this).addClass("iconfilter-clicked")
        $("#btnBike").removeClass("iconfilter-clicked")
        $("#btnTransit").removeClass("iconfilter-clicked")
        $("#btnWalk").removeClass("iconfilter-clicked")
    })
    $("#chain-select").click(function() {
        console.log("Selected " + $(this).val())
    })


    // inspect the properties of the geoJSON file
    let superjson;

    fetch('https://drinnnird-uoft.github.io/ggr472-project-foodaccess/data/supermarkets.geoJSON')
    .then(response => response.json())
    .then(response => {
        superjson = response;
        
        // get a set of unique grocery chains

    });
})
