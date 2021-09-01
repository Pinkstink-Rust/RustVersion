const exec = require("child_process").exec;
const vdf = require('vdf');
const express = require('express');
const app = express();
const port = 3000;
const regex = new RegExp(/AppID\s+:\s+\d+,\s+change\s+number\s+:\s+\d+\/\d+,\s+last\s+change\s+:\s+\w+\s+\w+\s+\d+\s+\d+:\d+:\d+\s+\d+\s+([\W\w]+).*/);

let steamCmdProcess;
function updateSteamInfo() {
    if (steamCmdProcess && !steamCmdProcess.killed) {
        steamCmdProcess.kill();
    }

    steamCmdProcess = exec("/home/steam/steamcmd/steamcmd.sh +login anonymous +app_info_print 258550 +exit");
    steamCmdProcess.stdin.setEncoding('utf-8');
    steamCmdProcess.stdout.on('data', chunk => outputBuffer.push(chunk.toString()));
    steamCmdProcess.on('exit', (code, signal) => {
        LogMessage(`Steam Exited: ${code} ${signal}`);
        parseOutput();
    });
}

let outputBuffer = [];
let parseString = "";
let lastUpdateInfo = {};

function parseOutput() {
    parseString = outputBuffer.join(' ');
    outputBuffer.length = 0;

    let matches = parseString.match(regex);
    if (matches && matches.length > 1) {
        LogMessage("Matched Regex");
        try {
            lastUpdateInfo = vdf.parse(matches[1]);
            LogMessage("Updated Info");
        } catch (e) {
            console.error(e);
        }
    }
}

function LogMessage(message) {
    const date = new Date();
    LogMessage('[' + date.toISOString() + '] ' + message);
}

app.listen(port, function () {
    LogMessage("HTTP Server is running on " + port + " port");
    setInterval(updateSteamInfo, 15000);
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send();
})

app.get('/', function (req, res) {
    try {
        res.json(lastUpdateInfo["258550"]);
    } catch {
        res.status(500);
    }
});
app.get('/public', function (req, res) {
    try {
        res.json(lastUpdateInfo["258550"]["depots"]["branches"]["public"]);
    } catch {
        res.status(500);
    }
})
app.get('/staging', function (req, res) {
    try {
        res.json(lastUpdateInfo["258550"]["depots"]["branches"]["staging"]);
    } catch {
        res.status(500);
    }
});