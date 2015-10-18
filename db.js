var pg = require('pg');

const CONN_STRING = "postgres://postgres:280985@localhost/postgres";

var db = pg;

db.connect(CONN_STRING, function(err, connection, done) {
    if(err) throw err;
    /*
    connection.query('DROP TABLE IF EXISTS distancia',
        function(err, rows, fields) {
            if (err) throw err;
        });
        
    connection.query('DROP TABLE IF EXISTS gps',
        function(err, rows, fields) {
            if (err) throw err;
        });
    connection.query('DROP TABLE IF EXISTS itinerario',
        function(err, rows, fields) {
            if (err) throw err;
        });
    connection.query('DROP TABLE IF EXISTS parada',
        function(err, rows, fields) {
            if (err) throw err;
        });
    connection.query('DROP TABLE IF EXISTS linha',
        function(err, rows, fields) {
            if (err) throw err;
        });
    */
    
    connection.query('CREATE TABLE IF NOT EXISTS linha (id SERIAL PRIMARY KEY, linha VARCHAR(20), descricao VARCHAR(200), id_municipio INT, lat_inicial REAL, lon_inicial REAL, lat_final REAL, lon_final REAL, CONSTRAINT un_linha UNIQUE(linha, id_municipio))',
        function(err, rows, fields) {
            if (err) throw err;
        });
    
    connection.query('CREATE TABLE IF NOT EXISTS gps (id SERIAL PRIMARY KEY, dataHora VARCHAR(19), ordem VARCHAR(10), id_linha INTEGER, lat REAL, lon REAL, velocidade REAL, CONSTRAINT un_data UNIQUE(dataHora, ordem), FOREIGN KEY (id_linha) REFERENCES linha(id))',
        function(err, rows, fields) {
            if (err) throw err;
        });
    
    connection.query('CREATE TABLE IF NOT EXISTS itinerario (id SERIAL PRIMARY KEY, id_linha INTEGER, descricao VARCHAR(200), agencia VARCHAR(100), sequencia INT, sentido INT, lat REAL, lon REAL, FOREIGN KEY (id_linha) REFERENCES linha(id))',
        function(err, rows, fields) {
            if (err) throw err;
        });
    
    connection.query('CREATE TABLE IF NOT EXISTS parada (id SERIAL PRIMARY KEY, id_linha INTEGER, descricao VARCHAR(200), agencia VARCHAR(100), sequencia INT, lat REAL, lon REAL, CONSTRAINT un_sentido UNIQUE(id_linha, descricao), FOREIGN KEY (id_linha) REFERENCES linha(id))',
        function(err, rows, fields) {
            if (err) throw err;
        });
    
    connection.query('CREATE TABLE IF NOT EXISTS distancia ' +
        '(id_origem INTEGER NOT NULL, id_destino INTEGER NOT NULL, id_linha INTEGER NOT NULL, descricao VARCHAR(200), dist_ponto_final REAL, dist REAL, ' +
        'FOREIGN KEY (id_origem) REFERENCES gps(id), ' +
        'FOREIGN KEY (id_destino) REFERENCES gps(id), ' +
        'FOREIGN KEY (id_linha) REFERENCES linha(id))',
        function(err, rows, fields) {
            if (err) throw err;
        });
        
    //connection.release();
    done();
    
    var origem = {
        lat: -22.913254,
        lon: -43.264521
    };
    /*
    connection.run('CREATE VIEW IF NOT EXISTS distancia AS ' +
           'SELECT g1.id AS id_origem, g2.id AS id_destino, g1.linha, g1.lat as g1_lat, g1.lon as g1_lon, g2.lat as g2_lat, g2.lon as g2_lon, ' +
           ' (g1.lat-(' + origem.lat + '))*(g1.lat-(' + origem.lat + '))+(g1.lon-(' + origem.lon + '))*(g1.lon-(' + origem.lon + ')) as distancia_origem, ' +
           ' (g1.lat-g2.lat)*(g1.lat-g2.lat)+(g1.lon-g2.lon)*(g1.lon-g2.lon) as distancia_ponto ' +
           'FROM gps g1, gps g2 ' +
           'WHERE g1.linha = g2.linha ' +
           'AND g1.rowid != g2.rowid ' +
           'AND (g1.lat-g2.lat)*(g1.lat-g2.lat)+(g1.lon-g2.lon)*(g1.lon-g2.lon) < 0.0000001 ' +
           'ORDER BY 7 ASC');
           
           
            WITH RECURSIVE
            rota(id_linha, linha, id_origem, id_destino, caminho, dist_base, dist_total) AS (
                SELECT l.id, l.linha, 0, g.id, '.' || g.id || '.', d.dist_ponto_final, d.dist_ponto_final
                FROM linha l, gps g, distancia d
                WHERE l.id = g.id_linha
                AND l.id = d.id_linha
                AND d.id_origem = d.id_destino
                AND g.id = d.id_origem
                AND d.dist_ponto_final < 5
                
                UNION
                
                SELECT r.id_linha, r.linha, r.id_origem, d.id_destino, r.caminho || d.id_destino || '.', r.dist_base, r.dist_total + d.dist
                FROM rota r, distancia d
                WHERE r.id_destino = d.id_origem
                AND d.dist < 50
                AND POSITION('.' || d.id_destino || '.' IN r.caminho) = 0
            ) select * from rota;
    */
});

module.exports = db;
module.exports.connString = CONN_STRING;