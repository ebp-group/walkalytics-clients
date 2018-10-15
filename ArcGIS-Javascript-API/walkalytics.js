var walkalytics = {};


require(["esri/map", "esri/layers/MapImageLayer",
         "esri/layers/OpenStreetMapLayer","esri/layers/MapImage" ,
         "esri/graphic","esri/symbols/SimpleMarkerSymbol", "esri/Color",
         "dojo/dom", "dojo/domReady!"],   
        
function(Map,  MapImageLayer , OpenStreetMapLayer,MapImage, Graphic, SimpleMarkerSymbol, Color, dom ) {   
    walkalytics.map = new Map("mapDiv", {  
        center: [7.448148,46.947999],  
        zoom: 14,  
        basemap: "topo"
    });

    // isochrone layer
    walkalytics.isochrone_layer = new MapImageLayer({  
        'id' : 'isochrone',  
        'opacity' : 0.9,
        'hasAttribution': true
    });  
    walkalytics.map.addLayer(walkalytics.isochrone_layer);  

    walkalytics.loading = false;

    // define symbol
    walkalytics.symbol = new SimpleMarkerSymbol();
    walkalytics.symbol.setStyle(SimpleMarkerSymbol.STYLE_SQUARE);
    walkalytics.symbol.setColor(new Color([153,0,51,0.75]));


    var loading = dom.byId("loading");
    
    function showLoading() {
        walkalytics.loading = true;
        esri.show(loading);
        walkalytics.map.disableMapNavigation();
        walkalytics.map.hideZoomSlider();
    }
    
    function hideLoading(error) {
        walkalytics.loading = false;
        esri.hide(loading);
        walkalytics.map.enableMapNavigation();
        walkalytics.map.showZoomSlider();
    }

    dojo.connect(walkalytics.map, "onUpdateStart", showLoading);
    dojo.connect(walkalytics.map, "onUpdateEnd", hideLoading);

    
    walkalytics.osmlayer = new MapImageLayer({  
        'id' : 'isochrone',  
        'opacity' : 0.9,
        'hasAttribution': true
    });  
    
    walkalytics.map.addLayer(walkalytics.osmlayer);  

    
    walkalytics.set_apikey = function(apikey) {
        walkalytics.apikey = apikey;
    }
    

    walkalytics.renderIsochrone = function(evt) {
        if (walkalytics.loading) { return; }
        showLoading();

        var x = evt.mapPoint.x;
        var y = evt.mapPoint.y;

        // set position
        walkalytics.map.centerAt(evt.mapPoint);

        // set marker
        if (walkalytics.graphic) { walkalytics.map.graphics.remove(walkalytics.graphic); }
        walkalytics.graphic = new Graphic(evt.mapPoint, walkalytics.symbol)
        walkalytics.map.graphics.add(walkalytics.graphic);
        
        if (walkalytics.isochrone_image) {  walkalytics.isochrone_layer.removeImage(walkalytics.isochrone_image); }

        var url = "https://api.walkalytics.com/v1/isochrone?x="+x+"&y="+y+"&outputsize="+512+"&subscription-key="+walkalytics.apikey;

        require(["dojo/request"], function(request){
            request.post(url, {
                data: {},
                handleAs: "json",
                headers: {'Content-Type':'application/json', 
                          'Accept': "application/json, text/javascript, */*; q=0.01",
                          "X-Requested-With": null}
            }).then(function(data){
                if (data["status"] == "error") {
                    alert(data["msg"]);
                    hideLoading();

                    return(false);
                }
                
                // define extent and show isochrone
                var thisExtent = { 'xmin': data["xllcorner"], 'ymin': data["yllcorner"],
                                   'xmax': data["xllcorner"] + data["ncols"] * data["cellsize"],
                                   'ymax': data["yllcorner"] + data["nrows"] * data["cellsize"],
                                   'spatialReference': { 'wkid': 3857 }
                                 };

                walkalytics.isochrone_image = new MapImage({  
                    'href' : data['img'],  
                    'extent' : thisExtent
                });  
                
                walkalytics.isochrone_layer.addImage(walkalytics.isochrone_image);  
                hideLoading();

            },
            function (err) {
                hideLoading();
                var response = err.response;
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
        });

    }

    walkalytics.map.on("click", walkalytics.renderIsochrone);
    
});  
  
  
