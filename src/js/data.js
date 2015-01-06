(function (cm, L) {
    'use strict';

    var Loader = function () {
        var getJson = function (url) {
            return new Promise(function (fulfill, reject) {
                var request = new XMLHttpRequest();
                request.open('GET', url, true);
                request.onload = function () {
                    if (request.status >= 200 && request.status < 400) {
                        fulfill(JSON.parse(this.responseText));
                    } else {
                        reject('could not load ' + url);
                    }
                };
                request.onerror = function () {
                    reject('could not load ' + url);
                };
                request.send();
            })
        };

        var loaded = {
            data: null,
            filename: null
        };

        this.load = function (filename) {
            return new Promise(function (fulfill, reject) {
                if (loaded.filename === filename) {
                    fulfill(loaded.data);
                } else {
                    getJson(filename).then(function (data) {
                        loaded.data = data;
                        loaded.filename = filename;
                        fulfill(loaded.data);
                    }, reject);
                }
            });
        }
    };

    var areaService = {
        loader: new Loader(),
        load: function () {
            var that = this;
            return new Promise(function (fulfill, reject) {
                that.loader.load('data/gemeinden.geojson').then(function (data) {
                    fulfill(L.geoJson(data.features));
                }, reject);
            });
        },
        addCrimeData: function (areas, crimes, numberOfGraduations) {
            var min = 1000;
            var max = 0;
            areas.getLayers().forEach(function (layer) {
                var area = layer.feature;
                var citizens = area.properties['EWZ_M'] + area.properties['EWZ_W'];
                var areaCrimes = crimes.filter(function (crime) {
                    return leafletPip.pointInLayer([crime.lon, crime.lat], layer);
                });

                area.properties.citizens = citizens;
                area.properties.numberOfCrimes = areaCrimes.length;
                area.properties.crimes = areaCrimes;
                area.properties.comparisonValue = areaCrimes.length ? areaCrimes.length / citizens : 0;

                min = Math.min(area.properties.comparisonValue, min);
                max = Math.max(area.properties.comparisonValue, max);
            });

            areas.getLayers().forEach(function (layer) {
                var area = layer.feature;
                var percent = area.properties.comparisonValue > 0 ? area.properties.comparisonValue / max : 0;
                area.properties.graduation = Math.round(percent * numberOfGraduations);
            });

            return areas;
        }
    };

    var crimeService = {
        loader: new Loader(),
        load: function (timerangeId) {
            return this.loader.load('data/crimes.' + timerangeId + '.json');
        },
        filter: function (crimes, options) {
            return crimes;
        }
    };

    var listeners = [];
    cm.data = {
        areas: null,
        crimes: null,
        addListener: function (listener) {
            listeners.push(listener);
        },
        update: function (timerangeId, filterOptions, numberOfGraduations) {
            var areasPromise = areaService.load();
            var crimesPromise = crimeService.load(timerangeId);

            Promise.all([areasPromise, crimesPromise]).done(function (results) {
                cm.data.crimes = crimeService.filter(results[1], filterOptions);
                cm.data.areas = areaService.addCrimeData(results[0], cm.data.crimes, numberOfGraduations);

                listeners.forEach(function (listener) {
                    listener();
                })
            });
        }
    };
})(cm, L);
