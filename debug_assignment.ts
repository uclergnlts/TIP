
const { db } = require('./src/lib/db');

async function debugAssignment() {
    try {
        // 1. Find User in 'personnel'
        console.log('--- Searching for Ahmet Güngör in personnel ---');
        const userRes = await db.execute("SELECT id, sicil, ad_soyad FROM personnel WHERE ad_soyad LIKE '%Ahmet Güngör%'");
        if (userRes.rows.length === 0) {
            console.log('User not found!');
            return;
        }

        const user = userRes.rows[0];
        console.log('User Found:', user);

        // 2. Check Assignments using 'user_sicil'
        console.log(`--- Checking Assignments for User Sicil: ${user.sicil} ---`);
        const assignRes = await db.execute("SELECT * FROM assignments WHERE user_sicil = ?", [user.sicil]);

        if (assignRes.rows.length === 0) {
            console.log('No assignments found for this user Sicil.');
        } else {
            console.log(`Found ${assignRes.rows.length} assignments:`);
            console.log(assignRes.rows);
        }

    } catch (e) {
        console.error(e);
    }
}

debugAssignment();
