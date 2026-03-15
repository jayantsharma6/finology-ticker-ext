(function () {
  "use strict";

  const link = document.getElementById("ticker-link");
  const label = document.getElementById("ticker-link-label");

  const URL = "https://ticker.finology.in/";

  label.textContent = "Visit Ticker";

  link.addEventListener("click", function (e) {
    e.preventDefault();
    chrome.tabs.create({ url: URL });
    window.close();
  });

})();