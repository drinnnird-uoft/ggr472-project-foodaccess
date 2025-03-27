mapboxgl.accessToken = 'pk.eyJ1IjoiZHJpbm5pcmQiLCJhIjoiY201b2RyYXRhMGt1YTJvcHQ4ZjU4dDYycSJ9.jHNRKSu149-F5s157m1GwA'; // Add default public map token from your Mapbox account
const map = new mapboxgl.Map({
    container: 'my-map', // map container ID
    style: 'mapbox://styles/mapbox/light-v11', // style URL
    center: [-79.41, 43.7], // starting position [lng, lat]
    zoom: 10
});

const returnbutton = document.getElementById("returnbutton")

let hoveredPolygonId = null; // set variable to hold ID of polygon hovered on, initialize to null

returnbutton.addEventListener('click', (e) => {
    map.flyTo({
        center: [-79.41, 43.7],
        zoom: 10,
        essential: true
    })
})

// function to find quantiles, for choropleth mapping
const quantile = (arr, q) => {
    const sorted = arr.sort();
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
        return sorted[base];
    }
};

map.on('load', () => {

    // load custom image into the map style
    map.loadImage(
        'https://drinnnird-uoft.github.io/ggr472-project-foodaccess/img/blue-circle-small.png',
        (error, image) => {
            if (error) throw error;

            // Add the image to the map style.
            map.addImage('circle-blue-sm', image);
    });

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

    map.addSource('sample-data', {
        type: 'geojson',
        data: 'https://drinnnird-uoft.github.io/ggr472-project-foodaccess/data/walmart_transit_sample.geoJSON',
        'generateId': true //This ensures that all features have unique IDs 
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

    map.on('mousemove', 'sample-poly', (e) => {
        map.getCanvas().style.cursor = 'pointer'; // update the mouse cursor to a pointer to indicate clickability
        if (e.features.length > 0) {
            if (hoveredPolygonId !== null) {
                map.setFeatureState(
                    { source: 'sample-data', id: hoveredPolygonId },
                    { hover: false }
                );
            }
            hoveredPolygonId = e.features[0].id;
            map.setFeatureState(
                { source: 'sample-data', id: hoveredPolygonId },
                { hover: true }
            );
        }
    })

    // When the mouse leaves the nh-poly layer, update the feature state of the
    // previously hovered feature.
    map.on('mouseleave', 'sample-poly', () => {
        map.getCanvas().style.cursor = ''; // put the mouse cursor back to default
        if (hoveredPolygonId !== null) {
            map.setFeatureState(
                { source: 'sample-data',id: hoveredPolygonId },
                { hover: false }
            );
        }
        hoveredPolygonId = null;
    });

    // note: Mapbox has a known issue with mouseenter and mouseleave for circle layers
    // the points are right-biased meaning you have to mouse over the right edge of the circle
    // rather than the center
    // attempted workaround using symbol layer instead of circle layer but had the same problem
    map.on('mouseenter', 'super-point', (e) => {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';

        // Copy coordinates array.
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.name;

        //console.log(e.features[0].properties)

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        // this is from the mapbox gl js documentation/examples
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

    // go through travel time data to build color ramp

    let samplejson;

    fetch('https://drinnnird-uoft.github.io/ggr472-project-foodaccess/data/walmart_transit_sample.geoJSON')
    .then(response => response.json())
    .then(response => {
        samplejson = response;
        console.log(samplejson);

        // get quartiles for choropleth scaling
        let ttimes = [];

        samplejson.features.forEach((label, i) => {
            let feature = samplejson.features[i];
            let props = feature.properties;
            let travtime = props.travel_time;
            ttimes.push(travtime) 
        })

        const q1 = quantile(ttimes, 0.25);
        const med = quantile(ttimes, 0.5);
        const q3 = quantile(ttimes, 0.75);
        const upper = Math.max.apply(null, ttimes);

        map.addLayer({
            'id' : 'sample-poly',
            'type' : 'fill',
            'source' : 'sample-data',
            'paint': {
                "fill-color" : [
                    "step",
                    ["get", "travel_time"],
                    "#fef0d9",
                    q1, "#fdcc8a",
                    med, "#fc8d59",
                    q3, "#e34a33",
                    upper, "#b30000"
                ],
                'fill-opacity': [ // set the fill opacity based on a feature state which is set by a hover event listener
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1,  // opaque when hovered on
                0.5 // semi-transparent when not hovered on
            ],
            'fill-outline-color': 'white'
            },
             'filter': ['all', ['has', 'travel_time'], ['!=', ['get', 'travel_time'], null]] // show only hexgrid points that have a travel time set
        })

        // hide the hexgrid at first until something is selected in the dropdown
        map.setLayoutProperty("sample-poly", 'visibility', 'none');

        // handle clicking on a hexgrid item
        map.on('click', 'sample-poly', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const travel_time = e.features[0].properties.travel_time;

            const sel_travel_mode = $(".iconfilter-clicked");
            if(sel_travel_mode.length == 1) {
                const pieces = sel_travel_mode[0].id.split("btn");
                $("#click-info").html("Travel time to " + $("#chain-select").val() + " by " + pieces[1] + " is " + travel_time + "m.");
            }
        })
    })

    // click handler for selecting a brand inside map load because the map must be loaded to apply filters
    $("#chain-select").change(function() {
        let sel = $(this).val();
        console.log("Selected " + sel)

        if(sel !== 0) {
            // if something has been selected
            // show the hexgrid for that selection
            
            map.setLayoutProperty("sample-poly", "visibility", "visible");
            map.setFilter('sample-poly', ['all', 
                ['has', 'travel_time'],
                ['!=', ['get', 'travel_time'], null],
                ['==', ['get', 'brand'], sel]
            ]);

            map.setFilter('super-point', ['==', ['get','brand'], sel]); // show only supermarkets that match requested brand
        }
    })

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


    // inspect the properties of the geoJSON file
    let superjson;
    let brands = [];
    let brandselect = document.getElementById("chain-select");

    fetch('https://drinnnird-uoft.github.io/ggr472-project-foodaccess/data/supermarkets.geoJSON')
    .then(response => response.json())
    .then(response => {
        superjson = response;
        console.log(superjson);
        // get a set of unique grocery chains
        let supermarkets = superjson.features;

        supermarkets.forEach((label, i) => {
            let item = supermarkets[i];
            if(item.properties.brand !== undefined && item.properties.brand !== null) {
                if(!brands.includes(item.properties.brand)) {
                    brands.push(item.properties.brand)
                }
            }
        });

        brands.sort();

        brands.forEach((label, i) => {
            let opt = document.createElement('option');
            opt.text = opt.value = label;
            brandselect.add(opt)
        })

    });
})
