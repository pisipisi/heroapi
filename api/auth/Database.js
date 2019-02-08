var mysql = require('mysql');
var util = require('util');
let dbname = 'solu_hero';
var pool = mysql.createPool({
    host: 'solutrons.com', 
    user: 'solu_hero',
    database: dbname,
    password: 'lFz9Tmpp8c',
    connectionLimit : 10, 
    multipleStatements : true,
    timezone: 'utc'
});

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }
    if (connection) connection.release()
    return
});
pool.query = util.promisify(pool.query);

pool.createRef = async function getRef(table) {
	let results = await pool.query("SELECT `AUTO_INCREMENT` AS ref FROM  INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?", [dbname, table]);
    return results[0].ref.toString(36).toUpperCase();
}

module.exports = pool