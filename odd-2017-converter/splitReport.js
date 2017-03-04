const fs = require('fs');

function parseReport(report) {
    let parts = [];
    // Convert line endings to Unix
    report = report.replace(/\r\n/g, '\n');
    // Cut away infoblock
    report = report.substr(0, report.indexOf('@@'));

    reportLines = report.split('\n\n');
    if(reportLines[0].indexOf(':') === -1) {
        reportLines[0] = reportLines[0].replace(/ - /g, ': ');
    }

    for(let i = 0; i < reportLines.length; ++i) {
        const line = reportLines[i];
        // Detect Town
        const colonPos = line.indexOf(':');
        //console.log(reportLines);
        if(colonPos !== -1 && ((colonPos + 1) >= line.length || line[colonPos + 1] === ' ' || line[colonPos + 1] === '\n')) {

            // Location is before the colon and without the three spaces at the beginning
            let location = line.substr(3, colonPos - 3);

            let reportText;
            // Detect if line is headline
            if(line.length < 200 && reportLines[i + 1].length >= 200) {
                // We have a headline, next line should be report
                //console.log(line);
                //console.log("Full report:", reportLines[i+1]);
                
                reportText = reportLines[i+1].trim();
            } else if(line.length < 200 && reportLines[i + 1].length < 200) {
                reportText = reportLines[i+2] ? reportLines[i+2].trim() : '';
            } else {
                // We probably have location and headline in one "line"
                //console.log("Inline report: ", line.substr(colonPos + 1));
                reportText = line.substr(colonPos + 1).trim();
            }

            // Replace single line endings with spaces and replace multiple spaces with a single one
            reportText = reportText.replace(/\n/g, ' ').replace(/ +/g, ' ');
            parts.push({
                location: location,
                text: reportText
            });
        }
    }
    return parts;
}

//const report = fs.readFileSync('testreport.txt').toString('utf8');
//console.log(parseReport(report));
module.exports = parseReport;