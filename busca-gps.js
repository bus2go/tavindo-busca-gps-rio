var request = require('request');
var db = require('./db');
var Util = require('./util');

var counterA = 0;
var counterB = 0;
var ultimaDataHora = Infinity;

var loadGPS = function() {
  request({
    url: 'http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/obterTodasPosicoes',
    method: 'GET',
    gzip: 'true',
    headers:{
			"Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			"Accept-Encoding":"gzip,deflate,sdch",
			"Cache-Control":"no-cache",
			"Connection":"keep-alive",
			"Content-Type":"application/x-www-form-urlencoded",
			"User-Agent":"Mozilla/5.0 (Linux; U; Android 4.0.2; en-us; Galaxy Nexus Build/ICL53F) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30"
		}
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data = JSON.parse(body);
      console.log('>>> inicio', counterA++, new Date());
      
      var stmtLinha = "INSERT INTO linha (linha, id_municipio) SELECT $1, 1 WHERE NOT EXISTS (SELECT 1 FROM linha WHERE linha = $2)";
      
      var stmtGPS = 'INSERT INTO gps (dataHora, ordem, id_linha, lat, lon, velocidade) SELECT $1, $2, (SELECT id FROM linha WHERE linha = $3), $4, $5, $6 WHERE NOT EXISTS (SELECT id FROM gps WHERE dataHora = $7 AND ordem = $8)';
      
      var stmtDist = 'INSERT INTO distancia (id_origem, id_destino, id_linha, dist_ponto_final, dist) SELECT $1, (SELECT id FROM gps WHERE dataHora = $2 AND ordem = $3), (SELECT id FROM linha WHERE linha = $4), $5, $6 WHERE NOT EXISTS (SELECT 1 FROM distancia d WHERE d.id_origem = $7 AND d.id_destino = (SELECT id FROM gps WHERE dataHora = $8 AND ordem = $9))';
      
      var stmtLoop = "SELECT g.id, g.dataHora, g.ordem, g.id_linha, l.linha, g.lat, g.lon, g.velocidade, l.lat_inicial, l.lon_inicial FROM gps g, linha l WHERE g.id_linha = l.id AND l.lat_inicial IS NOT NULL AND l.linha = $1";
      
      var client = new db.Client(db.connString);
      client.on('drain', client.end.bind(client));
      client.connect(function(err, connection, done) {
        if(err) throw err;
      
        for(var i=0; i<data.DATA.length; i++) {
          var registro = data.DATA[i];
          var temp = registro[0].split(' ')[0].split('-');
          var dados = {
            dataHora: temp[2] + '-' + temp[0] + '-' + temp[1] + ' ' + registro[0].split(' ')[1],
            ordem: registro[1],
            linha: registro[2] + '',
            lat: registro[3],
            lon: registro[4],
            velocidade: registro[5]
          };
          
          if(dados.linha == '') {
            continue;
          }
          
          connection.query(stmtLinha, [dados.linha, dados.linha], function(err, rows, fields) {
            if (err) {
              console.log('err:', err);
              throw err;
            }
          });
          
          if(dados.dataHora < ultimaDataHora) {
            continue;
          }
          
          ultimaDataHora = dados.dataHora;
          
          var callbackFor = function(_dados) {
            return function(erro, result) {
              connection.query(stmtLoop, [_dados.linha], function(err, result) {
                //if(!rows.length) console.log('rows:', rows);
                if(!err && result.rows.length > 0) { // && lastID != 0) {
                  for(var j=0; j<result.rows.length; j++) {
                    var row = result.rows[j];
                    var distanciaOrigem = Util.distanceBetweenLatLon(_dados.lat, _dados.lon, row.lat_inicial, row.lon_inicial);
                    var distanciaPontoSeguinte = Util.distanceBetweenLatLon(_dados.lat, _dados.lon, row.lat, row.lon);
                    
                    //console.log('dados:', [row.id, _dados.dataHora, _dados.ordem, row.linha, distanciaOrigem, distanciaPontoSeguinte, row.id, _dados.dataHora, _dados.ordem]);
                    connection.query(stmtDist, [row.id, _dados.dataHora, _dados.ordem, row.linha, distanciaOrigem, distanciaPontoSeguinte, row.id, _dados.dataHora, _dados.ordem], function(err, result) {
                      if (err) {
                        console.log('err, result:', err, result);
                        throw err;
                      }
                    });
                  }
                } else if(err) {
                  console.log('err:', err, _dados.linha);
                  throw err;
                }
              });
            };
          };
          
          connection.query(stmtGPS, [dados.dataHora, dados.ordem, dados.linha, dados.lat, dados.lon, dados.velocidade, dados.dataHora, dados.ordem], callbackFor(dados));
        }
        
        connection.query('SELECT count(*) AS total FROM gps', function (err, result) {
          if(err) {
            console.log('err:', err);
          } else {
            console.log('rows(', counterB, new Date(), '):', result.rows);
            console.log('<<< fim', counterB++, new Date());
          }
        });
      });
    } else {
      console.log('error', error);
    }
  });
};

loadGPS();