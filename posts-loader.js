(function () {
  var el = document.getElementById('practice-posts');
  if (!el) return;

  var area = el.dataset.area;
  if (!area) return;

  fetch('../posts.json?' + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (all) {
      var posts = all.filter(function (p) { return p.practiceArea === area; });
      if (!posts.length) { el.innerHTML = ''; return; }

      // Sort: featured first, then by date descending
      posts.sort(function (a, b) {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });

      var featured = posts.find(function (p) { return p.featured; });
      var rest = posts.filter(function (p) { return !p.featured; }).slice(0, 4);

      var html = '';

      if (featured) {
        html +=
          '<article class="featured">' +
            '<div class="featured-meta">' +
              '<span class="featured-date">' + featured.date + '</span>' +
              (featured.tag ? '<span class="featured-tag">' + featured.tag + '</span>' : '') +
            '</div>' +
            '<h2 class="featured-title">' + featured.title + '</h2>' +
            '<p class="featured-intro">' + (featured.excerpt || '') + '</p>' +
            '<div class="article-body">' + (featured.content || '') + '</div>' +
            '<a href="../article/?slug=' + featured.slug + '" class="featured-read-more">Devamını Oku →</a>' +
          '</article>';
      }

      if (rest.length) {
        html += '<div class="articles-grid">';
        rest.forEach(function (p, i) {
          html +=
            '<a href="../article/?slug=' + p.slug + '" class="article-card reveal stagger-' + (i + 1) + '" style="text-decoration:none;display:block">' +
              '<div class="ac-date">' + p.date + '</div>' +
              '<h3 class="ac-title">' + p.title + '</h3>' +
              '<p class="ac-excerpt">' + (p.excerpt || '') + '</p>' +
              '<div class="ac-footer"><span class="ac-read">Devamını Oku</span><span class="ac-arrow">→</span></div>' +
            '</a>';
        });
        html += '</div>';
      }

      el.innerHTML = html;
    })
    .catch(function () {
      el.innerHTML = '';
    });
})();
