
const { db } = require('./src/lib/db');
const fs = require('fs');
const path = require('path');

async function checkFiles() {
    const res = await db.execute('SELECT id, image_url FROM tests');
    console.log(`Checking ${res.rows.length} files...`);

    let missing = 0;
    for (const row of res.rows) {
        // url is like '/uploads/image.png' or 'http...'
        if (row.image_url.startsWith('http')) continue;

        const relativePath = row.image_url.startsWith('/') ? row.image_url.slice(1) : row.image_url;
        const fullPath = path.join(__dirname, 'public', relativePath);

        if (!fs.existsSync(fullPath)) {
            console.log(`[MISSING] ID: ${row.id}, URL: ${row.image_url}`);
            missing++;
        }
    }

    if (missing === 0) console.log('All local files exist.');
    else console.log(`${missing} files missing.`);
}

checkFiles();
