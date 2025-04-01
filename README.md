# ggr472-project-foodaccess

## project description

This map provides the user with the ability to investigate spatial access to grocery store chains across Toronto.  
Individual chains and modes of transport can be selected to view transport times to the nearest example of the desired chain 
and transport method.  

## assets

bootstrap-icons:
- release files of the SVG icons from default bootstrap

data:
- tor_boundary.geojson - Toronto municipality boundary lines
- tor_neigh.geojson - Toronto neighbourhood boundary lines
- supermarkets.geoJSON - point features of all supermarkets in Toronto, from OpenStreetMaps
- supermarkets-WGS84.geojson - point features of all supermarkets in Toronto, from OpenStreetMaps, in CRS WGS84
- all_travel_times_res7.geojson - the transport times calculated in python for a hexgrid of resolution 7 for all supermarkets

img:
- image assets for custom markers on the map