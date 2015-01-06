(function (cm, L) {
    'use strict';

    var leafletMap = null;
    var colorScheme = ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"];
    var info = [];
    var availableData = [{
        timerangeId: '14-10_14-12',
        label: 'Okt. - Dez. 2014'
    }, {
        timerangeId: '13-11_14-04',
        label: 'Nov. 2013 - April. 2014'
    }];
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

    var formatComparisonValue = function (n) {
        var cValue = '' + (Math.round(n * 100000) / 100);
        cValue = cValue.replace(/\./, ',');
        return cValue;
    };

    var init = function () {
        leafletMap = L.map('map', {
            center: [49.221185044221336, 9.33700561523437549],
            zoom: 10,
            minZoom: 5,
            maxZoom: 16,
            zoomControl: !L.Browser.mobile
        });

        addTileLayer();
        var markersInstance = new cm.map.markers(leafletMap);
        cm.data.addListener(function () {
            markersInstance.update(cm.data.crimes);
        });
        cm.data.addListener(function () {
            updateAreaLayers(cm.data.areas);
        });
        var legend = createLegendControl();
        cm.data.addListener(function () {
            legend.update();
        });
        createInfoControl();

        metaData = availableData[0];
        cm.data.update(metaData.timerangeId, null, colorScheme.length);
    };

    var addTileLayer = function () {
        var attribution = '<a href="http://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a> | <a href="http://www.stimme.de/meta/ueberuns/impressum/Impressum;art5015,1284151">Impressum</a> | ' + ((L.Browser.mobile) ? '' : 'Alle Angaben ') + 'ohne Gewähr!';
        L.tileLayer('https://{s}.tiles.mapbox.com/v3/codeforheilbronn.i4f96icg/{z}/{x}/{y}.png', {
            'maxZoom': 18,
            'attribution': attribution
        }).addTo(leafletMap);
        if (L.Browser.mobile) {
            leafletMap.attributionControl.setPrefix('');
        }
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

                html += '<h4>' + feature.properties.GEN + '</h4>';
                html += '<strong>Einwohner:</strong> ' + formatNumber(feature.properties.citizens);
                html += '<br /><strong>Einbrüche:</strong> ' + feature.properties.numberOfCrimes;
                html += '<br /><strong>je 1.000 Einwohner:</strong> ' + formatComparisonValue(feature.properties.comparisonValue) + '<br /><span class="hidden-xs">';
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
        var legend = L.control({
            position: 'bottomright'
        });

        legend.onAdd = function () {
            this._div = L.DomUtil.create('div', 'legend');
            this.update();
            return this._div;
        };

        legend.update = function () {
            var html = '';

            var optionsHtml = '';
            availableData.forEach(function (dataMeta) {
                var optionAttrs = dataMeta.timerangeId === metaData.timerangeId ? ' selected="selected"' : '';
                optionsHtml += '<option value="' + dataMeta.timerangeId + '"' + optionAttrs + '>' + dataMeta.label + '</option>';
            });

            html += '<h4>Polizeiberichte <select id="dataSelect">' + optionsHtml + '</select></h4>';
            if (cm.data.areas !== null) {
                var labelsHtml = '';
                var colorsHtml = '';
                for (var graduation = 1; graduation < colorScheme.length; graduation++) {
                    var start = graduation === 1 ? 0 : ((graduation - 1) * cm.data.areas.max / colorScheme.length) + 0.00001;
                    var end = graduation * cm.data.areas.max / colorScheme.length;
                    colorsHtml += '<span style="background:' + colorScheme[graduation - 1] + ';"></span>';
                    labelsHtml += '<label>' + formatComparisonValue(start) + ' - ' + formatComparisonValue(end) + '</label>';
                }
                colorsHtml += '<span style="background:' + colorScheme[colorScheme.length - 1] + ';"></span>';
                labelsHtml += '<label>&gt; ' + formatComparisonValue(((colorScheme.length - 1) * cm.data.areas.max / colorScheme.length) + 0.00001) + '</label>';

                html += '<small>je 1.000 Einwohner</small><br>' + colorsHtml + labelsHtml;
            }

            this._div.innerHTML = html;

            if (cm.data.areas !== null) {
                var dataSelect = document.getElementById('dataSelect');
                dataSelect.addEventListener('change', function () {
                    var selectedValue = this.value;
                    var selectedData = availableData.filter(function (dataset) {
                        return dataset.timerangeId === selectedValue;
                    })[0];
                    metaData = selectedData;
                    leafletMap.removeLayer(cm.data.areas);
                    cm.data.update(metaData.timerangeId, null, colorScheme.length);
                });
            }
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
                'fillColor': colorScheme[area.properties.graduation - 1]
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
