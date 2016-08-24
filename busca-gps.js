var http = require('http');
var Immutable = require('immutable');
var socket = require('socket.io-client').connect('http://localhost:' + (process.env.PORT || 3000));

var counterA = 0;
var busList = Immutable.Map({});

var loadGPS = function() {
  var options = {
    hostname: 'dadosabertos.rio.rj.gov.br',
    path: '/apiTransporte/apresentacao/rest/index.cfm/obterTodasPosicoes',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    }
  };

  http.get(options, (res) => {
    var body = '';
    
    res.setEncoding('utf8');
    
    res.on('data', partialBody => {
      body += partialBody;
    });
    
    res.on('end', () => {
      var data = JSON.parse(body);
      console.log('>>> inicio', counterA++, new Date());
      
      parseData(data.DATA);
    });
  }).on('error', err => {
    console.log('err', err);
    throw err;
  });
};

var parseData = (loadedData) => {
  for(var i=0; i<loadedData.length; i++) {
    var row = loadedData[i];
    var dados = Immutable.Map({
      dataHora: row[0],
      ordem: row[1],
      linha: row[2] + '',
      lat: row[3],
      lon: row[4]
    });
    
    if(!busList.get(dados.get('ordem')) || !dados.equals(busList.get(dados.get('ordem')))) {
      socket.emit('bus.update', dados.toObject());
      busList = busList.set(dados.get('ordem'), dados);
    }
  }
};

setTimeout(loadGPS, 1);
setInterval(loadGPS, 45 * 1000);