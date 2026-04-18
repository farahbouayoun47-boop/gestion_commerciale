const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gestion_commerciale'
    });

    try {
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = DATABASE()
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('Users table schema:');
        columns.forEach(col => {
            console.log(`  ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (NULL: ${col.IS_NULLABLE})`);
        });
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkSchema();
