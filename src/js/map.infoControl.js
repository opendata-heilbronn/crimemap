(function (cm, L) {
    'use strict';

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
})(cm, L);
