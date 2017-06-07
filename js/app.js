document.addEventListener("deviceready", onDeviceReady, false);
			
			localStorage.setalam = 1;
			
			
			
			
			function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) 
			{
				  var R = 6371; // Radius of the earth in km
				  var dLat = deg2rad(lat2-lat1);  // deg2rad below
				  var dLon = deg2rad(lon2-lon1); 
				  var a = 
				    Math.sin(dLat/2) * Math.sin(dLat/2) +
				    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
				    Math.sin(dLon/2) * Math.sin(dLon/2)
				    ; 
				  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
				  var d = parseFloat(R * c); // Distance in km
				  return d.toFixed(20);
			}

			function deg2rad(deg) 
			{
				  return deg * (Math.PI/180)
			}
			
			
			function addLeadingZeros (n, length)
			{
				var str = (n > 0 ? n : -n) + "";
				var zeros = "";
				for (var i = length - str.length; i > 0; i--)
					zeros += "0";
				zeros += str;
				return n >= 0 ? zeros : "-" + zeros;
			}
			function onDeviceReady() 
			{
				var today = new Date();
				
				var MyDateString;

				MyDateString = addLeadingZeros(today.getFullYear(),4) + '-' +   addLeadingZeros((today.getMonth()+1),2) + '-' + addLeadingZeros(today.getDate(),2);
				
				var time = addLeadingZeros(today.getHours(),2) + ":" + addLeadingZeros(today.getMinutes(),2) + ":" + addLeadingZeros(today.getSeconds(),2);
				var dateTime = MyDateString+'--'+time;
				var new_time = dateTime.toString();
				console.log(device.uuid);
				
				var bgLocationServices =  window.plugins.backgroundLocationServices;
				
				bgLocationServices.configure({
					//Both
					desiredAccuracy: 20, // Desired Accuracy of the location updates (lower means more accurate but more battery consumption)
					distanceFilter: 5, // (Meters) How far you must move from the last point to trigger a location update
					debug: true, // <-- Enable to show visual indications when you receive a background location update
					interval: 10000, // (Milliseconds) Requested Interval in between location updates.
					useActivityDetection: true, // Uses Activitiy detection to shut off gps when you are still (Greatly enhances Battery Life)
     
					//Android Only
					notificationTitle: 'My Location', // customize the title of the notification
					notificationText: 'Get Safe', //customize the text of the notification
					fastestInterval: 10000 // <-- (Milliseconds) Fastest interval your app / server can handle updates
     
				});
				
				bgLocationServices.registerForLocationUpdates(function(location) 
				{
				 var get_update = JSON.stringify(location);
					//console.log("We got an BG Update" + get_update);
					send_gps_data(location,"backgroud");
				}, function(err) 
				{
					console.log("Error: Didnt get an update", err);
				});
				
				bgLocationServices.registerForActivityUpdates(function(activities) 
				{
					//console.log("We got an activity update" + activities);
				}, function(err) 
				{
					//console.log("Error: Something went wrong", err);
				});
				bgLocationServices.start();
			}
			
			function send_gps_data(position,function_name)
			{
				jQuery("#map_link").show();

				var speed = 0;
				var today = new Date();
				var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
				var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
				var dateTime = date+'--'+time;
				var new_time = dateTime.toString();

					
				var array_data = {"datetime":new_time,"function":function_name};

				if( (typeof device === "object") && (device !== null) ) //for mobile
				{
					jQuery.each(device, function( key2, value2 )
						{
							array_data[key2] = value2;
						});
				}
				else													//for web
				{
					 array_data.device_id = 0;
					 array_data.device_serial = 0;
				}

				jQuery.each(position, function( key3, value3 )
				{
					array_data[key3] = value3;
					if(key3 == "latitude")
						localStorage.currentlat = value3;
					else if(key3 == "longitude")
						localStorage.currentlng = value3;
					else if(key3 == "speed")
						speed = value3;
				});



				//mySound = document.createElement('audio');
				//mySound.src = 'ring.mp3';


				

				//Localstorage section
				var reminderlat = localStorage.reminderlat;
				var reminderlng = localStorage.reminderlng;
				var lat = localStorage.currentlat;
				var lng = localStorage.currentlng;
				var distkm = getDistanceFromLatLonInKm(lat,lng,reminderlat,reminderlng);
				//var distkm = "NaN"; //for testing
				jQuery("#display_extra_result").html("");
				speed = parseFloat(speed);;
				//alert(speed+" "+typeof speed);
				if(!isNaN(speed))
				{
				        jQuery("#display_extra_result").append("<br>Speed: "+speed+" M/sec");
                        var speedinkm = speed*3.6;
                        jQuery("#progress").show();
                        jQuery( "#progress" ).attr( "value", speedinkm);
                    	jQuery("#display_extra_result").append("<br>Speed: "+speedinkm+" Km/h<br>");
				}
				else
				{
				        jQuery("#progress").hide();
				}
				if(!isNaN(distkm))
					{
						array_data.reminderlat = reminderlat;
						array_data.reminderlng = reminderlng;
						jQuery("#display_extra_result").append("Distance: "+distkm+"km");
						
						if(localStorage.setalam == 1 && distkm < 10)
						{
							if(mySound.duration > 0 && !mySound.paused && !mySound.ended)
							{
								jQuery("#display_extra_result").append("---Sound Playing");

							}
							else
							{
								jQuery("#display_extra_result").append("---Sound Stop");
								//mySound.status() //mySound.stop()
								//mySound.play();
								navigator.vibrate(3000);
							}
								
							
						}
					}

				
				
				var json_encode = JSON.stringify(array_data);
				var old_data = localStorage.locationdata;
				var old_data1 = "";
				
				
				
				
				if(old_data == undefined || old_data == "")
				{
					old_data1 = json_encode;
				}
				else
				{
					old_data1 = json_encode+","+old_data;
				}
				if(navigator.onLine)  //1==0
				{
					var jsonObj = jQuery.parseJSON('[' + old_data1 + ']');
					
					jQuery.each(jsonObj, function( key, value ) 
					{
						var para = "";
						jQuery.each(value, function(key1, value1)
						{
							para += "&"+key1+"="+value1;
						});
						para = para.slice(1);
						var ajax_url = "http://181.215.99.99:8585/?"+para;
						//alert(para);
						jQuery("#display_result").html("Online - "+old_data1+"<br>");
						jQuery.get( ajax_url, function( data ) 
						{
							jQuery("#result_part").append("<br>Ajax Successful --- "+para);
						},"json").done(function()
						{
							jQuery("#result_part").append("<br>Ajax Complete");
						}).fail(function(jqXHR, textStatus, errorThrown) 
						{
							if (textStatus == 'timeout')
								jQuery("#result_part").append("<br>Ajax Error --- Timeout");
								

							if (textStatus == 'error')
								jQuery("#result_part").append("<br>Ajax Error --- Error");

						});
						old_data1 = "";
					});

				}
				else
				{
					jQuery("#display_result").html("Offline - "+old_data1+"<br>");
				}
				localStorage.locationdata = old_data1;
			}
			
			
			function onSuccess(position) 
			{  
				send_gps_data(position.coords,"On_Screen");
			}
			function onError(e)
			{
				//alert("Error");
				switch(e.code) 
				{
					case e.PERMISSION_DENIED:
						jQuery("#result_part").append("<br>GPS Error --- User denied the request for Geolocation.");
						break;
					case e.POSITION_UNAVAILABLE:
						jQuery("#result_part").append("<br>GPS Error --- Location information is unavailable.");
						break;
					case e.TIMEOUT:
						jQuery("#result_part").append("<br>GPS Error --- The request to get user location timed out.");
						break;
					case e.UNKNOWN_ERROR:
						jQuery("#result_part").append("<br>GPS Error --- Unknown Error.");
						break;
				}
			}
			function load_map()
			{
				if (navigator.geolocation) 
				{	
					navigator.geolocation.getCurrentPosition(onSuccess, onError, {timeout: 10000, enableHighAccuracy: true});
					navigator.geolocation.watchPosition(onSuccess, onError, { maximumAge: 10000, timeout: 20000, enableHighAccuracy: true});
				}
				else
				{
					jQuery("#result_part").append("<br>GPS Error --- location is not enable");
				}
			}
			
			
			

		      
		      
		      var app = angular.module("myApp", ["ngRoute",'ngPlacesMap']);

		      app.config(function($routeProvider) {
		         $routeProvider
		         .when("/", {
		             templateUrl : "index-load.html"
		         })
		         .when("/map", {
		             templateUrl : "map.html"
		         });
		     });
		     app.controller('mapctrl', function ($scope,$location)
		     {
                $scope.customCallbackFunction = function( pickedPlace ){
                  	        	//console.log( pickedPlace );
                  	        	localStorage.reminderlat = pickedPlace.geometry.location.lat();
                  	        	localStorage.reminderlng = pickedPlace.geometry.location.lng();
                  	        	$scope.confirmlocation = true;
                  	        	$scope.pickedPlace = "Confirm This Location";

                  	        }
                $scope.confirmationok = function()
                    {
                        //alert("hi");
                        $location.path('/');
                    }
             });
             app.controller('homectrl',function($scope)
             {
                $scope.load_map = function()
                {
                    if (navigator.geolocation)
                    {
                    	navigator.geolocation.getCurrentPosition(onSuccess, onError, {timeout: 10000, enableHighAccuracy: true});
                    	navigator.geolocation.watchPosition(onSuccess, onError, { maximumAge: 10000, timeout: 20000, enableHighAccuracy: true});
                    }
                    else
                    {
                    	jQuery("#result_part").append("<br>GPS Error --- location is not enable");
                    }

                };
             });

