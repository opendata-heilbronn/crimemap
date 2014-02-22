var fs = require('fs'), csv = require('csv'), async = require('async');
var argv = require('optimist').usage('Convert csv file of crimes\nUsage: $0 [csvfile] [type]').demand(1).argv;
var gm = require('googlemaps');

var input = csv().from(argv._[0]).to.array(function(data) {
	delete data[0];

	var result = [];
	async.eachLimit(data, 1, function(line, callback) {
		if (line && line[4]) {
			var address = line[2] + ', ' + line[4];
			var entry = {
				'date': line[0],
				'description': line[9],
				'type': argv._[1]
			};
			result.push(entry);
			gm.geocode(address,
					function(err, gmData) {
						if (gmData && gmData.results[0] && gmData.results[0].geometry && gmData.results[0].geometry.location
								&& gmData.results[0].geometry.location.lat) {
							entry.lat = gmData.results[0].geometry.location.lat;
							entry.lon = gmData.results[0].geometry.location.lng;
						} else {
						}
						setTimeout(callback, 500);
					});
		} else {
			callback();
		}
	}, function(err) {
		console.log('cm.data = ' + JSON.stringify(result, null, '\t') + ';');
	});
});
