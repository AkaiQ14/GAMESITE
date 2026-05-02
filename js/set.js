(function () {
    "use strict";

    var CARD_MIN = 10;
    var CARD_MAX = 30;
    var MEMORIZE_TIMES = ["3", "5", "8", "10"];

    function clampCardCount(n) {
        var x = parseInt(n, 10);
        if (isNaN(x)) {
            return 20;
        }
        x = Math.round(x / 2) * 2;
        return Math.min(CARD_MAX, Math.max(CARD_MIN, x));
    }

    function syncCardDisplay(slider, displayEl) {
        if (!slider || !displayEl) {
            return;
        }
        var v = clampCardCount(slider.value);
        slider.value = String(v);
        displayEl.textContent = String(v);
        slider.setAttribute("aria-valuenow", String(v));
    }

    function loadDefaults() {
        var p1 = document.getElementById("player1");
        var p2 = document.getElementById("player2");
        var timeSel = document.getElementById("roundTime");
        var cardSlider = document.getElementById("cardCount");
        var cardDisplay = document.getElementById("cardCountDisplay");
        if (!p1 || !p2 || !timeSel) {
            return;
        }

        var sp1 = localStorage.getItem("player1");
        var sp2 = localStorage.getItem("player2");
        var st = localStorage.getItem("time");
        var savedUser = localStorage.getItem("username");
        if (sp1) {
            p1.value = sp1;
        } else if (savedUser) {
            p1.value = savedUser;
        }
        if (sp2) {
            p2.value = sp2;
        }
        if (st && ["10", "15", "30", "45"].indexOf(st) !== -1) {
            timeSel.value = st;
        }

        if (cardSlider && cardDisplay) {
            var sc = localStorage.getItem("cardCount");
            if (sc !== null) {
                cardSlider.value = String(clampCardCount(sc));
            }
            syncCardDisplay(cardSlider, cardDisplay);
        }

        var sm = localStorage.getItem("memorizeTime");
        if (sm && MEMORIZE_TIMES.indexOf(sm) !== -1) {
            var radio = document.querySelector('input[name="memorizeTime"][value="' + sm + '"]');
            if (radio) {
                radio.checked = true;
            }
        }
    }

    function saveSetup() {
        var p1 = document.getElementById("player1");
        var p2 = document.getElementById("player2");
        var timeSel = document.getElementById("roundTime");
        var cardSlider = document.getElementById("cardCount");
        if (!p1 || !p2 || !timeSel) {
            return;
        }

        var name1 = p1.value.trim();
        var name2 = p2.value.trim();

        if (!name1 || !name2) {
            alert("يرجى إدخال اسم اللاعب الأول والثاني.");
            return;
        }

        localStorage.setItem("player1", name1);
        localStorage.setItem("player2", name2);
        localStorage.setItem("time", timeSel.value);

        if (cardSlider) {
            localStorage.setItem("cardCount", String(clampCardCount(cardSlider.value)));
        }

        var memRadio = document.querySelector('input[name="memorizeTime"]:checked');
        var memVal = memRadio ? memRadio.value : "5";
        if (MEMORIZE_TIMES.indexOf(memVal) === -1) {
            memVal = "5";
        }
        localStorage.setItem("memorizeTime", memVal);
        localStorage.setItem("selectedGame", "MATCH");

        var sessionKey = [name1, name2, timeSel.value, String(clampCardCount(cardSlider ? cardSlider.value : "20")), memVal].join("\x1e");
        try {
            var raw = localStorage.getItem("matchFullState");
            if (raw) {
                var prev = JSON.parse(raw);
                if (!prev || prev.key !== sessionKey) {
                    localStorage.removeItem("matchFullState");
                }
            }
        } catch (e) {
            localStorage.removeItem("matchFullState");
        }

        window.location.href = "match.html";
    }

    document.addEventListener("DOMContentLoaded", function () {
        loadDefaults();
        var cardSlider = document.getElementById("cardCount");
        var cardDisplay = document.getElementById("cardCountDisplay");
        if (cardSlider && cardDisplay) {
            cardSlider.addEventListener("input", function () {
                syncCardDisplay(cardSlider, cardDisplay);
            });
        }
        var btn = document.getElementById("saveSetupBtn");
        if (btn) {
            btn.addEventListener("click", saveSetup);
        }
    });
})();
