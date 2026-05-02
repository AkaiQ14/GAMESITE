/**
 * يقرأ مجلد images/ ويكتب js/match-images.js
 * المتصفح لا يستطيع قراءة المجلد مباشرة؛ لذلك نحدّث القائمة بهذا الأمر بعد إضافة الصور.
 *
 * من جذر المشروع: npm run cards
 */
const fs = require("fs");
const path = require("path");

const IMAGES_DIR = path.join(__dirname, "..", "images");
const OUT_FILE = path.join(__dirname, "..", "js", "match-images.js");

const ALLOWED = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

function shouldSkip(filename) {
    const lower = filename.toLowerCase();
    if (lower.startsWith(".")) {
        return true;
    }
    if (lower === ".ds_store" || lower === "thumbs.db") {
        return true;
    }
    return false;
}

function main() {
    if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
        writeFile([]);
        console.log("تم إنشاء مجلد images/ — أضف صور الكروت ثم شغّل: npm run cards");
        return;
    }

    const files = fs
        .readdirSync(IMAGES_DIR)
        .filter(function (f) {
            if (shouldSkip(f)) {
                return false;
            }
            const ext = path.extname(f).toLowerCase();
            return ALLOWED.has(ext);
        })
        .sort(function (a, b) {
            return a.localeCompare(b, "en");
        });

    const pool = files.map(function (f) {
        var ext = path.extname(f);
        var base = path.basename(f, ext);
        return {
            pairId: f,
            name: base,
            src: "images/" + f.replace(/\\/g, "/"),
        };
    });

    writeFile(pool);
    console.log("تم كتابة", OUT_FILE, "— عدد الصور:", pool.length);
}

function writeFile(pool) {
    var json = JSON.stringify(pool, null, 4);
    var content =
        "/**\n" +
        " * يُولَّد تلقائياً من مجلد images/ — لا تعدل يدوياً.\n" +
        " * بعد إضافة أو حذف صور: npm run cards\n" +
        " */\n" +
        "window.MATCH_IMAGE_POOL = " +
        json +
        ";\n";
    fs.writeFileSync(OUT_FILE, content, "utf8");
}

main();
