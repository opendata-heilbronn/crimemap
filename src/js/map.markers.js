(function (cm, L) {
    'use strict';

    var icons = {
        'Einbruch': L.AwesomeMarkers.icon({
            icon: 'home',
            prefix: 'icon',
            extraClasses: 'icon',
            markerColor: 'darkblue'
        }),
        'Autoaufbruch': L.AwesomeMarkers.icon({
            icon: 'cab',
            prefix: 'icon',
            extraClasses: 'icon',
            markerColor: 'blue'
        })
    };

    var generateAddress = function (crime) {
        var address = crime.city;
        if (crime.district) {
            address += ', ' + crime.district;
        }
        if (crime.street) {
            address += ', ' + crime.street;
        }
        return address;
    };

    cm.map.markers = function (mapInstance, legacyMarkersArray) {
        var cluster = new L.MarkerClusterGroup({
            maxClusterRadius: 50,
            animateAddingMarkers: false
        });
        mapInstance.addLayer(cluster);

        this.update = function (crimes) {
            cluster.clearLayers();
            var markers = [];
            crimes.forEach(function (crime) {
                var marker = new L.Marker([crime.lat, crime.lon], {icon: icons[crime.type]});
                marker.bindPopup('<p><strong>' + crime.type + ' am ' + crime.date + '</strong></p><p>' + generateAddress(crime) + '</p><p style="font-size:12px"><em>Polizeimeldung:</em> ' + crime.description + '</p>');
                markers.push(marker);
                // TODO remove after refactoring - backwards-compatibility
                legacyMarkersArray.push({
                    'crime': crime,
                    'marker': marker
                });
            });
            cluster.addLayers(markers);
        };

        return this;
    };
})(cm, L);
