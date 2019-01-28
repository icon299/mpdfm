
var socket = null;

var  wssDisconnect = true;

sendWSSMessage = function(type, data) {
    var msg = {
        type: type,
        data: (data) ? data : {}
    }
    try {
        socket.send(JSON.stringify(msg));
    } catch (error) {
        errorState.wssDisconnect = true;
    }
};

connectWSS = function() {
  var url = 'ws://'+location.hostname+(location.port ? ':'+location.port: '');
  socket = new ReconnectingWebSocket(url, null, {reconnectInterval: 3000});

  socket.onopen = function () {
      wssDisconnect = false;
      sendWSSMessage('REQUEST_DB_STATION_LIST', null);
      console.log('Connect to socket OK');
  };

  socket.onmessage = function (message) {
    wssDisconnect = false;
    var msg = JSON.parse(message.data);
    switch(msg.type) {
      case "DB_STATION_LIST":
        //var p = document.getElementById("json");
        //p.innerHTML = JSON.stringify(msg);

      break;

      case "DB_MESSAGE":
        sendWSSMessage('REQUEST_DB_STATION_LIST', null);
        var p = document.getElementById("json");
        p.innerHTML = msg.data;

        //data.stationList = msg.data;
        //makeList(data.stationList);
//        sendWSSMessage('REQUEST_STATUS', null);
      break;
    }

    socket.onerror = socket.onclose = function(err) {
      wssDisconnect = true;
    };
  };
};

 document.forms["insertform"].onsubmit = function(){
  var message = {
    station:this.sName.value,
    desc: this.sDesc.value,
    logo: this.sLogo.value,
    stream: this.sStream.value
  }
    sendWSSMessage('INSERT_STATION', message)
    return false;
  }


connectWSS();
