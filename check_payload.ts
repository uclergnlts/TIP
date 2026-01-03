
const { db } = require('./src/lib/db');

async function checkPayloadSize() {
    const packageId = 2;
    const questionsRes = await db.execute(`
            SELECT 
                t.id, 
                t.image_url 
            FROM package_tests pt
            JOIN tests t ON pt.test_id = t.id
            WHERE pt.package_id = ?
            ORDER BY pt.order_index ASC
    `, [packageId]);

    const payload = JSON.stringify({
        questions: questionsRes.rows
    });

    console.log(`Payload Size: ${(payload.length / 1024 / 1024).toFixed(2)} MB`);
}

checkPayloadSize();
