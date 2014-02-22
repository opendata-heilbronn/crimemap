(function(cm, L) {
	'use strict';

	var map = {
		leafletMap: null,
		init: function() {
			var that = this;
			this.leafletMap = L.map('map', {
				center: [49.169494, 9.218607],
				zoom: 10,
				minZoom: 5,
				maxZoom: 15,
			});

			this.addTileLayer();

			var markers = new L.MarkerClusterGroup({
				showCoverageOnHover: false
			});
			cm.data.forEach(function(crime) {
				if (crime.lat) {
					var date = new Date(crime.date);
					var marker = new L.Marker([crime.lat, crime.lon]);
					marker.bindPopup('<p><strong>Datum:</strong> ' + date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear()
							+ '</p><p><strong>Art:</strong> ' + crime.type + '</p><p><strong>Polizeimeldung:</strong> ' + crime.description + '</p>');
					markers.addLayer(marker);
				}
			});
			this.leafletMap.addLayer(markers);
		},
		addTileLayer: function() {
			var attribution = '© 2013 CloudMade – Map data <a href="http://creativecommons.org/licenses/by-sa/2.0/">CCBYSA</a> 2013 <a href="http://www.openstreetmap.org/">OpenStreetMap.org</a> contributors – <a href="http://cloudmade.com/terms_conditions">Terms of Use</a>';
			L.tileLayer('http://{s}.tile.cloudmade.com/036a729cf53d4388a8ec345e1543ef53/44094/256/{z}/{x}/{y}.png', {
				'maxZoom': 18,
				'attribution': attribution
			}).addTo(this.leafletMap);
		}
	};

	cm.map = map;
})(cm, L);
