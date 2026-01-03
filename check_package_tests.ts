
const { db } = require('./src/lib/db');

async function checkPackageTests() {
    const packageId = 2; // Derived from assignment 2
    console.log(`--- Checking Package Tests for Package ID: ${packageId} ---`);
    // @ts-ignore
    const res = await db.execute(`
            SELECT 
                t.id, 
                length(t.image_url) as len
            FROM package_tests pt
            JOIN tests t ON pt.test_id = t.id
            WHERE pt.package_id = ?
            ORDER BY pt.order_index ASC
    `, [packageId]);

    console.log(`Found ${res.rows.length} questions.`);
    if (res.rows.length > 0) console.log(res.rows[0]);
}

checkPackageTests();
