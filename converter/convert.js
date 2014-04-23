var fs = require('fs'), csv = require('csv'), async = require('async');
var argv = require('optimist').usage('Convert csv file of crimes\nUsage: $0 [csvfile] [type]').demand(2).argv;
var gm = require('googlemaps');

var dateIndex = 0;
var cityIndex = 1;
var districtIndex = argv._[1] === 'Einbruch' ? 2 : null;
var streetIndex = argv._[1] === 'Einbruch' ? 3 : 2;
var descIndex = argv._[1] === 'Einbruch' ? 9 : 7;
var damageIndex = argv._[1] === 'Einbruch' ? 4 : 6;

var input = csv().from(argv._[0]).to.array(function (data) {
    delete data[0];

    var result = [];
    async.eachLimit(data, 1, function (line, callback) {
        if (line && line[cityIndex]) {
            var address = line[cityIndex];
            if (line[streetIndex]) {
                address += ', ' + line[streetIndex];
            } else if (districtIndex != null && line[districtIndex]) {
                address += ', ' + line[districtIndex];
            }

            var entry = {
                'date': line[dateIndex],
                'city': line[cityIndex],
                'street': line[streetIndex],
                'description': line[descIndex],
                'damage': line[damageIndex],
                'type': argv._[1]
            };
            if (districtIndex != null) {
                entry.district = line[districtIndex];
            }

            result.push(entry);
            gm.geocode(address,
                function (err, gmData) {
                    if (gmData && gmData.results[0] && gmData.results[0].geometry && gmData.results[0].geometry.location
                        && gmData.results[0].geometry.location.lat) {
                        entry.lat = gmData.results[0].geometry.location.lat;
                        entry.lon = gmData.results[0].geometry.location.lng;
                    } else {
                        console.log("not found: " + address);
                    }
                    setTimeout(callback, 500);
                });
        } else {
            callback();
        }
    }, function (err) {
        console.log('cm.data = ' + JSON.stringify(result, null, '\t') + ';');
    });
});
