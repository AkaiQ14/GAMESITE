(function () {
    "use strict";

    function getConfig() {
        return window.__LOGIN_CONFIG__;
    }

    function login() {
        const cfg = getConfig();
        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");

        if (!usernameInput || !passwordInput) {
            return;
        }

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            alert("يرجى إدخال اسم المستخدم وكلمة المرور.");
            return;
        }

        if (!cfg || typeof cfg.username !== "string" || typeof cfg.password !== "string") {
            alert("إعدادات الدخول غير محمّلة. تحقق من ملف js/env.config.js.");
            return;
        }

        if (!cfg.username || !cfg.password) {
            alert(
                "لم يُضبط اسم المستخدم وكلمة المرور المعتمدة.\n" +
                    "عيّن LOGIN_USERNAME و LOGIN_PASSWORD ثم نفّذ: node scripts/generate-env.js"
            );
            return;
        }

        if (username !== cfg.username || password !== cfg.password) {
            alert("اسم المستخدم أو كلمة المرور غير صحيحة.");
            return;
        }

        localStorage.setItem("username", username);
        window.location.href = "games.html";
    }

    document.addEventListener("DOMContentLoaded", function () {
        var btn = document.getElementById("loginBtn");
        if (btn) {
            btn.addEventListener("click", login);
        }
    });

    window.login = login;
})();
