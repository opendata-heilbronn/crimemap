const request = require('request');
const fs = require('fs');

function geocode(city, street) {
    city = encodeURIComponent(city);
    street = encodeURIComponent(street);
    return new Promise((resolve, reject) => {
        request(`http://dev.virtualearth.net/REST/v1/Locations?addressLine=${street}&key=AjfYlr1T6D4WE-svTKO32EL80mTX9k7Wfk3s-6ILU4tQCPBJFhDieZLsPOQg3TVu&countryRegion=Germany&locality=${city}`, (err, req, body) => {
            const result = JSON.parse(body);
            if(result.resourceSets.length > 0 && result.resourceSets[0].resources.length > 0) {
                resolve({
                    lat: result.resourceSets[0].resources[0].point.coordinates[0],
                    lon: result.resourceSets[0].resources[0].point.coordinates[1]
                });
            } else {
                reject(result);
                return;
            }
        });
    });
}

function geocodeEntry(entries, index, cbEnd) {
    if(index === entries.length) {
        cbEnd();
        return;
    }
    if(typeof entries[index].street === 'string')
    {
        console.log("Geocoding", entries[index].street, entries[index].city);
        geocode(entries[index].city, entries[index].street).then(location => {
            console.log("Geocoded", entries[index].street, entries[index].city, location.lat, location.lon);
            entries[index].lat = location.lat;
            entries[index].lon = location.lon;
        }).catch((err) => {
            console.log("Failed", err);
        });
    }
    setTimeout(() => {
        geocodeEntry(entries, index + 1, cbEnd);
    }, 500);
}

function geocodeAll(entries, cbEnd) {
    setTimeout(() => {
        geocodeEntry(entries, 0, cbEnd);
    }, 500);
}

let entries = JSON.parse(fs.readFileSync('einbrueche2016.json'));
geocodeAll(entries, () => {
    fs.writeFileSync('einbrueche2016geocoded.json', JSON.stringify(entries, null, 2));
});
