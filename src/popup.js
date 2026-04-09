(function () {
  'use strict';

  function initTabs() {
    const navBtns = document.querySelectorAll('.nav_btn');
    const tabs = document.querySelectorAll('.tab');

    navBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const targetTab = this.dataset.tab;

        // deactivate all
        navBtns.forEach(function (b) { b.classList.remove('nav_btn-active'); });
        tabs.forEach(function (t) { t.classList.remove('tab-active'); });

        // activate selected
        this.classList.add('nav_btn-active');
        document.getElementById('tab-' + targetTab).classList.add('tab-active');
      });
    });
  }


  async function init() {
    initTabs();
    DetectionTab.init();
    await DataService.init();
    lucide.createIcons();
    console.log('[App] Ready.');
  }

  document.addEventListener('DOMContentLoaded', init);

})();