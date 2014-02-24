(function(cm, L) {
	'use strict';

	var leafletMap = null;
	var markerCluster = null;
	var markers = [];
	var areas = [];
	var scheme = ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"];

	var init = function() {
		L.Icon.Default.imagePath = 'img/';
		leafletMap = L.map('map', {
			center: [49.15, 9.2],
			zoom: 11,
			minZoom: 5,
			maxZoom: 16,
		});

		addTileLayer();
		addMarkers();
		addAreaLayers();
	};

	var addMarkers = function() {
		markerCluster = new L.MarkerClusterGroup({
			maxClusterRadius: 60,
			animateAddingMarkers: true
		});

		cm.data.forEach(function(crime) {
			if (crime.lat) {
				var date = new Date(crime.date);
				var marker = new L.Marker([crime.lat, crime.lon]);
				marker.bindPopup('<p><strong>Datum:</strong> ' + date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear()
						+ '</p><p><strong>Art:</strong> ' + crime.type + '</p><p><strong>Polizeimeldung:</strong> ' + crime.description + '</p>');

				markerCluster.addLayer(marker);
				markers.push(marker);
			}
		});

		leafletMap.addLayer(markerCluster);
	};

	var addAreaLayers = function() {
		$.getJSON('js/gemeinden.geojson', function(geojson) {
			L.geoJson(geojson.features, {
				style: {
					'opacity': 0.5,
					'weight': 1,
					'color': '#AAA'
				},
				onEachFeature: function(feature, layer) {
					areas.push({
						'feature': feature,
						'layer': layer
					});
				}
			}).addTo(leafletMap);

			setAreaStyles();
		});
	};

	var setAreaStyles = function() {
		var minMax = getMinMax();

		areas.forEach(function(area) {
			setAreaStyle(area.feature, area.layer, minMax);
		});
	};

	var setAreaStyle = function(feature, layer, minMax) {
		var comparisonValue = getComparisonValue(feature, layer);
		var percent = comparisonValue > 0 ? comparisonValue / minMax[1] : 0;
		var colorIndex = Math.round(percent * 8);

		console.log('comparisonValue: ' + comparisonValue + ' - percent: ' + Math.round(percent * 100) + ' - colorIndex: ' + colorIndex);

		layer.setStyle({
			'fillColor': scheme[colorIndex],
		});
	};

	var getMinMax = function() {
		var min = 1000;
		var max = 0;
		areas.forEach(function(area) {
			var comparisonValue = getComparisonValue(area.feature, area.layer);
			if (comparisonValue < min) {
				min = comparisonValue;
			}
			if (comparisonValue > max) {
				max = comparisonValue;
			}
		});
		return [min, max];
	};

	var getComparisonValue = function(feature, layer) {
		var bounds = layer.getBounds();

		var citizens = feature.properties['EWZ_M'] + feature.properties['EWZ_W'];
		var numberOfCrimes = 0;
		markers.forEach(function(marker) {
			if (bounds.contains(marker.getLatLng())) {
				numberOfCrimes++;
			}
		});

		var comparisonValue = numberOfCrimes ? numberOfCrimes / citizens : 0;
		return comparisonValue;
	};

	var addTileLayer = function() {
		var attribution = '© 2013 CloudMade – Map data <a href="http://creativecommons.org/licenses/by-sa/2.0/">CCBYSA</a> 2013 <a href="http://www.openstreetmap.org/">OpenStreetMap.org</a> contributors – <a href="http://cloudmade.com/terms_conditions">Terms of Use</a>';
		L.tileLayer('http://{s}.tile.cloudmade.com/036a729cf53d4388a8ec345e1543ef53/44094/256/{z}/{x}/{y}.png', {
			'maxZoom': 18,
			'attribution': attribution
		}).addTo(leafletMap);
	};

	cm.map = {
		'init': init
	};
})(cm, L);
