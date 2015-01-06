(function (cm, L) {
    'use strict';

    var leafletMap = null;
    var markers = [];
    var areas = [];
    var colorScheme = ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"];
    var info = [];

    var formatNumber = function (n) {
        var rx = /(\d+)(\d{3})/;
        return String(n).replace(/^\d+/, function (w) {
            while (rx.test(w)) {
                w = w.replace(rx, '$1.$2');
            }
            return w;
        });
    };

    var init = function () {
        leafletMap = L.map('map', {
            center: [49.15, 9.2],
            zoom: 10,
            minZoom: 5,
            maxZoom: 16
        });

        addTileLayer();
        var markersInstance = new cm.map.markers(leafletMap, markers);
        markersInstance.update(cm.data);
        addAreaLayers();
        createInfoControl();
    };

    var addTileLayer = function () {
        var attribution = '<a href="http://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a> | <a href="http://www.mapbox.com/about/maps/" target="_blank">Mapbox Terms &amp; Feedback</a> | <a href="http://www.stimme.de/meta/ueberuns/impressum/Impressum;art5015,1284151">Impressum</a> | Polizeiberichte Nov. 13 - Apr. 14 | Alle Angaben ohne Gewähr!';
        L.tileLayer('https://{s}.tiles.mapbox.com/v3/codeforheilbronn.i4f96icg/{z}/{x}/{y}.png', {
            'maxZoom': 18,
            'attribution': attribution
        }).addTo(leafletMap);
    };

    var createInfoControl = function () {
        info = L.control();

        info.onAdd = function () {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };

        info.update = function (feature) {
            var html = '';
            if (feature) {
                var crimes = feature.properties.crimes;
                var crimeTypes = {
                    'Einbruch': {
                        label: 'Wohnungseinbrüche',
                        count: 0
                    },
                    'Autoaufbruch': {
                        label: 'Autoaufbrüche',
                        count: 0
                    }
                };
                crimes.forEach(function (crime) {
                    crimeTypes[crime.type].count++;
                });

                var cValue = '' + (Math.round(feature.properties.comparisonValue * 100000) / 100);
                cValue = cValue.replace(/\./, ',');

                html += '<h4>' + feature.properties.GEN + '</h4>';
                html += '<strong>Einwohner:</strong> ' + formatNumber(feature.properties.citizens);
                html += '<br /><strong>Einbrüche / Autoaufbrüche:</strong> ' + feature.properties.numberOfCrimes;
                html += '<br /><strong>je 1.000 Einwohner:</strong> ' + cValue + '<br /><small>(maßgeblich für die Einfärbung)</small><br /><span class="hidden-xs">';
                Object.keys(crimeTypes).forEach(function (key) {
                    var crimeType = crimeTypes[key];
                    html += '<br />' + crimeType.label + ': ' + crimeType.count;
                });
                html += '</span>';
            } else {
                if (!this._div.innerHTML) {
                    html += '<h4>Gemeinde</h4>';
                    if (!L.Browser.mobile) {
                        html += 'Mit der Maus auswählen';
                    }
                }
            }
            if (html) {
                this._div.innerHTML = html;
            }
        };

        info.hide = function () {
            this._div.style.display = 'none';
        };
        info.show = function () {
            this._div.style.display = 'block';
        };

        leafletMap.on('popupopen', function () {
            info.hide();
        });
        leafletMap.on('popupclose', function () {
            info.show();
        });

        info.addTo(leafletMap);
    };

    var addAreaLayers = function () {
        var request = new XMLHttpRequest();
        request.open('GET', 'data/gemeinden.geojson', true);

        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                var geojson = JSON.parse(this.responseText);
                L.geoJson(geojson.features, {
                    style: {
                        'opacity': 0.5,
                        'weight': 1,
                        'color': '#666',
                        'fillOpacity': 0.6
                    },
                    onEachFeature: function (feature, layer) {
                        areas.push({
                            'feature': feature,
                            'layer': layer
                        });

                        layer.on("mouseover", function () {
                            info.update(feature);
                        });
                        layer.on("click", function () {
                            info.update(feature);
                        });

                        layer.on("mouseout", function () {
                            info.update();
                        });
                    }
                }).addTo(leafletMap);

                setAreaStyles();
            }
        };

        request.send();
    };

    var setAreaStyles = function () {
        var minMax = getMinMax();

        areas.forEach(function (area) {
            setAreaStyle(area.feature, area.layer, minMax);
        });
    };

    var setAreaStyle = function (feature, layer, minMax) {
        var comparisonValue = getComparisonValue(feature, layer);
        var percent = comparisonValue > 0 ? comparisonValue / minMax[1] : 0;
        var colorIndex = Math.round(percent * 8);

        layer.setStyle({
            'fillColor': colorScheme[colorIndex]
        });
    };

    var getMinMax = function () {
        var min = 1000;
        var max = 0;
        areas.forEach(function (area) {
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

    var getComparisonValue = function (feature, layer) {
        if (feature.properties.comparisonValue) {
            return feature.properties.comparisonValue;
        }

        var citizens = feature.properties['EWZ_M'] + feature.properties['EWZ_W'];
        var crimes = [];
        markers.forEach(function (marker) {
            if (leafletPip.pointInLayer(marker.marker.getLatLng(), layer)) {
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

    cm.map = {
        'init': init
    };
})(cm, L);
