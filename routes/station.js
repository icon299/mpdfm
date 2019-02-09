var express = require('express');
var router = express.Router();
var db = require('../controller/database.js');


 router.get('/', function(req, res, next) {
    db.connect(function(err, count){
      if(err) {
        console.log('error DB connect')
          //wss.sendWSSMessage(ws, 'ERROR_READ_FILE', err);
      }
    });

    db.selectall(function (err, item) {
      if(err) {
        console.log('error DB select')
        //wss.sendWSSMessage(ws, 'ERROR_READ_FILE', err);
      } else{
        //sendWSSMessage(ws, 'ERROR_READ_FILE', err);
        res.render('index',{item});
      }
    });
});

router.get('/db', function(req, res, next) {
    db.connect(function(err, count){
      if(err) {
        console.log('error DB connect')
          //wss.sendWSSMessage(ws, 'ERROR_READ_FILE', err);
      }
    });

    db.selectall(function (err, item) {
      if(err) {
        console.log('error DB select')
        //wss.sendWSSMessage(ws, 'ERROR_READ_FILE', err);
      } else{
        //sendWSSMessage(ws, 'ERROR_READ_FILE', err);
        res.render('db',{item});
      }
    });
});

module.exports = router;
