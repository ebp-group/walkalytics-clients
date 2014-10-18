// create map
var map = new L.map('map', {
  center: new L.latLng(46.947999, 7.448148),
  zoom: 15
});

// add basemap
new L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
  subdomains: ['1', '2', '3', '4'],
  attribution: 'Map data © <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors | Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">'
}).addTo(map);

// walkalytics configs
var walkalytics = { };
walkalytics.maxminutes = 16; 
walkalytics.clicked = 0;
walkalytics.set_apikey = function(apikey) {
    walkalytics.apikey = apikey;
}

// create marker
walkalytics.marker = new L.marker(map.getCenter());

// add an event listener to map
map.on('click', function(evt) {
  walkalytics.click(evt.latlng);
})

walkalytics.click = function(coords) {
    if (!coords) { return true };
    if (walkalytics.clicked == 0) {
        // remove existing marker
        map.removeLayer(walkalytics.marker);

        // block clicks until we're done
        walkalytics.clicked = 1;

        // change cursor
        $(".map").css({"cursor":"wait"})
        
        // set and show marker at new location
        walkalytics.marker.setLatLng(coords);
        walkalytics.marker.addTo(map);
        
        // pan to clicked locatiom
        map.panTo(coords, {
          duration: 1.0 // seconds
        });
        
        // if existing, remove isochrone layer
        if (walkalytics.isochrone_layer) { map.removeLayer(walkalytics.isochrone_layer);}
        
        // request new isochrone layer
        walkalytics.calc_isochrone(coords);
    }
}

walkalytics.calc_isochrone = function(coords) {
    // project coordinates: lat/lng (WGS84) to meters (EPSG:3857) for api call
    projcoords = L.CRS.EPSG3857.project(coords);

    var x = parseInt(projcoords["x"]);
    var y = parseInt(projcoords["y"]);
    var url = "https://api.walkalytics.com/v1/isochrone?";

    inputparams ={ "x": x,
                   "y": y,
                   "subscription-key": walkalytics.apikey,
                   "maxduration": walkalytics.maxminutes*60,
                   "outputsize": 512
                 }

    url = url + jQuery.param(inputparams);

    $.ajax({ 
        type: "POST",
        url: url, 
        crossDomain: true,
        dataType: "json",
        failure: function(errMsg) {
            alert(errMsg);
            $(".map").css({"cursor":"default"})
            walkalytics.clicked = 0;
        },
        success: function( data ) {
            if (data["status"] == "error") {
                alert(data["msg"]);
                $(".map").css({"cursor":"default"})
                walkalytics.clicked = 0;
                return(false);
            }

            llcoords = walkalytics.metersToLatLng(
              data["xllcorner"],
              data["yllcorner"]
              );

            urcoords = walkalytics.metersToLatLng(
              data["xllcorner"] + data["ncols"] * data["cellsize"],
              data["yllcorner"] + data["nrows"] * data["cellsize"]
              );
            
            var imageBounds = L.latLngBounds(llcoords, urcoords);

            walkalytics.isochrone_layer = new L.imageOverlay(
              data["img"],
              imageBounds,
              {
                opacity: 0.7,
                attribution: '<a href="http://walkalytics.com">Walktime &copy; EBP</a>'
              });

            map.addLayer(walkalytics.isochrone_layer);
          
            $(".map").css({"cursor":"default"})
            walkalytics.clicked = 0;
        }
    }).fail(function(response) {
      $(".map").css({"cursor":"default"})
      walkalytics.clicked = 0;
      if (response.status == 429) {
        alert("Rate limit exceeded.");
      }
      else if (response.status == 403) {
        alert("It seems you are not authorized to use this service.");
      }
      else {
        alert("Walkalytics service is currently not available.");
      }
    });
}

// unproject coordinates: meters (EPSG:3857) to lat/lng (WGS84)
walkalytics.metersToLatLng = function(x, y) {
  earthradius = 6378137;
  return map.options.crs.projection.unproject(new L.point(x, y).divideBy(earthradius))
}