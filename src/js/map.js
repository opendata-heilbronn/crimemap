(function(cm, L) {
	'use strict';

	var leafletMap = null;
	var markerCluster = null;
	var markers = [];
	var areas = [];
	var colorScheme = ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"];
	var info = [];

	var formatNumber = function(n) {
		var rx = /(\d+)(\d{3})/;
		return String(n).replace(/^\d+/, function(w) {
			while (rx.test(w)) {
				w = w.replace(rx, '$1.$2');
			}
			return w;
		});
	};

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
		createInfoControl();
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
				markers.push({
					'crime': crime,
					'marker': marker
				});
			}
		});

		leafletMap.addLayer(markerCluster);
	};

	var createInfoControl = function() {
		info = L.control();

		info.onAdd = function(map) {
			this._div = L.DomUtil.create('div', 'info');
			this.update();
			return this._div;
		};

		info.update = function(feature) {
			var html = '';
			if (feature) {
				var crimes = feature.properties.crimes;
				var crimeTypes = {
					'Wohnungseinbruch': {
						label: 'Wohnungseinbrüche',
						count: 0
					},
					'Autoaufbruch': {
						label: 'Autoaufbrüche',
						count: 0
					},
					'Metalldiebstahl': {
						label: 'Metalldiebstähle',
						count: 0
					}
				};
				crimes.forEach(function(crime) {
					crimeTypes[crime.type].count++;
				});

				var cValue = '' + (Math.round(feature.properties.comparisonValue * 100000) / 100);
				cValue = cValue.replace(/\./, ',');

				html += '<h4>' + feature.properties.GEN + '</h4>';
				html += '<strong>Einwohner:</strong> ' + formatNumber(feature.properties.citizens);
				html += '<br /><strong>Diebstähle:</strong> ' + feature.properties.numberOfCrimes;
				html += '<br /><strong>Diebstähle je 1000 Einwohner:</strong> ' + cValue + '<br /><small>(maßgeblich für die Einfäbrung)</small><br />';
				Object.keys(crimeTypes).forEach(function(key) {
					var crimeType = crimeTypes[key];
					html += '<br />' + crimeType.label + ': ' + crimeType.count;
				});
			} else {
				if (!this._div.innerHTML) {
					html += '<h4>Gemeinde</h4>Mit der Maus auswählen';
				}
			}
			if (html) {
				this._div.innerHTML = html;
			}
		};

		info.addTo(leafletMap);
	};

	var addAreaLayers = function() {
		$.getJSON('data/gemeinden.geojson', function(geojson) {
			L.geoJson(geojson.features, {
				style: {
					'opacity': 0.5,
					'weight': 1,
					'color': '#666',
					'fillOpacity': 0.6
				},
				onEachFeature: function(feature, layer) {
					areas.push({
						'feature': feature,
						'layer': layer
					});

					layer.on("mouseover", function(e) {
						info.update(feature);
					});

					layer.on("mouseout", function(e) {
						info.update();
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

		layer.setStyle({
			'fillColor': colorScheme[colorIndex],
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
		if (feature.properties.comparisonValue) {
			return feature.properties.comparisonValue;
		}

		var bounds = layer.getBounds();

		var citizens = feature.properties['EWZ_M'] + feature.properties['EWZ_W'];
		var crimes = [];
		markers.forEach(function(marker) {
			if (bounds.contains(marker.marker.getLatLng())) {
				crimes.push(marker.crime);
			}
		});
		var numberOfCrimes = crimes.length;

		var comparisonValue = numberOfCrimes ? numberOfCrimes / citizens : 0;
		feature.properties.citizens = citizens;
		feature.properties.numberOfCrimes = numberOfCrimes;
		feature.properties.crimes = crimes;
		feature.properties.comparisonValue = comparisonValue;

		return comparisonValue;
	};

	var addTileLayer = function() {
		var attribution = '© 2013 CloudMade – Map data <a href="http://creativecommons.org/licenses/by-sa/2.0/">CCBYSA</a> 2013 <a href="http://www.openstreetmap.org/">OpenStreetMap.org</a> contributors – <a href="http://cloudmade.com/terms_conditions">Terms of Use</a>';
		L.tileLayer('http://{s}.tile.cloudmade.com/036a729cf53d4388a8ec345e1543ef53/123058/256/{z}/{x}/{y}.png', {
			'maxZoom': 18,
			'attribution': attribution
		}).addTo(leafletMap);
	};

	cm.map = {
		'init': init
	};
})(cm, L);
