(function () {
    "use strict";

    var ctx = null;
    var unlocked = false;

    function ensureCtx() {
        if (ctx || !window.AudioContext) {
            return ctx;
        }
        ctx = new AudioContext();
        return ctx;
    }

    function unlockAudio() {
        if (unlocked) {
            return;
        }
        var c = ensureCtx();
        if (!c) {
            return;
        }
        if (c.state === "suspended") {
            c.resume();
        }
        unlocked = true;
    }

    function tone(freq, duration, volume, type, freqEnd) {
        var c = ensureCtx();
        if (!c) {
            return;
        }
        var now = c.currentTime;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = type || "sine";
        osc.frequency.setValueAtTime(freq, now);
        if (typeof freqEnd === "number") {
            osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + duration);
        }
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + duration + 0.03);
    }

    /** نقر رئيسي (زر Play / دخول) */
    function playPrimary() {
        tone(185, 0.05, 0.04, "square", 95);
        setTimeout(function () {
            tone(330, 0.06, 0.028, "triangle", 220);
        }, 35);
    }

    /** زر ثانوي / إطار */
    function playSecondary() {
        tone(280, 0.055, 0.022, "triangle", 180);
    }

    /** بطاقة / عنصر لعبة */
    function playCard() {
        tone(520, 0.045, 0.032, "triangle", 380);
    }

    /** نقر عام */
    function playSoft() {
        tone(400, 0.04, 0.018, "sine", 320);
    }

    /** سحب منزلق */
    function playTick() {
        tone(650, 0.028, 0.012, "sine");
    }

    function playClick(target) {
        if (!target) {
            return;
        }
        unlockAudio();

        var el = target.nodeType === 1 ? target : target.parentElement;
        if (!el) {
            return;
        }

        if (el.closest(".card")) {
            playCard();
            return;
        }
        if (el.closest(".btn-play")) {
            playPrimary();
            return;
        }
        if (el.closest(".btn-outline")) {
            playSecondary();
            return;
        }
        if (el.closest(".ghost-btn")) {
            playSecondary();
            return;
        }
        if (el.closest(".memorize-opt label")) {
            playSoft();
            return;
        }
        if (el.closest('input[type="range"]')) {
            playTick();
            return;
        }
        if (el.closest("button, a[href], select")) {
            playSoft();
            return;
        }
    }

    var rangeArmed = false;
    document.addEventListener(
        "pointerdown",
        function (e) {
            playClick(e.target);
            if (e.target && e.target.matches && e.target.matches('input[type="range"]')) {
                rangeArmed = true;
            }
        },
        { passive: true }
    );

    document.addEventListener(
        "input",
        function (e) {
            if (!rangeArmed || !e.target || !e.target.matches || !e.target.matches('input[type="range"]')) {
                return;
            }
            playTick();
        },
        { passive: true }
    );

    document.addEventListener(
        "pointerup",
        function () {
            rangeArmed = false;
        },
        { passive: true }
    );

    document.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") {
            return;
        }
        var active = document.activeElement;
        if (!active) {
            return;
        }
        if (active.matches("button, a, .card, input, select, label")) {
            playClick(active);
        }
    });
})();
