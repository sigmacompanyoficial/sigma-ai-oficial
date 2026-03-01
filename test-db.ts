// @ts-nocheck
const mysql = require('mysql2/promise');

async function test() {
    console.log('Testing connection to:', process.env.MYSQL_HOST);
    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            port: parseInt(process.env.MYSQL_PORT || '3306'),
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            connectTimeout: 5000
        });
        console.log('✅ Connection successful!');
        const [rows] = await connection.execute('SHOW TABLES');
        console.log('Tables:', rows);
        await connection.end();
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        if (err.code === 'ETIMEDOUT') {
            console.error('Hint: InfinityFree usually blocks remote MySQL access. You might need a local MySQL or a provider that allows remote connections (like Railway, Supabase Postgres with mysql-shim, or a VPS).');
        }
    }
}

test();
