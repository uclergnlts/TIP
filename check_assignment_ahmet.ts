
const { db } = require('./src/lib/db');

async function checkAssignment() {
    const sicil = 125647;
    console.log(`--- Checking Assignments for Sicil: ${sicil} ---`);
    const assignRes = await db.execute("SELECT * FROM assignments WHERE user_sicil = ?", [sicil]);
    console.log(assignRes.rows);
}

checkAssignment();
