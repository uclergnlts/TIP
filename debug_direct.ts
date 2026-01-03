
const { db } = require('./src/lib/db');

async function debugDirect() {
    const pid = 2;
    console.log('Querying package_tests directly...');
    const res = await db.execute("SELECT * FROM package_tests WHERE package_id = ?", [pid]);
    console.log(`Direct Count: ${res.rows.length}`);
    if (res.rows.length > 0) console.log(res.rows[0]);
}

debugDirect();
