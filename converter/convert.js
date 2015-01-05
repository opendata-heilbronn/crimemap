var fs = require('fs'), csv = require('csv'), async = require('async');
var argv = require('optimist').usage('Convert csv file of crimes\nUsage: $0 [csvfile] [type]').demand(2).argv;
var gm = require('googlemaps');

var columnLabelMapping = {
    'date': ['Wann?', 'Datum'],
    'city': ['Ort', 'Gemeinde'],
    'district': ['Ortsteil'],
    'street': ['Strasse', 'Straße'],
    'description': ['Meldung', 'ganze Polizei-Meldung'],
    'damage': ['Schaden?']
};

var input = csv().from(argv._[0]).to.array(function (data) {
    var column = {};
    Object.keys(columnLabelMapping).forEach(function (columnId) {
        var columnIndex = null;
        data[0].forEach(function (columnValue, index) {
            if (columnLabelMapping[columnId].indexOf(columnValue) >= 0) {
                if (columnIndex != null) {
                    console.warn('duplicate index for ' + columnId);
                }
                columnIndex = index;
            }
        });
        column[columnId] = columnIndex;
    });
    delete data[0];

    var result = [];
    async.eachLimit(data, 1, function (line, callback) {
        if (line && line[column.city]) {
            var address = line[column.city];
            if (line[column.street]) {
                address += ', ' + line[column.street];
            } else if (column.district != null && line[column.district]) {
                address += ', ' + line[column.district];
            }

            var entry = {};
            Object.keys(column).forEach(function (columnId) {
                if (column[columnId] !== null) {
                    entry[columnId] = line[column[columnId]];
                }
            });
            entry.type = argv._[1];

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
    }, function () {
        console.log('cm.data = ' + JSON.stringify(result, null, '\t') + ';');
    });
});
