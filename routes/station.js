var express = require('express');
var router = express.Router();
var db = require('../controller/database.js');
var mpd = require('../controller/mpdclient.js');

 // router.get('/db', function(req, res){
 //  res.type('text/html')
 //    res.sendFile(path.join(__dirname + 'db.html'));
 // });

 router.get('/', function(req, res, next) {
  mpd.playLists(function (err,data) {
    if (err) console.log('error reading playlist')
    res.send(data)  // body...
  });






// //  db.connect();
// //  db.selectall(function (data) {

// //       res.json(data);


// //  })
});


module.exports = router;
