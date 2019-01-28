//"use strict";

var fs = require('fs');
var path = require('path');
var mpdClient = require("./mpdclient.js");
var debug = require('debug')('mpd.fm:wss');
var db = require('./database.js')
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
    //return data;
    // if(Array.isArray(data)) {
    //     return data.map(value => objectToLowerCase(value));
    // } else if(typeof data === 'object') {
    //     var retData = {};
    //     for (const [key, value] of Object.entries(data)) {
    //         retData[key.toLowerCase()] = objectToLowerCase(value);
    //     }
    //     return retData;
    // } else {
    //     return data;
    // }

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
        wss.on('connection', function connection(ws, req) {

            ws.on('message', function incoming(message) {

                var msg = JSON.parse(message);
                debug('Received %s with %o', msg.type, msg.data);
                switch(msg.type) {
                    case "REQUEST_DB_STATION_LIST":
                        db.connect();
                        db.selectall(function (err,msg) {
                            if(err) {
                                console.log(err);
                            } else{
                                sendWSSMessage(ws, 'STATION_LIST', msg);
                            }
                        });

                        // fs.readFile(stationFile, 'utf8', function (err, data) {
                        //     if (err) {
                        //         console.error('Can\'t read station file: "' + stationFile + '": ' + err);
                        //         sendWSSMessage(ws, 'ERROR_READ_FILE', 'Can\'t read station file');
                        //         return;
                        //     }
                        //     try {
                        //         var stationList = JSON.parse(data);
                        //          sendWSSMessage(ws, 'STATION_LIST', stationList);
                        //     } catch (error) {
                        //         console.error('Can\'t interpret station file: "' + stationFile + '": ' + error);
                        //         sendWSSMessage(ws, 'ERROR_READ_FILE', 'Can\'t parse station file');
                        //     }
                        // });
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
                    case "REQUEST_STATION_LIST_DB":
                        sqlite.playLists(function(err,playlists) {
                            if(err) {
                                sendWSSMessage(ws, 'MPD_OFFLINE');
                            } else {
                                sendWSSMessage(ws, 'PLAYLISTS', playlists);
                            }
                        });
                        break;
                }

            });

        });

        mpdClient.onStatusChange(function(status) {

            broadcastMessage(wss, 'STATUS', status);
        });
    }
};
