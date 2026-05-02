(function () {
    "use strict";

    function openMatch() {
        localStorage.setItem("selectedGame", "MATCH");
        window.location.href = "set.html";
    }

    window.openMatch = openMatch;
})();
