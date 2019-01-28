var neDB = require('nedb');

var db = new neDB ({filename: 'station.db'})

function connect() {

db.loadDatabase(function (err) {
    if (err) {
      console.log(err.mesage);
    } else {
      console.log("Connecting to base");
    }
  });
};


function selectall(callback) {
  db.find({}).sort({id: 1}).exec(function (err, docs) {
    if (err) {
     console.log(err.mesage);
   } else {
    callback(null, docs)
   }
  });
};

function insert(data, callback) {
  db.insert(data, function (err,newData) {
    if(err) {
      console.log(err.message);
    } else {
      callback(err, newData);
    }
  });
};


var self = module.exports = {

    connect: function connectDB() {
        connect();
    },

    selectall: function selectallRec(callback){
      selectall(callback);
    },

    insert: function insertFile(data,callback) {
      insert(data,callback);
    }
}
