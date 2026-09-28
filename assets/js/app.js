/* 杭州五强电子 · 雙語網站互動
   1. 語言切換（記憶於 localStorage）
   2. 行動版導覽
   3. 捲動時頁首陰影
   4. 產品型號篩選與解決方案搜尋
   5. 進場動畫（IntersectionObserver，尊重 prefers-reduced-motion）
*/
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------- 語言切換 */
  var STORAGE_KEY = 'wq-lang';

  function applyLanguage(lang) {
    var next = lang === 'en' ? 'en' : 'zh';
    root.setAttribute('data-lang', next);
    root.setAttribute('lang', next === 'en' ? 'en' : 'zh-Hans');

    var title = root.getAttribute('data-title-' + next);
    var desc = root.getAttribute('data-desc-' + next);
    if (title) document.title = title;
    if (desc) {
      var meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', desc);
    }

    document.querySelectorAll('img[data-alt-' + next + ']').forEach(function (img) {
      img.setAttribute('alt', img.getAttribute('data-alt-' + next));
    });

    document.querySelectorAll('input[data-ph-' + next + ']').forEach(function (input) {
      input.setAttribute('placeholder', input.getAttribute('data-ph-' + next));
    });

    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* 無痕模式忽略 */ }
  }

  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'zh') applyLanguage(saved);
  } catch (e) { /* 忽略 */ }

  var langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', function () {
      applyLanguage(root.getAttribute('data-lang') === 'en' ? 'zh' : 'en');
    });
  }

  /* ---------------------------------------------------------- 行動版導覽 */
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('primary-nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (event) {
      if (event.target.tagName === 'A' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  /* ---------------------------------------------------------- 頁首狀態 */
  var header = document.getElementById('site-head');
  if (header && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.height = '1px';
    header.parentNode.insertBefore(sentinel, header);
    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }, { rootMargin: '-1px 0px 0px 0px' }).observe(sentinel);
  }

  /* ---------------------------------------------------------- 進場動畫 */
  /* 進場動畫：以 IntersectionObserver 觸發，減少動態偏好交由 CSS 處理 */
  if ('IntersectionObserver' in window) {
    var groups = [
      ['.stats .stat', 60],
      ['.sec-head', 0],
      ['.index > .chips', 0],
      ['.model-table tbody tr', 30],
      ['.feature', 0],
      ['.feature__media', 0],
      ['.feature__body', 60],
      ['.compare', 0],
      ['.curves__body > *', 60],
      ['.gallery figure', 70],
      ['.doc', 24],
      ['.note', 0],
      ['.support__item', 60],
      ['.medialist li', 26],
      ['.statement', 0],
      ['.about__body', 0],
      ['.facts > div', 26],
      ['.news__group', 0],
      ['.job', 0],
      ['.contact__details', 0],
      ['.brief', 70]
    ];

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = Number(el.dataset.revealDelay || 0);
        window.setTimeout(function () { el.classList.add('is-in'); }, reduceMotion ? 0 : delay);
        revealObserver.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    groups.forEach(function (group) {
      document.querySelectorAll(group[0]).forEach(function (el, index) {
        if (el.closest('.library__rail') || el.classList.contains('curves__chart')) return;
        el.setAttribute('data-reveal', '');
        el.dataset.revealDelay = String(Math.min(index, 6) * group[1]);
        revealObserver.observe(el);
      });
    });
  }

  /* ---------------------------------------------------------- 產品型號篩選 */
  var index = document.querySelector('[data-index]');
  if (index) {
    var rows = Array.prototype.slice.call(index.querySelectorAll('.model-table tbody tr'));
    var emptyState = index.querySelector('.index__empty');

    index.querySelectorAll('.chip[data-cat]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var cat = chip.dataset.cat;
        index.querySelectorAll('.chip[data-cat]').forEach(function (other) {
          other.classList.toggle('is-on', other === chip);
        });
        var shown = 0;
        rows.forEach(function (row) {
          var match = cat === 'all' || row.dataset.cat === cat;
          row.classList.toggle('is-out', !match);
          if (match) shown += 1;
        });
        if (emptyState) emptyState.hidden = shown > 0;
      });
    });
  }

  /* ---------------------------------------------------------- 解決方案篩選與搜尋 */
  var docList = document.getElementById('doclist');
  if (docList) {
    var docs = Array.prototype.slice.call(docList.querySelectorAll('.doc'));
    var docEmpty = document.getElementById('doc-empty');
    var search = document.getElementById('doc-search');
    var currentCat = 'all';

    function filterDocs() {
      var term = (search && search.value ? search.value : '').trim().toLowerCase();
      var shown = 0;
      docs.forEach(function (doc) {
        var catOk = currentCat === 'all' || doc.dataset.docCat === currentCat;
        var keys = (doc.dataset.keys || '') + ' ' + doc.textContent;
        var termOk = !term || keys.toLowerCase().indexOf(term) !== -1;
        var match = catOk && termOk;
        doc.classList.toggle('is-out', !match);
        if (match) shown += 1;
      });
      if (docEmpty) docEmpty.hidden = shown > 0;
    }

    document.querySelectorAll('.chip[data-doc-cat]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        currentCat = chip.dataset.docCat;
        document.querySelectorAll('.chip[data-doc-cat]').forEach(function (other) {
          other.classList.toggle('is-on', other === chip);
        });
        filterDocs();
      });
    });

    /* 直接搜尋時跨分類查找，避免分類與關鍵字互相抵消 */
    if (search) {
      search.addEventListener('input', function () {
        if (search.value.trim() && currentCat !== 'all') {
          currentCat = 'all';
          document.querySelectorAll('.chip[data-doc-cat]').forEach(function (chip) {
            chip.classList.toggle('is-on', chip.dataset.docCat === 'all');
          });
        }
        filterDocs();
      });
    }
  }
})();
