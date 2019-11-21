var express = require('express');
var router = express.Router();
//const nedb = require('nedb');
//var db = require('../controller/database.js');
var wss = require('../controller/wss.js');
var mpdClient = require('../controller/mpdclient.js')
const bodyParser = require('body-parser');

const path = require('path');
var neDB = require('nedb');
var dbFile = path.join(__dirname, '../data/station.db');

const db = new neDB({ filename: dbFile,  autoload: true});

//const dbn = new nedb({ filename: 'station.db',  autoload: true});

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

var prepareItem = function(source) {
    var result = source;
//    result.Married = source.Married === 'true' ? true : false;
//    result.Country = parseInt(source.Country, 10);
    return result;
};


 router.get('/', function(req, res, next) {
    db.find({}).sort({id: 1}).exec(function (err, item) {
    res.render('index',{item});
  });
});

 router.get('/mb', function (req,res){
  var currDir = req.query.d;
  var param = req.query.p;

  //console.log('CurrentDir: ', currDir)
  // if (currDir === undefined)
  //   currDir = '/';
  currDir = typeof currDir !== 'undefined' ? currDir : '/';
  param = typeof param !== 'undefined' ? param : 'all';
  
  mpdClient.getDirList(currDir, param, function (err, item){
   res.send(item)
    
    
    // console.log(item)  
    res.end()
  })
  // res.end('Ok')

 })

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

router.post('/db', function(req, res, next) {
    db.insert(prepareItem(req.body), function(err, item) {
        res.json(item);
    });
});

router.put('/db', function(req, res){
  var item = prepareItem(req.body);
  db.update({_id: item._id}, item, {}, function(err) {
      res.json(item);
  })
});

router.delete('/db', function(req, res) {
    var item = prepareItem(req.body);

    db.remove({ _id: item._id }, {}, function(err) {
        res.json(item);
    });
});

router.get('/pl', function(req,res) {

  mpdClient.getPlayLists(function(err,item){
    if (err) console.log(err)
    console.log(item);
    res.render('playlists',{item});

  })
})

router.get('/mpd', function(req, res) {
  mpdClient.playlistSongs('Hits_80_90', function(err,item){
    if (err) console.log(err)
    //console.log(item);
  var itemJson = JSON.stringify(item,null,['\t']);
    res.render('mpd',{itemJson});

  })
})

router.get('/edit',(req, res) => {
  db.find({}).sort({id: 1}).exec(function (err, stations) {
    res.render('station_view',{stations});
  });
});

router.post('/save',(req, res) => {
  db.findOne({}).sort({id : -1}).exec(function(err, item){
    if(err) callback(err);
    var data = {id: item.id + 1,
                station: req.body.product_name,
                stream: req.body.product_price,
                desc: req.body.desc,
                logo: req.body.logo
              };
    db.insert(data, function (err,newData) {
      res.redirect(303,'/edit');
    })
  })
});

//route for update data
router.post('/update',(req, res) => {
 var item = req.body
  db.update({_id: req.body._id }, { $set: {
                                    station: req.body.product_name,
                                    stream: req.body.product_price,
                                    desc: req.body.desc,
                                    logo: req.body.logo }},
     {}, function(err) {
          if(err) throw err;
      res.redirect(303,'/edit');
  })
});

//route for delete data
router.post('/delete',(req, res) => {
  db.remove({ _id: req.body._id},{}, function(err){
    if(err) throw err;
    res.redirect(303,'/edit');
  })
});

module.exports = router;
