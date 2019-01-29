var express = require('express');
var router = express.Router();
var db = require('../controller/database.js');
var mpd = require('../controller/mpdclient.js');

 router.get('/', function(req, res, next) {
  mpd.playLists(function (err,data) {
    if (err) console.log('error reading playlist')
    res.send(data)  // body...
  });
});



module.exports = router;
