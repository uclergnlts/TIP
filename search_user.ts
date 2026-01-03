
const { db } = require('./src/lib/db');

async function searchUser() {
    try {
        console.log('--- Searching for "Ahmet" ---');
        const userRes = await db.execute("SELECT id, sicil, ad_soyad FROM personnel WHERE ad_soyad LIKE '%Ahmet%'");
        console.log(userRes.rows);
    } catch (e) {
        console.error(e);
    }
}

searchUser();
