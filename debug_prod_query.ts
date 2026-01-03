
const { db } = require('./src/lib/db');

async function runQuery() {
    const sicil = 125647;
    const query = `
        SELECT 
            a.id, 
            a.status, 
            a.due_date, 
            a.type,
            tp.title, 
            tp.description,
            COUNT(pt.test_id) as question_count
        FROM assignments a
        JOIN test_packages tp ON a.package_id = tp.id
        LEFT JOIN package_tests pt ON tp.id = pt.package_id
        WHERE a.user_sicil = ?
        GROUP BY a.id
        ORDER BY a.created_at DESC
    `;

    console.log('Running query for sicil:', sicil);
    try {
        const res = await db.execute(query, [sicil]);
        console.log('Result:', res.rows);
    } catch (e) {
        console.error(e);
    }
}

runQuery();
