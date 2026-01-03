
const { db } = require('./src/lib/db');

async function listUsers() {
    try {
        console.log('--- Listing Personnel ---');
        const userRes = await db.execute("SELECT id, sicil, ad_soyad FROM personnel LIMIT 50");
        console.log(userRes.rows);
    } catch (e) {
        console.error(e);
    }
}

listUsers();
