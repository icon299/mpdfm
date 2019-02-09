//"use strict";

var fs = require('fs');
var path = require('path');
var mpdClient = require("./mpdclient.js");
var debug = require('debug')('mpd.fm:wss');
var db = require('./database.js')
var fileup = require('./fileclient.js');
var WebSocket = require('ws');

var stationFile = process.env.STATION_FILE || path.join(__dirname, '../data/stations.json');

//function sendWSSMessage(client, type, data, showDebug = true) {
function sendWSSMessage(client, type, data, showDebug)  {
    showDebug = false;
    data = objectToLowerCase(data);
    showDebug && debug('Send: ' + type + ' with %o', data);
    var msg = {
        type: type,
        data: (data) ? data : {}
    }
    client.send(JSON.stringify(msg), function(error) {
        if(error)
            debug('Failed to send data to client %o', error);
    });
}

function broadcastMessage(server, type, data) {
    data = objectToLowerCase(data);
    debug('Broadcast: ' + type + ' with %o', data);
    server.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            sendWSSMessage(client, type, data, false);
        }
    });
}

function objectToLowerCase(data) {

    if(Array.isArray(data)) {
        return data.map(value => objectToLowerCase(value));
    } else if(typeof data === 'object' && data!=null) {
        var retData = {};
        var keys = Object.keys(data);
        for(var i = 0; i < keys.length;i++){
        //for (const [key, value] of Object.entries(data)) {
            retData[keys[i].toLowerCase()] = objectToLowerCase(data[keys[i]]);
        }
        return retData;
    } else {
        return data;
    }
}

module.exports = {
    init: function(wss) {

        wss.on("error", function (err){
            console.log("Caught flash policy server socket error: ")
            console.log(err.stack)
        });

        wss.on('connection', function connection(ws, req) {

            ws.on('message', function incoming(message) {

                var msg = JSON.parse(message);
                debug('Received %s with %o', msg.type, msg.data);

                switch(msg.type) {
                    case "REQUEST_DB_STATION_LIST":
                        db.connect(function(err, count){
                            if(err) {
                                sendWSSMessage(ws, 'ERROR_READ_FILE', err);
                            }
                        });

                        db.selectall(function (err, msg) {
                            if(err) {
                                sendWSSMessage(ws, 'ERROR_READ_FILE', err);
                            } else{

                                sendWSSMessage(ws, 'DB_STATION_LIST', msg);

                            }
                        });
                        break;
                    case "REQUEST_STATION_LIST":
                        fs.readFile(stationFile, 'utf8', function (err, data) {
                            if (err) {
                                console.error('Can\'t read station file: "' + stationFile + '": ' + err);
                                sendWSSMessage(ws, 'ERROR_READ_FILE', 'Can\'t read station file');
                                return;
                            }
                            try {
                                var stationList = JSON.parse(data);
                                sendWSSMessage(ws, 'STATION_LIST', stationList);
                            } catch (error) {
                                console.error('Can\'t interpret station file: "' + stationFile + '": ' + error);
                                sendWSSMessage(ws, 'ERROR_READ_FILE', 'Can\'t parse station file');
                            }
                        });
                        break;
                    case "REQUEST_STATUS":
                        mpdClient.getMpdStatus(function(err, status) {
                            if(err) {
                                sendWSSMessage(ws, 'MPD_OFFLINE', null);
                            } else {
                                sendWSSMessage(ws, 'STATUS', status);
                            }
                        });
                        break;
                    case "REQUEST_ELAPSED":
                        mpdClient.getElapsed(function(err, elapsed) {
                            if(err) {
                                sendWSSMessage(ws, 'MPD_OFFLINE', null);
                            } else {
                                sendWSSMessage(ws, 'ELAPSED', elapsed);
                            }
                        });
                        break;
                    case "PLAY":
                        if(msg.data && msg.data.stream) {
                            mpdClient.playStation(msg.data.stream, function(err) {
                                if(err) {
                                    sendWSSMessage(ws, 'MPD_OFFLINE');
                                }
                            });
                        } else {
                            mpdClient.play(function(err) {
                                if(err) {
                                    sendWSSMessage(ws, 'MPD_OFFLINE');
                                }
                            });
                        }
                        break;
                    case "PAUSE":
                        mpdClient.pause(function(err) {
                            if(err) {
                                sendWSSMessage(ws, 'MPD_OFFLINE');
                            }
                        });
                        break;
                    case "PLAYLISTS":
                        mpdClient.playLists(function(err,playlists) {
                            if(err) {
                                sendWSSMessage(ws, 'MPD_OFFLINE');
                            } else {
                                sendWSSMessage(ws, 'PLAYLISTS', playlists);
                            }
                        });
                        break;
                    case "PLAYLISTSONGS":
                        mpdClient.playlistSongs(msg.data.playlist, function(err, playlistSongs) {
                            if(err) {
                                sendWSSMessage(ws, 'MPD_OFFLINE');
                            } else {
                                sendWSSMessage(ws, 'PLAYLISTSONGS', playlistSongs);
                            }
                        });
                        break;

                    case "INSERT_STATION":
                        db.insert(msg.data, function (err, newDoc) {
                            if (err) {
                                console.log("INSERT ERROR");
                            } else
                            sendWSSMessage(ws, 'DB_MESSAGE', newDoc);
                        })
                        break;
                    case "FILE_UPLOAD":
                        console.log("FILE_UPLOAD: " + msg.data);
                        fileup.download_logo( msg.data, function(err, msg) {
                            if (err) {
                                sendWSSMessage(ws, 'UPLOAD_ERROR', err);
                                console.log("UPLOAD ERROR: " + err);
                            } else {
                            sendWSSMessage(ws, 'UPLOAD_OK', msg);
                                console.log("UPLOAD OK");
                            }
                        });
                        break;
                    case "SAVE_JSON":
                        console.log('json save event');
                        fileup.savefileJSON(msg.data, function(err, ret){
                            if (err) {
                                console.log(err);
                            } else
                            console.log('file ' + ret + ' saved');
                        })
                        break;
                    case "ALBUMART":
                        console.log('ALBUMART');
                        mpdClient.albumArt(msg.data, function(err, data){
                            if (err) {
                                console.log('Error say: ' + err);
                            } else
                            console.log('albumart: ' + data);
                        })
                        break;
                }
            });
        });
        mpdClient.onStatusChange(function(status) {
            broadcastMessage(wss, 'STATUS', status);
        });
    }
};
