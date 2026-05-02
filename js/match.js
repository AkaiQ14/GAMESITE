(function () {
    "use strict";

    var STORAGE_KEY = "matchFullState";

    var state = {
        players: ["لاعب 1", "لاعب 2"],
        scores: [0, 0],
        turnIndex: 0,
        turnSeconds: 15,
        memorizeSeconds: 5,
        cardCount: 12,
        deck: [],
        openCards: [],
        matchedPairs: 0,
        totalPairs: 0,
        locked: true,
        turnInterval: null,
        memorizeInterval: null,
        turnRemaining: 15,
        phase: "memorize",
        memorizeRemain: 0
    };

    function $(id) { return document.getElementById(id); }

    /** استرجاع الحفظ فقط عند تحديث الصفحة (F5) — أي دخول آخر يبدأ جولة جديدة */
    function isPageReload() {
        try {
            var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
            if (nav && nav.type === "reload") {
                return true;
            }
        } catch (e) {}
        try {
            if (typeof performance.navigation !== "undefined" && performance.navigation.type === 1) {
                return true;
            }
        } catch (e2) {}
        return false;
    }

    function clearSavedMatch() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
    }

    function replayFresh() {
        clearSavedMatch();
        location.reload();
    }

    function shuffle(list) {
        var arr = list.slice();
        for (var i = arr.length - 1; i > 0; i -= 1) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = arr[i];
            arr[i] = arr[j];
            arr[j] = t;
        }
        return arr;
    }

    function clampEven(min, max, value, fallback) {
        var n = parseInt(value, 10);
        if (isNaN(n)) { n = fallback; }
        if (n < min) { n = min; }
        if (n > max) { n = max; }
        if (n % 2 !== 0) { n -= 1; }
        return Math.max(min, n);
    }

    function getSessionKey() {
        return [
            localStorage.getItem("player1") || "",
            localStorage.getItem("player2") || "",
            localStorage.getItem("time") || "",
            String(clampEven(10, 30, localStorage.getItem("cardCount"), 12)),
            localStorage.getItem("memorizeTime") || "5"
        ].join("\x1e");
    }

    function persistState() {
        try {
            var payload = {
                key: getSessionKey(),
                phase: state.phase,
                memorizeRemain: state.memorizeRemain,
                scores: state.scores.slice(),
                turnIndex: state.turnIndex,
                turnRemaining: state.turnRemaining,
                matchedPairs: state.matchedPairs,
                totalPairs: state.totalPairs,
                cardCount: state.cardCount,
                locked: state.locked,
                deck: state.deck.map(function (c) {
                    return {
                        pairId: c.pairId,
                        src: c.src,
                        name: c.name,
                        matched: c.matched,
                        open: !!(c.open || c.matched)
                    };
                })
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch (e) {
            /* ignore quota */
        }
    }

    function loadSavedState() {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return false;
        }
        var o;
        try {
            o = JSON.parse(raw);
        } catch (e) {
            return false;
        }
        if (!o || o.key !== getSessionKey() || !Array.isArray(o.deck) || o.deck.length === 0) {
            return false;
        }

        state.cardCount = o.cardCount || state.cardCount;
        state.deck = o.deck.map(function (row, idx) {
            return {
                id: idx,
                pairId: row.pairId,
                src: row.src,
                name: row.name,
                matched: !!row.matched,
                open: !!row.open
            };
        });
        state.totalPairs = o.totalPairs || Math.floor(state.deck.length / 2);
        state.scores = Array.isArray(o.scores) ? [o.scores[0] || 0, o.scores[1] || 0] : [0, 0];
        state.turnIndex = typeof o.turnIndex === "number" ? o.turnIndex : 0;
        state.turnRemaining = typeof o.turnRemaining === "number" ? o.turnRemaining : state.turnSeconds;
        state.matchedPairs = typeof o.matchedPairs === "number" ? o.matchedPairs : 0;
        state.phase = o.phase || "memorize";
        state.memorizeRemain = typeof o.memorizeRemain === "number" ? o.memorizeRemain : state.memorizeSeconds;
        state.locked = !!o.locked;
        return true;
    }

    function readSetup() {
        state.players[0] = localStorage.getItem("player1") || "لاعب 1";
        state.players[1] = localStorage.getItem("player2") || "لاعب 2";
        state.turnSeconds = parseInt(localStorage.getItem("time"), 10) || 15;
        state.memorizeSeconds = parseInt(localStorage.getItem("memorizeTime"), 10) || 5;
        state.cardCount = clampEven(10, 30, localStorage.getItem("cardCount"), 12);
    }

    function getPairId(item) {
        if (item && item.pairId) {
            return String(item.pairId);
        }
        return item && item.name ? String(item.name) : "";
    }

    function buildDeck() {
        var pool = Array.isArray(window.MATCH_IMAGE_POOL) ? window.MATCH_IMAGE_POOL.slice() : [];
        pool = pool.filter(function (item) {
            return item && item.src && String(item.src).length > 0;
        });
        if (pool.length === 0) {
            state.deck = [];
            state.totalPairs = 0;
            return false;
        }

        var neededPairs = state.cardCount / 2;
        var maxPairs = pool.length;
        if (neededPairs > maxPairs) {
            neededPairs = maxPairs;
            state.cardCount = neededPairs * 2;
        }
        if (neededPairs < 1) {
            state.deck = [];
            state.totalPairs = 0;
            return false;
        }

        var selected = shuffle(pool).slice(0, neededPairs);
        var paired = [];
        selected.forEach(function (item) {
            var pid = getPairId(item);
            var label = item.name ? String(item.name) : pid;
            var src = String(item.src);
            paired.push({ pairId: pid, src: src, name: label });
            paired.push({ pairId: pid, src: src, name: label });
        });
        state.deck = shuffle(paired).map(function (c, idx) {
            return {
                id: idx,
                pairId: c.pairId,
                src: c.src,
                name: c.name,
                open: true,
                matched: false
            };
        });
        state.totalPairs = neededPairs;
        state.phase = "memorize";
        state.memorizeRemain = state.memorizeSeconds;
        state.scores = [0, 0];
        state.turnIndex = 0;
        state.matchedPairs = 0;
        state.openCards = [];
        state.locked = true;
        return true;
    }

    function createCardEl(card) {
        var btn = document.createElement("button");
        var show = card.matched || card.open;
        btn.className = "card" + (show ? " is-open" : "") + (card.matched ? " is-matched" : "");
        btn.type = "button";
        btn.dataset.id = String(card.id);
        btn.innerHTML =
            '<span class="card-face card-back">' + (card.id + 1) + "</span>" +
            '<span class="card-face card-front">' +
            '<img src="' + card.src + '" alt="' + card.name + '" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">' +
            '<span class="fallback">' + card.name + "</span>" +
            "</span>";
        return btn;
    }

    function renderBoard() {
        var board = $("board");
        board.innerHTML = "";
        board.style.gridTemplateColumns = "repeat(auto-fill, minmax(118px, 1fr))";
        state.deck.forEach(function (card) {
            board.appendChild(createCardEl(card));
        });
    }

    function setCardState(card, open) {
        card.open = open;
        var el = document.querySelector('.card[data-id="' + card.id + '"]');
        if (!el) { return; }
        el.classList.toggle("is-open", open || card.matched);
        el.classList.toggle("is-matched", card.matched);
    }

    function flipAllDown() {
        state.deck.forEach(function (card) {
            if (!card.matched) {
                setCardState(card, false);
            }
        });
    }

    function updatePlayerColors() {
        var p0 = $("pbox0");
        var p1 = $("pbox1");
        var turnBar = $("turnBar");
        if (p0) {
            p0.classList.toggle("is-active", state.turnIndex === 0 && state.phase === "play");
        }
        if (p1) {
            p1.classList.toggle("is-active", state.turnIndex === 1 && state.phase === "play");
        }
        if (turnBar) {
            turnBar.classList.remove("turn-active-0", "turn-active-1");
            if (state.phase === "play") {
                turnBar.classList.add(state.turnIndex === 0 ? "turn-active-0" : "turn-active-1");
            } else {
                turnBar.classList.add("turn-active-0");
            }
        }
    }

    function updateHud() {
        $("playerA").textContent = state.players[0];
        $("playerB").textContent = state.players[1];
        $("scoreA").textContent = String(state.scores[0]);
        $("scoreB").textContent = String(state.scores[1]);
        $("turnName").textContent = state.players[state.turnIndex];
        $("turnClock").textContent = String(state.turnRemaining);
        updatePlayerColors();
    }

    function switchTurn() {
        state.openCards.forEach(function (c) { if (!c.matched) { setCardState(c, false); } });
        state.openCards = [];
        state.turnIndex = state.turnIndex === 0 ? 1 : 0;
        state.turnRemaining = state.turnSeconds;
        updateHud();
        persistState();
    }

    function stopTurnTimer() {
        if (state.turnInterval) {
            clearInterval(state.turnInterval);
            state.turnInterval = null;
        }
    }

    function showResultModal(title, text) {
        var modal = $("resultModal");
        var titleEl = $("resultTitle");
        var textEl = $("resultText");
        if (!modal || !titleEl || !textEl) {
            return;
        }
        titleEl.textContent = title;
        textEl.textContent = text;
        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
    }

    function hideResultModal() {
        var modal = $("resultModal");
        if (!modal) {
            return;
        }
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
    }

    function startTurnTimer() {
        stopTurnTimer();
        if (state.turnRemaining <= 0) {
            state.turnRemaining = state.turnSeconds;
        }
        updateHud();
        state.phase = "play";
        state.turnInterval = setInterval(function () {
            if (state.locked) {
                return;
            }
            state.turnRemaining -= 1;
            if (state.turnRemaining <= 0) {
                switchTurn();
            }
            updateHud();
            persistState();
        }, 1000);
        persistState();
    }

    function endGame() {
        stopTurnTimer();
        if (state.memorizeInterval) {
            clearInterval(state.memorizeInterval);
            state.memorizeInterval = null;
        }
        state.locked = true;
        state.phase = "done";
        var winnerText;
        var detailsText;
        if (state.scores[0] > state.scores[1]) {
            winnerText = "الفائز: " + state.players[0];
            detailsText = state.players[0] + " حصد " + state.scores[0] + " نقطة";
        } else if (state.scores[1] > state.scores[0]) {
            winnerText = "الفائز: " + state.players[1];
            detailsText = state.players[1] + " حصد " + state.scores[1] + " نقطة";
        } else {
            winnerText = "تعادل!";
            detailsText = "النتيجة النهائية: " + state.scores[0] + " - " + state.scores[1];
        }
        $("statusLine").textContent = winnerText;
        showResultModal("انتهت اللعبة", detailsText);
        persistState();
    }

    function handleCardClick(ev) {
        var btn = ev.target.closest(".card");
        if (!btn || state.locked || state.phase !== "play") { return; }
        var id = parseInt(btn.dataset.id, 10);
        var card = state.deck[id];
        if (!card || card.open || card.matched) { return; }
        if (state.openCards.length >= 2) { return; }

        setCardState(card, true);
        state.openCards.push(card);
        persistState();

        if (state.openCards.length === 2) {
            state.locked = true;
            persistState();
            var c1 = state.openCards[0];
            var c2 = state.openCards[1];
            setTimeout(function () {
                if (c1.pairId === c2.pairId) {
                    c1.matched = true;
                    c2.matched = true;
                    setCardState(c1, true);
                    setCardState(c2, true);
                    state.openCards = [];
                    state.scores[state.turnIndex] += 1;
                    state.matchedPairs += 1;
                    updateHud();
                    if (state.matchedPairs >= state.totalPairs) {
                        endGame();
                        return;
                    }
                    state.locked = false;
                    persistState();
                    return;
                }
                setCardState(c1, false);
                setCardState(c2, false);
                state.openCards = [];
                switchTurn();
                state.locked = false;
                persistState();
            }, 650);
        }
    }

    function startMemorizePhase(fromRemain) {
        var overlay = $("memorizeOverlay");
        var remain = typeof fromRemain === "number" ? fromRemain : state.memorizeSeconds;
        if (remain < 0) { remain = 0; }
        state.phase = "memorize";
        state.memorizeRemain = remain;
        overlay.textContent = "وقت الحفظ: " + remain + " ث";
        overlay.classList.add("show");
        $("statusLine").textContent = "حفظ مواقع الأوراق — " + remain + " ث";
        state.locked = true;
        if (state.memorizeInterval) { clearInterval(state.memorizeInterval); }
        if (remain === 0) {
            overlay.classList.remove("show");
            flipAllDown();
            state.locked = false;
            startTurnTimer();
            $("statusLine").textContent = "ابدأوا اللعب!";
            persistState();
            return;
        }
        state.memorizeInterval = setInterval(function () {
            remain -= 1;
            state.memorizeRemain = remain;
            persistState();
            if (remain <= 0) {
                clearInterval(state.memorizeInterval);
                state.memorizeInterval = null;
                overlay.classList.remove("show");
                flipAllDown();
                state.locked = false;
                startTurnTimer();
                $("statusLine").textContent = "ابدأوا اللعب!";
                persistState();
                return;
            }
            overlay.textContent = "وقت الحفظ: " + remain + " ث";
            $("statusLine").textContent = "حفظ مواقع الأوراق — " + remain + " ث";
        }, 1000);
        persistState();
    }

    function resumeAfterRestore() {
        $("turnTimeLabel").textContent = String(state.turnSeconds);
        $("memorizeLabel").textContent = String(state.memorizeSeconds);
        $("cardCountLabel").textContent = String(state.cardCount);
        updateHud();

        if (state.phase === "memorize") {
            $("statusLine").textContent = "متابعة وقت الحفظ…";
            startMemorizePhase(state.memorizeRemain);
            return;
        }
        if (state.phase === "play") {
            stopTurnTimer();
            $("statusLine").textContent = "ابدأوا اللعب!";
            if (state.matchedPairs >= state.totalPairs) {
                endGame();
                return;
            }
            state.openCards = [];
            state.locked = false;
            startTurnTimer();
            return;
        }
        if (state.phase === "done") {
            stopTurnTimer();
            if (state.memorizeInterval) {
                clearInterval(state.memorizeInterval);
                state.memorizeInterval = null;
            }
            var ov = $("memorizeOverlay");
            if (ov) { ov.classList.remove("show"); }
            var winnerText;
            var detailsText;
            if (state.scores[0] > state.scores[1]) {
                winnerText = "الفائز: " + state.players[0];
                detailsText = state.players[0] + " حصد " + state.scores[0] + " نقطة";
            } else if (state.scores[1] > state.scores[0]) {
                winnerText = "الفائز: " + state.players[1];
                detailsText = state.players[1] + " حصد " + state.scores[1] + " نقطة";
            } else {
                winnerText = "تعادل!";
                detailsText = "النتيجة النهائية: " + state.scores[0] + " - " + state.scores[1];
            }
            $("statusLine").textContent = winnerText;
            showResultModal("انتهت اللعبة", detailsText);
            state.locked = true;
        }
    }

    function init() {
        hideResultModal();
        readSetup();
        if (!isPageReload()) {
            clearSavedMatch();
        }
        var restored = loadSavedState();
        var ok = restored;

        if (!restored) {
            ok = buildDeck();
        }

        renderBoard();
        $("board").addEventListener("click", handleCardClick);
        var replayBtn = $("resultReplayBtn");
        var exitBtn = $("resultExitBtn");
        var sidebarReplay = $("sidebarReplayBtn");
        if (replayBtn) {
            replayBtn.addEventListener("click", replayFresh);
        }
        if (sidebarReplay) {
            sidebarReplay.addEventListener("click", replayFresh);
        }
        if (exitBtn) {
            exitBtn.addEventListener("click", function () {
                location.href = "games.html";
            });
        }

        window.addEventListener("beforeunload", persistState);
        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "hidden") {
                persistState();
            }
        });

        if (!ok || state.deck.length === 0) {
            $("statusLine").textContent =
                "لا توجد كروت في القائمة. أضف صوراً في مجلد images ثم شغّل في الطرفية: npm run cards";
            stopTurnTimer();
            return;
        }

        $("turnTimeLabel").textContent = String(state.turnSeconds);
        $("memorizeLabel").textContent = String(state.memorizeSeconds);
        $("cardCountLabel").textContent = String(state.cardCount);

        if (!restored) {
            updateHud();
            $("statusLine").textContent = "تم فتح جميع البطاقات للحفظ.";
            startMemorizePhase();
            persistState();
        } else {
            resumeAfterRestore();
        }
    }

    document.addEventListener("DOMContentLoaded", init);
})();
