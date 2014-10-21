Example code for Walkalytics API
================================

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

    python -m SimpleHTTPServer 8000

or with [node][]:

    npm install http-server -g     # install node module
    http-server -p 8000
    
If you want to run it on your webserver, contact <mailto:walkalytics@ebp.ch>.

## Leaflet

This example shows the walking isochrone on a webmap with
[Leaflet][]. Setting up and test works as with the OpenLayers
example.

## ArcGIS Javascript API

This example shows the walking isochrone on a webmap with
[ArcGIS Javascript API][AGJS]. Setting up and test works as with the OpenLayers
example. 

Todo: Compare with [Esri's routing based Drive Time Analysis][AGOLDriveTime]
and mode walking.

## ArcGIS Desktop

The ArcGIS Desktop integration is done by a [Python toolbox][]. In the dialog
box, you need to specify a point layer and an output path for the raster
(currently only tested with a File Geodatabase). Additionally, input the
Walkalytics API key. If a file `walkalytics-api-key` exists (netrc format, see
above), the key is read from there.

The tool `Isochrone` will read all points in the feature class, calculate the
walking isochrone for each point and save the resulting raster is in the output
path.

You need to install the [PIL][] module in the path of ArcGIS's Python. Since
the original library has not been updated, we we recommend the
[PIL fork `pillow`][pillow]. You can
[get unofficial Windows binaries here][pillow-binaries].

# Contributors

* Stephan Heuel, [@ping13](https://twitter.com/ping13)
* Tom Wider, [@tmwdr](https://twitter.com/tmwdr)

  [Walkalytics]: http://www.walkalytics.com
  [OpenLayers]: http://openlayers.org
  [node]: http://nodejs.org
  [Leaflet]: http://leafletjs.com/
  [AGOLDriveTime]: https://developers.arcgis.com/en/features/directions/
  [AGJS]: https://developers.arcgis.com/javascript/
  [signup]: https://dev.walkalytics.com/signup/
  [Python toolbox]: http://resources.arcgis.com/en/help/main/10.2/index.html#//001500000022000000
  [pillow]: https://pillow.readthedocs.org/
  [PIL]: http://effbot.org/zone/pil-index.htm
  [pillow-binaries]: http://www.lfd.uci.edu/~gohlke/pythonlibs/#pillow
