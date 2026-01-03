
const { db } = require('./src/lib/db');

async function checkDB() {
    try {
        const res = await db.execute('SELECT count(*) as count FROM tests');
        console.log('Total Tests:', res.rows[0].count);

        const rows = await db.execute('SELECT id, image_url, threat_polygon FROM tests LIMIT 5');
        console.log('Sample Rows:', rows.rows);
    } catch (e) {
        console.error(e);
    }
}

checkDB();
