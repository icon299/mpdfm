var neDB = require('nedb');

var db = new neDB ({filename: 'station.db'})

function connect(callback) {
  db.loadDatabase(function (err) {
      if (err) {
        callback(err);
      }
      db.count({}, function (err, count) {
        if (err)
          callback(err);

        if (count < 1) {
            callback('station list is empty.')
        }
        callback(null, count);
      });
    });
};

function selectall(callback) {
  db.find({}).sort({id: 1}).exec(function (err, docs) {
    if (err) {
     calback(err);
   } else {
    callback(null, docs)
   }
  });
};

function insert(data, callback) {

  db.count({}, function (err, count) {
    if(err) {
      callback(err);
    }
    data["id"] = count+1;
  })



  db.insert(data, function (err,newData) {
    if(err) {
      console.log(err.message);
    } else {
      callback(err, newData);
    }
  });
};

var self = module.exports = {

    connect: function connectDB(callback) {
        connect(callback);
    },

    selectall: function selectallRec(callback){
      selectall(callback);
    },

    insert: function insertFile(data,callback) {
      insert(data,callback);
    }
}

