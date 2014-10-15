# Example call for the time-isochrone API at Walkalytics
# see <https://dev.walkalytics.com> for details
#
# (c) Ernst Basler + Partner
#
import urllib
import urllib2
import json
import re
import math
import netrc 
import sys

# Configuration

# - read x and y coordinates from command line arguments, or just use default coords.
try:
    x,y = sys.argv[1:3]
except ValueError:
    x,y = 828895, 5932832
print("Source location is ({},{}).".format(x,y))

# - set the api_key by reading a netrc file with API key. 
secrets = netrc.netrc("walkalytics-api-key")
_, _, api_key = secrets.authenticators("api.walkalytics.com")
# - Alternatively, you can replace the two lines above with explicitly set
#   api_key with your key from https://dev.walkalytics.com/developer


# - set API parameters and set of POIs
params = {
    'x' : x,
    'y' : y,
    "only_pois": 'false', # or "true"
    "outputsize": 512,    # max is currently 720
    # more parameters are possible, see API documentation
    'key': api_key 
}

# - POIs may also be an empty dict
pois = { "type": "FeatureCollection",
         "crs": {"type": "EPSG", "properties": {"code": 3857}},
         "features": [
             { "type": "Feature",
               "geometry": {"type": "Point", "coordinates": [828895,5932832]},
               "properties": {"id": "Hello!"}
           },
             { "type": "Feature",
               "geometry": {"type": "Point", "coordinates": [827894,5934204]},
               "properties": {"id": "Is it me you're looking for?"}
           }
         ]
     }

# - define API call URL
url = 'https://api.walkalytics.com/v1/time-isochrone'

# Now make the actual API call as a POST request
try:
    req = urllib2.Request("{0}?{1}".format(url,urllib.urlencode(params)), 
                          json.dumps(pois),
                          {'Content-Type': 'application/json'})
    response = urllib2.urlopen(req)
    result = json.loads(response.read())
except urllib2.HTTPError, e:
    if e.code == 204:
        pass
    else:
        print("Error with request: {0}".format(e))
        sys.exit(-1)

# Check status
if result.get("status") != "success":
    print("API call did not succeed. Details: {}".format(result.get("msg")))
    sys.exit(-1)
        

# Print out service area in pixel and walking time in minutes for each POI
service_area_km2 = (result['service_area']) / 1000000.0
print("The service area for the source location is {:.2f} square km.".format(service_area_km2))
if result['pois'].has_key('features'):
    for poi in result['pois']['features']:
        id = poi['properties']['id']
        t  = poi['properties']['time'] 
        if t == -1:
            print("- POI '{0}' is not covered by the service area of the source point.".format(id))
        else:
            print("- POI '{0}' has a walking time of {1} minutes to the source point.".format(id,t/60))
else:
    print("No POIs found in the result.")

# Now save the image as a PNG file with an accompanying world file
if not result.has_key('img'):
    print("No image was requested.")
else:
    basename = "isochrone_{0}_{1}".format(params['x'], params['y'])
    print("Save image {0}.png with an accompanying world file.".format(basename))

    # - do a regexp match for extension, code and actual data (this is slightly
    #   more general than necessary)
    pattern = re.compile("^data:.+\/(.+);(.+),(.*)$")
    match = pattern.search(result['img'])
    # - extract extension, coding and actual data
    extension = match.group(1)
    code = match.group(2) 
    data = match.group(3)
    assert(code == "base64") # make sure we have base64
    assert(extension == "png") # make sure we have a PNG file

    # - write image to a file
    with open("{0}.{1}".format(basename,extension),"wb") as f:
        f.write(data.decode(code))
        
    # Now save the world file . The parameters for the world file are calculated based on
    # the lower-left corner, the number of rows and the cellsize.
    with open("{0}.pgw".format(basename),"wb") as f:
        f.write("{}\n0.0\n0.0\n".format(result["cellsize"]))
        f.write("{}\n{}\n{}\n".format(-result["cellsize"],
                                      result["xllcorner"], 
                                      result["yllcorner"]+(result["cellsize"]*result["nrows"])))
    
