
const { db } = require('./src/lib/db');

async function checkPackage() {
    try {
        const id = 2;
        console.log(`--- Checking Package ID: ${id} ---`);
        const res = await db.execute("SELECT * FROM test_packages WHERE id = ?", [id]);

        if (res.rows.length === 0) {
            console.log('Package NOT found!');
        } else {
            console.log('Package Found:', res.rows[0]);
        }
    } catch (e) {
        console.error(e);
    }
}

checkPackage();
