var http = require('http');
https = require('https');
var fs = require('fs');
var fpath = __dirname + '/../public/img/';
var filename = 'station.json';


var download_file_httpget = function(url, callback) {

  var client = http;
  if (url.toString().indexOf("https") === 0){
    client = https;
  }
  var request = client.get(url, function(res) {
    if (res.statusCode == 200) {
      var file_name = url.split('/').pop();
      //var file_name = url.parse(url).pathname.split('/').pop();
      var file = fs.createWriteStream( fpath + file_name);
      res.on('data',function(chunk){
        file.write(chunk);
      });
      res.on('end', function(){
        file.end();
        callback(null, url);
      });
    } else {
      callback('404 File not found');
    };
  });
};

var saveasJSON = function(msg, callback) {
  console.log('__dirname: ' + __dirname);
  fs.writeFile(filename, JSON.stringify(msg), function(err){
    if (err) {
      calback(err);
    }
    callback(null, filename);
  })
}

var self = module.exports = {

    download_logo: function download_logo(url, callback) {
        download_file_httpget(url, callback);
    },

    savefileJSON: function savefileJSON(msg, callback) {
      saveasJSON(msg,callback);
    }
}


