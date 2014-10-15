Example code for Walkalytics API
==============================

This is a collection of example code for the [Walkalytics][] API, available at
<https://dev.walkalytics.com>. [Signup now][signup] for a free API key!

## Python

Create a file `walkalytics-api-key` with your API key (see sample for format),
or put the key directly in the source code. Running the code will print the
service area, travel time for each POI and an isochrone image as PNG (together
with a world file). The coordinate system for the PNG is `EPSG:3857`.

       > python isochrone.py 828895 5932832

       Source location is (828895,5932832).
       The service area for the source location is 3.45 square km.
       - POI 'Hello!' has a walking time of 0 minutes to the source point.
       - POI 'Is it me you're looking for?' has a walking time of 15 minutes to the source point.
       Save image isochrone_828895_5932832.png with an accompanying world file.

## OpenLayers

This example shows the walking isochrone on an [OpenLayers][] webmap. To
use this example get a "Starter key" from <https://dev.walkalytics.com> and
change the following line in `index.html`:

    <body onload="walkalytics.set_apikey('<your-api-key-here>')">

Run a local webserver in its directory with port 8000, for example with Python:

    python -m SimpleHTTPServer -p 8000

or with [node][]:

    npm install http-server -g     # install node module
    http-server -p 8000
    
If you want to run it on your webserver, contact <mailto:walkalytics@ebp.ch>.

## ArcGIS Desktop

Todo: Integrate API call as Geoprocessing task in ArcGIS Desktop.

## ArcGIS Online

Todo: Compare with [Esri's routing based Drive Time Analysis][AGOLDriveTime]
and mode walking.

  [Walkalytics]: http://www.walkalytics.com
  [OpenLayers]: http://openlayers.org
  [node]: http://nodejs.org
  [AGOLDriveTime]: https://developers.arcgis.com/en/features/directions/
  [signup]: https://dev.walkalytics.com/signup/
