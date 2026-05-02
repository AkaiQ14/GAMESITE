/**
 * يقرأ LOGIN_USERNAME و LOGIN_PASSWORD من Environment Variables
 * ويكتب js/env.config.js (لا ترفع الأسرار للمستودع — أضف الملف إلى .gitignore إن لزم).
 *
 * PowerShell مثال:
 *   $env:LOGIN_USERNAME="user"; $env:LOGIN_PASSWORD="secret"; node scripts/generate-env.js
 */
const fs = require("fs");
const path = require("path");

const username = process.env.LOGIN_USERNAME;
const password = process.env.LOGIN_PASSWORD;

if (!username || !password) {
    console.error("خطأ: عيّن المتغيرين LOGIN_USERNAME و LOGIN_PASSWORD ثم أعد التشغيل.");
    process.exit(1);
}

const payload = {
    username: String(username),
    password: String(password),
};

const out = `window.__LOGIN_CONFIG__ = ${JSON.stringify(payload, null, 4)};\n`;
const dest = path.join(__dirname, "..", "js", "env.config.js");

fs.writeFileSync(dest, out, "utf8");
console.log("تم إنشاء:", dest);
