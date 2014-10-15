var map;  
var walkalytics;


require(["esri/map", "esri/layers/MapImageLayer","esri/layers/MapImage" ,
         "dojo/dom", "dojo/domReady!"],   
        
function(Map,  MapImageLayer ,MapImage,dom ) {   
    map = new Map("mapDiv", {  
        center: [7.448148,46.947999],  
        zoom: 15,  
        basemap: "streets"  
    });  

    walkalytics = {};
    walkalytics.loading = false;

    var loading = dom.byId("loading");
    
    function showLoading() {
        walkalytics.loading = true;
        esri.show(loading);
        map.disableMapNavigation();
        map.hideZoomSlider();
    }
    
    function hideLoading(error) {
        walkalytics.loading = false;
        esri.hide(loading);
        map.enableMapNavigation();
        map.showZoomSlider();
    }

    dojo.connect(map, "onUpdateStart", showLoading);
    dojo.connect(map, "onUpdateEnd", hideLoading);

    
    walkalytics.layer = new MapImageLayer({  
        'id' : 'isochrone',  
        'opacity' : 0.9,
        'hasAttribution': true
    });  
    
    
    walkalytics.set_apikey = function(apikey) {
        walkalytics.apikey = apikey;
    }
    

    walkalytics.renderIsochrone = function(evt) {
        if (walkalytics.loading) { return; }
        showLoading();

        var x = evt.mapPoint.x;
        var y = evt.mapPoint.y;

        // set position
        map.centerAt(evt.mapPoint);
        
        if (walkalytics.mi) {
            walkalytics.layer.removeImage(walkalytics.mi);  
        }


        var url = "https://api.walkalytics.com/v1/isochrone?x="+x+"&y="+y+"&outputsize="+512+"&key"+"&subscription-key="+walkalytics.apikey;

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
                
                var thisExtent = { 'xmin': data["xllcorner"], 'ymin': data["yllcorner"],
                                   'xmax': data["xllcorner"] + data["ncols"] * data["cellsize"],
                                   'ymax': data["yllcorner"] + data["nrows"] * data["cellsize"],
                                   'spatialReference': { 'wkid': 3857 }
                                 };

                walkalytics.mi = new MapImage({  
                    'href' : data['img'],  
                    'extent' : thisExtent
                });  
                
                walkalytics.layer.addImage(walkalytics.mi);  
                
                map.addLayer(walkalytics.layer);  
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

    map.on("click", walkalytics.renderIsochrone);
    
});  
  
  
