(function (cm, L) {
    'use strict';

    var leafletMap = null;
    var colorScheme = ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"];
    var info = [];
    var metaData = {
        timerangeId: null,
        label: ''
    };

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

        metaData.timerangeId = '14-10_14-12';
        metaData.label = 'Polizeiberichte Okt. - Dez. 2014';

        addTileLayer();
        var markersInstance = new cm.map.markers(leafletMap);
        cm.data.addListener(function () {
            markersInstance.update(cm.data.crimes);
        });
        cm.data.addListener(function () {
            updateAreaLayers(cm.data.areas);
        });
        createInfoControl();
        createLegendControl();

        cm.data.update(metaData.timerangeId, null, 8);
    };

    var addTileLayer = function () {
        var attribution = '<a href="http://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a> | <a href="http://www.stimme.de/meta/ueberuns/impressum/Impressum;art5015,1284151">Impressum</a> | Angaben ohne Gewähr!';
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
                html += '<br /><strong>Einbrüche:</strong> ' + feature.properties.numberOfCrimes;
                html += '<br /><strong>je 1.000 Einwohner:</strong> ' + cValue + '<br /><span class="hidden-xs">';
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

    var createLegendControl = function () {
        var legend = L.control();

        legend.onAdd = function () {
            this._div = L.DomUtil.create('div', 'legend');
            this.update();
            return this._div;
        };

        legend.update = function () {
            var html = '';

            html += '<h4>Polizeiberichte ' + metaData.label + '</h4>';

            this._div.innerHTML = html;
        };

        legend.addTo(leafletMap);
        return legend;
    };

    var updateAreaLayers = function (areas) {
        areas.getLayers().forEach(function (layer) {
            var area = layer.feature;
            layer.setStyle({
                'opacity': 0.5,
                'weight': 1,
                'color': '#666',
                'fillOpacity': 0.6,
                'fillColor': colorScheme[area.properties.graduation]
            });

            layer.on("mouseover", function () {
                info.update(area);
            });
            layer.on("click", function () {
                info.update(area);
            });
            layer.on("mouseout", function () {
                info.update();
            });
        });
        leafletMap.addLayer(areas);
    };

    cm.map = {
        'init': init
    };
})(cm, L);
