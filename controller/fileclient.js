var http = require('http');
var fs = require('fs');
var Stream = require('stream').Transform;


var download_file_httpget = function(url, callback) {

  var request = http.get(url, function(res) {
    var file = fs.createWriteStream('../mpd.fm/public/img/image.png');
    //var file_name = url.parse(url).pathname.split('/').pop();

    res.on('data',function(chunk){
      file.write(chunk);
    });

   res.on('end', function(){
      file.end();
      callback(null, url);
    });
  });
}

var saveasJSON = function(msg, callback) {
  fs.writeFile('station.json', JSON.stringify(msg))
}

  // url = 'http://online-red.com/images/radio-logo/respublika.png';
  // //url = 'http://192.168.1.100:4200/css/main.css';
  // fileup.download_logo(url, function(file){
  //   console.log(file)  ;
  // });



var self = module.exports = {

    download_logo: function download_logo(url, callback) {
        download_file_httpget(url, callback);
    },

    savefileJSON: function savefileJSON(msg, callback) {
      saveasJSON(msg,callback);
    }
}
