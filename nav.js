(function () {
  // Detect depth: practice pages are one level deep (e.g. /aile-hukuku/)
  var path = window.location.pathname;
  var isRoot = path === '/' || path.endsWith('/index.html') && path.split('/').filter(Boolean).length <= 1 || path === '/index.html';
  // More reliable: count non-empty segments
  var segments = path.replace(/\/index\.html$/, '').split('/').filter(Boolean);
  var atRoot = segments.length === 0;
  var root = atRoot ? './' : '../';
  var home = atRoot ? '' : '../';

  function inject(url, placeholderId, tokens, cb) {
    var el = document.getElementById(placeholderId);
    if (!el) { if (cb) cb(); return; }
    fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        Object.keys(tokens).forEach(function (k) {
          html = html.split('{{' + k + '}}').join(tokens[k]);
        });
        el.outerHTML = html;
        if (cb) cb();
      });
  }

  var tokens = { root: root, home: home };

  inject(root + 'header.html', 'site-header', tokens, function () {
    initNav();
  });

  inject(root + 'footer.html', 'site-footer', tokens);

  function initNav() {
    var nav = document.getElementById('nav');
    var burger = document.getElementById('burger');
    var mobileMenu = document.getElementById('mobileMenu');
    var mobileServicesToggle = document.getElementById('mobileServicesToggle');
    var mobileSub = document.getElementById('mobileSub');
    var mobileArrow = document.getElementById('mobileArrow');

    // Scroll: toggle .scrolled on nav
    window.addEventListener('scroll', function () {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
    // Run once on load in case page is already scrolled
    if (nav && window.scrollY > 60) nav.classList.add('scrolled');

    if (!burger || !mobileMenu) return;

    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      burger.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    if (mobileServicesToggle) {
      mobileServicesToggle.addEventListener('click', function (e) {
        e.preventDefault();
        var open = mobileSub.classList.toggle('open');
        if (mobileArrow) mobileArrow.classList.toggle('open', open);
      });
    }

    mobileMenu.querySelectorAll('a:not(#mobileServicesToggle)').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        burger.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
})();
