(function() {
  /* CUSTOM CURSOR */
  var dot = document.getElementById('cursorDot');
  var ring = document.getElementById('cursorRing');
  if (dot && ring) {
    var mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', function(e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    });
    function animRing() {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(animRing);
    }
    animRing();
    document.querySelectorAll('a, button, .article-card').forEach(function(el) {
      el.addEventListener('mouseenter', function() { document.body.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', function() { document.body.classList.remove('cursor-hover'); });
    });
  }

  /* SCROLL REVEAL — trigger immediately if already in viewport */
  var revealEls = document.querySelectorAll('.reveal');

  function checkVisible(el) {
    var rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight - 40;
  }

  function revealAll() {
    revealEls.forEach(function(el) {
      if (checkVisible(el)) el.classList.add('visible');
    });
  }

  /* Run once immediately, then on scroll */
  revealAll();
  window.addEventListener('scroll', revealAll, { passive: true });
})();
