const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    try {
        const db = process.env.DB_NAME || 'gestion_commerciale';
        console.log(`Dropping all tables in ${db}...`);
        
        // Disable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS=0');
        
        // Drop all tables
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = '${db}'
        `);
        
        for (const { TABLE_NAME } of tables) {
            await connection.execute(`DROP TABLE IF EXISTS \`${db}\`.\`${TABLE_NAME}\``);
            console.log(`✅ ${TABLE_NAME} dropped`);
        }
        
        // Re-enable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS=1');
        console.log('✅ All tables dropped. Foreign key checks re-enabled');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

resetDatabase();
