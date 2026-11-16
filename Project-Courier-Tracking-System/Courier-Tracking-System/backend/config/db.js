
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Jashan#1014',
    database: 'courier_tracking'
});

db.connect((err) => {
    if (err) {
        console.log('Database connection failed:', err);
    } else {
        console.log('MySQL Connected Successfully!');
    }
});

module.exports = db;
