var map = new ol.Map({
    layers: [
        new ol.layer.Tile({source: new ol.source.MapQuest({layer: 'osm'}) })
    ],
    renderer: 'canvas',
    view: new ol.View({
        center: [ 828730.03, 5933577.79],
        zoom: 15
    }),
    target: 'map'
});

var walkalytics = { };
walkalytics.maxminutes = 16; 
walkalytics.clicked = 0;
walkalytics.projection = map.getView().getProjection();
walkalytics.set_apikey = function(apikey) {
    walkalytics.apikey = apikey;
}
walkalytics.marker = new ol.Overlay({
  position: map.getView().getCenter(),
  positioning: 'center-center',
  element: document.getElementById('marker'),
  stopEvent: false
});
map.addOverlay(walkalytics.marker);

map.on('singleclick', function(evt) {
  walkalytics.click(evt.coordinate);
})

walkalytics.click = function(coords) {
    if (!coords) { return true };
    if (walkalytics.clicked == 0) {
        // hide existing marker
        $("#marker").hide();
        
        // block clicks until we're done
        walkalytics.clicked = 1;
        
        // show marker at new location
        $(".map").css({"cursor":"wait"})
        walkalytics.marker.setPosition(coords);
        $("#marker").show();
        
        // pan to location
        var view = map.getView();
        var pan = ol.animation.pan({
            duration: 1000,
            source: /** @type {ol.Coordinate} */ (view.getCenter())
        });
        map.beforeRender(pan);
        view.setCenter(coords);
        
        if (walkalytics.isochrone_layer) { map.removeLayer(walkalytics.isochrone_layer);}
        
        walkalytics.calc_isochrone(coords);        
    }
}

walkalytics.calc_isochrone = function(coords) {
    var x = parseInt(coords[0]);
    var y = parseInt(coords[1]);
    var url = "https://api.walkalytics.com/v1/time-isochrone?";

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
            var thisExtent = [ data["xllcorner"], data["yllcorner"],
                               data["xllcorner"] + data["ncols"] * data["cellsize"],
                               data["yllcorner"] + data["nrows"] * data["cellsize"] 
                             ];
          
            // show PNG
            walkalytics.isochrone_layer = new ol.layer.Image({
                source: new ol.source.ImageStatic({
                    attributions: [
                        new ol.Attribution({
                            html: '<a href="http://walkalytics.com">Walktime &copy; EBP</a>'
                        })
                    ],
                    url: data["img"],
                    imageSize: [data["ncols"], data["nrows"] ],
                    projection: walkalytics.projection,
                    imageExtent: thisExtent
                })
            });
            map.addLayer(walkalytics.isochrone_layer);
            $("#marker").show();
          
            $(".map").css({"cursor":"default"})
            walkalytics.clicked = 0;
        }
    }).fail(function(response) {
      $(".map").css({"cursor":"default"})
      $("#marker").hide();
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

