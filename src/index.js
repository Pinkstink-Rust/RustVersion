const exec = require("child_process").exec;
const vdf = require('vdf');
const express = require('express');
const app = express();
const port = 3000;
const regex = new RegExp(/AppID\s+:\s+\d+,\s+change\s+number\s+:\s+\d+\/\d+,\s+last\s+change\s+:\s+\w+\s+\w+\s+\d+\s+\d+:\d+:\d+\s+\d+\s+([\W\w]+)\s+\u001b\[1m\nSteam>\u001b\[0m/);

let steamCmdProcess;
function initSteamProcess() {
    console.log("Initializing SteamCMD");
    if (steamCmdProcess && !steamCmdProcess.killed) {
        steamCmdProcess.kill();
    }
    steamCmdProcess = exec("/home/steam/steamcmd/steamcmd.sh +login anonymous");
    steamCmdProcess.stdin.setEncoding('utf-8');
    steamCmdProcess.stdout.on('data', filter);
    steamCmdProcess.on('exit', (code, signal) => {
        console.log("Steam Exited");
        setTimeout(initSteamProcess, 15000);
    });
    poll();
}
initSteamProcess();

let outputBuffer = [];
let parseString = "";
let lastUpdateInfo = {};

function filter(chunk) {
    outputBuffer.push(chunk.toString());
    if (outputBuffer.length > 20) {
        outputBuffer.splice(0, outputBuffer.length - 200);
    }

    if (chunk.includes("\u001b[1m\nSteam>\u001b[0m")) {
        console.log("Steam Prompt Found");
        parseString = outputBuffer.join(' ');
        outputBuffer.length = 0;

        let matches = parseString.match(regex);
        if (matches && matches.length > 1) {
            console.log("Matched Regex");
            try {
                lastUpdateInfo = vdf.parse(matches[1]);
                console.log("Updated Info");
            } catch (e) {
                console.error(e);
            }
        }
    }
}

function poll() {
    if (steamCmdProcess && !steamCmdProcess.killed && steamCmdProcess.stdin && steamCmdProcess.stdin.writable) {
        console.log("Requesting App Info");
        steamCmdProcess.stdin.write("app_info_print 258550\r\n");
    }
    setTimeout(poll, 60000);
}

app.listen(port, function () {
    console.log("HTTP Server is running on " + port + " port");
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send();
})

app.get('/', function (req, res) {
    res.json(lastUpdateInfo);
});
app.get('/debug', function (req, res) {
    res.json(outputBuffer);
});
app.get('/public', function (req, res) {
    res.json(lastUpdateInfo["258550"]["depots"]["branches"]["public"]);
})
app.get('/staging', function (req, res) {
    res.json(lastUpdateInfo["258550"]["depots"]["branches"]["staging"]);
});