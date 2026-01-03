
const { db } = require('./src/lib/db');

async function analyzeUrls() {
    // @ts-ignore
    const res = await db.execute('SELECT id, substr(image_url, 1, 50) as start_url, length(image_url) as len FROM tests');

    let base64Count = 0;
    let pathCount = 0;

    // @ts-ignore
    res.rows.forEach(r => {
        if (r.start_url && r.start_url.startsWith('data:')) {
            base64Count++;
            console.log(`[Base64] ID: ${r.id}, Len: ${r.len}`);
        } else {
            pathCount++;
            console.log(`[Path] ID: ${r.id}, URL: ${r.start_url}`);
        }
    });

    console.log(`Total: ${res.rows.length}, Base64: ${base64Count}, Paths: ${pathCount}`);
}

analyzeUrls();
