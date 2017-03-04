const csv = require('fast-csv');
const fs = require('fs');
const request = require('request');

const parseReport = require('./splitReport');

const geocodingApiKey = "AIzaSyDM_nqMWsvgj5c7MPhxag6dVzdkPslAL1k";
const googleMapsClient = require('@google/maps').createClient({
    key: geocodingApiKey
});

let allStreets;

const noStreets = [
    "Nachhauseweg",
    "Gehweg",
    "Parkplatz",
    "Bundesstraße",
    "Landesstraße",
    "Kreisstraße",
    "Landstraße",
    "Supermarktparkplatz",
    "Polizei-Parkplatz",
    "Lagerplatz",
    "Sitzplatz",
    "Gemeindeverbindungsweg",
    "Ortsverbindungsweg",
    "Fußgängerüberweg",
    "Vorstadtstraße",
    "Heimweg",
    "gering",
    "Waldweg",
    "Radweg",
    "Fußweg",
    "Radabstellplatz"
];

function reports(cb) {
    const csvData = fs.createReadStream('Pressemeldungen_PP_HN_2016.csv');

    let reports = [];

    const csvStream = csv({
        delimiter: ';'
    }).on('data', data => {
        reports.push({
            date: data[0],
            title: data[1],
            text: data[2],
            parts: parseReport(data[2])
        });
    }).on('end', () => {
        cb(reports);
    });

    csvData.pipe(csvStream);
}

function gemeinden(kreis, cb) {
    // Datenquelle: LGL, www.lgl-bw.de
    const gemarkung = fs.createReadStream('gemarkungsliste_lika-db_2011-07-18.csv');
    let gemeinden = [];

    const csvStream = csv({
        delimiter: ';'
    }).on('data', (data) => {
        if(data[1].indexOf(kreis) !== -1 && gemeinden.indexOf(data[3]) === -1) {
            gemeinden.push(data[3]);
        }
    }).on('end', () => {
        cb(gemeinden);
    });

    gemarkung.pipe(csvStream);
}

function streets(cb) {
    // Datenquelle: LGL, www.lgl-bw.de
    const streetFile = fs.createReadStream('strassenschluessel_lika-db_2011-07-182.csv');
    let streets = [];

    const csvStream = csv({
        delimiter: ';'
    }).on('data', (data) => {
        if(data[0][0] !== '=')
            streets.push(data);
    }).on('end', () => {
        cb(streets);
    });

    streetFile.pipe(csvStream);
}

function findStreets(unusualStreets, text) {
    let found = [];
    let typicalMatch = text.match(/\b\S+(?:str\.|straße|allee|weg|gasse|ring|platz)\b/gi);
    if(typicalMatch) {
        found = typicalMatch.filter(match => {
            return noStreets.indexOf(match) === -1;
        });
    }
    
    unusualStreets.forEach(street => {
        if(text.indexOf(street.street) !== -1 && found.indexOf(street.street) === -1) {
            found.push(street.street);
        }
    });
    return found;
}

function getLatLon(town, street) {
    return new Promise((resolve, reject) => {
        googleMapsClient.geocode({
            address: street + ', ' + town
        }, (err, response) => {
            if(err) {
                console.log(err);
                reject(err);
                return;
            }
            if(response.json.results.length > 0)
                resolve(response.json.results[0]);
            else
                reject();
        });
    });
}

/*
einbruchliste(einbrueche => {
    einbrueche.forEach(elem => {
        let match = elem[2].match(/\b(\S+(str\.|straße|weg|gasse)\b)/gi);
        if(match) console.log(match[0]);
    });
});
*/

streets(streets => {
    gemeinden('Heilbronn', gemeinden => {
        gemeinden = gemeinden.map(elem => elem.trim());
        allStreets = streets.filter(street => {
            //console.log(street[3], gemeinden.indexOf(street[3]));
            return gemeinden.indexOf(street[3]) !== -1;
        }).map(street => {
            return {
                town: street[3],
                street: street[1]
            };
        });

        unusualStreets = allStreets.filter(street => {
            return !street.street.match(/(str\.|straße|allee|weg|gasse|ring|platz)/g) && street.street !== 'Wert';
        });

        crimes = [];
        reports(reports => {
            reports.forEach(report => {
                report.parts.forEach(part => {
                    if(part.text.match(/(einbruch|gestohlen|entwendet)/gi)) {
                        let streets = findStreets(unusualStreets, part.text);
                        let date = report.date.replace(/(\d{4})-(\d{2})-(\d{2}) \d{2}:\d{2}/g, '$3.$2.$1');
                        let damageMatch = part.text.match(/(\d+) Euro/i);
                        let damageValue = '';
                        if(damageMatch) {
                            damageValue = damageMatch[1];
                        }
                        crimes.push({
                            date: date,
                            city: part.location,
                            street: streets.length === 1 ? streets[0] : streets,
                            description: part.text,
                            damage: damageValue,
                            type: 'Einbruch',
                            district: '',
                            lat: '',
                            lon: ''
                        });
                    }
                })
            });
            /*Promise.all(crimes.map(crime => {
                if(gemeinden.indexOf(crime.city) !== -1 && typeof crime.street === 'string') {
                    return getLatLon(crime.city, crime.street).then(location => {
                        crime.lat = location.lat;
                        crime.lon = location.lng;
                    });
                    //console.log("Can request for ", crime.street, crime.city);
                }
                return Promise.resolve({
                    lat: "", lng: ""
                });
            })).then(results => {
                for(let i = 0; i < crimes.length; ++i) {
                    crimes[i].lat = results[i].lat;
                    crimes[i].lon = results[i].lng
                }
            });*/
            //console.log(crimes.length);
            process.stdout.write(JSON.stringify(crimes, null, 2));
            //console.log(unusualStreets.filter(street => street.street.indexOf("Wert") !== -1));
        });
    });
});


/*
getLatLon('Neckarwestheim', 'Untere Frankenstraße').then(location => {
    console.log(location[0].geometry.location);
}).catch((err) => console.log(err));*/