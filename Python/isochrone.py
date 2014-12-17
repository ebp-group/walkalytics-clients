# Example call for the isochrone API at Walkalytics
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
import time

from multiprocessing import Pool, freeze_support
from multiprocessing.dummy import Pool as ThreadPool 


# Configuration

# - set the api_key by reading a netrc file with API key. 
try:
    secrets = netrc.netrc("walkalytics-api-key")
except IOError:
    print("[Error] Create a file 'walkalytics-api-key' with your API key from https://dev.walkalytics.com.")
    print("[Error] See 'walkalytics-api-key.sample' for the required netrc-style format.")
    sys.exit(-1)

_, _, api_key = secrets.authenticators("api.walkalytics.com")

# - Alternatively, you can replace the two lines above with explicitly set
#   api_key with your key from https://dev.walkalytics.com/developer


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
url = 'https://api.walkalytics.com/v1/isochrone'


def parse_base64(s):
    semicolon = s.find(";")
    comma = s.find(",")
    slash = s.find("/")
    extension = s[slash+1:semicolon]
    code = s[semicolon+1:comma]
    data = s[comma+1:]
    return (extension, code, data)

def call_walkalytics(source,basename="isochrone"):
    x,y =  source

    print("Source location is ({},{}).".format(x,y))

    # - set API parameters and set of POIs
    params = {
        'x' : x,
        'y' : y,
        "only_pois": 'false', # or "true"
        "outputsize": 512,    # max is currently 720
        # more parameters are possible, see API documentation
        'key': api_key,
        'raw_data': 'true'
    }

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
            return False

    # Check status
    if result.get("status") != "success":
        print("API call did not succeed. Details: {}".format(result.get("msg")))
        return False
            
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
    if result.has_key('img'):
        filename = "{}_{}_{}".format(basename,params['x'], params['y'])
        print("Save image {0}.png with an accompanying world file.".format(filename))

        (extension, code, data) = parse_base64(result['img'])
        assert(code == "base64") # make sure we have base64
        assert(extension == "png") # make sure we have a PNG file

        # - write image to a file
        with open("{0}.{1}".format(filename,extension),"wb") as f:
            f.write(data.decode(code))
            
        # Now save the world file . The parameters for the world file are calculated based on
        # the lower-left corner, the number of rows and the cellsize.
        with open("{0}.pgw".format(filename),"wb") as f:
            f.write("{}\n0.0\n0.0\n".format(result["cellsize"]))
            f.write("{}\n{}\n{}\n".format(-result["cellsize"],
                                          result["xllcorner"], 
                                          result["yllcorner"]+(result["cellsize"]*result["nrows"])))
    elif result.has_key("raw_data"):
        filename = "{}_{}_{}".format(basename,params['x'], params['y'])
        print("Save image {0}.asc.gz.".format(filename))
        (extension, code, data) = parse_base64(result['raw_data'])
        assert(code == "base64") # make sure we have base64
        assert(extension == "gzip") # make sure we have a .gz file
        # - write image to a file
        with open("{0}.asc.gz".format(filename),"wb") as f:
            f.write(data.decode(code))
    else:
        print("No image was requested.")

    return True
            
if __name__ == '__main__':
    # - read x and y coordinates from command line arguments, or just use default coords.
    try:
        sources  = []
        l = sys.argv[1:]
        for el in l:
            sources.append(tuple([int(x) for x in el.split(",")]))
            assert(len(sources[-1])==2) 
    except AssertionError:
        print "Error: Arguments should be of the form : x1,y1 (x2,y2) (x3,y3) ..."
        sys.exit(-1)
    except ValueError:
        sources  = [ (828895, 5932832) ]

    # start timer
    t0 = time.clock()

    # calculation
    
    # # sequential version
    # for source in sources:
    #     call_walkalytics(source)

    # parallel version
    freeze_support() 
    pool = ThreadPool(4)
    pool.map(call_walkalytics, sources)
    pool.close()
    pool.join()

    # stop timer
    t1 = time.clock()
    if len(sources):
        print("Effective seconds per call: {:.4f}s".format((t1-t0)/len(sources)))
    else:
        print "Example call: > isochrone.py 828895,5932832 828895,5932834 828895,5932835"
    
