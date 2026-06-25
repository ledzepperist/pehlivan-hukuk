(function () {
  var el = document.getElementById('practice-posts');
  if (!el) return;
  var area = el.dataset.area;
  if (!area) return;

  fetch('../posts.json?' + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (all) {
      var posts = all.filter(function (p) { return p.practiceArea === area; });

      if (!posts.length) {
        el.innerHTML =
          '<div class="blog-empty">' +
            '<p>Bu alanda henüz makale bulunmuyor.</p>' +
          '</div>';
        return;
      }

      // Featured first, then chronological
      posts.sort(function (a, b) {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });

      var html =
        '<div class="blog-section">' +
          '<div class="blog-header">' +
            '<span class="blog-label">Makaleler</span>' +
            '<span class="blog-count">' + posts.length + ' yazı</span>' +
          '</div>' +
          '<div class="blog-grid">';

      posts.forEach(function (p, i) {
        html +=
          '<a href="../article/?slug=' + p.slug + '" class="blog-card reveal stagger-' + Math.min(i + 1, 6) + '">' +
            '<div class="blog-card-top">' +
              '<span class="blog-card-date">' + (p.date || '') + '</span>' +
              (p.featured ? '<span class="blog-card-featured">Öne Çıkan</span>' : '') +
              (p.tag ? '<span class="blog-card-tag">' + p.tag + '</span>' : '') +
            '</div>' +
            '<h3 class="blog-card-title">' + p.title + '</h3>' +
            '<p class="blog-card-excerpt">' + (p.excerpt || '') + '</p>' +
            '<div class="blog-card-footer">' +
              '<span class="blog-card-read">Devamını Oku</span>' +
              '<span class="blog-card-arrow">→</span>' +
            '</div>' +
          '</a>';
      });

      html += '</div></div>';
      el.innerHTML = html;

      // Trigger reveal for dynamically injected cards
      el.querySelectorAll('.reveal').forEach(function (card) {
        card.classList.add('visible');
      });
    })
    .catch(function () {
      el.innerHTML = '';
    });
})();
