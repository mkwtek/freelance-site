// Business Name (placeholder) - small progressive enhancements.
// The page works fully without this file.
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  // "Free site check" button preselects that option in the contact form
  document.querySelectorAll('[data-need]').forEach(function (link) {
    link.addEventListener('click', function () {
      var select = document.getElementById('f-need');
      if (select) select.value = link.getAttribute('data-need');
    });
  });

  // Meter needles swing up when the test pattern scrolls into view
  var meters = document.querySelector('.meters');
  var reveals = document.querySelectorAll('.channel, .hood, .case, .mini-case, .tuner li, .quote');
  reveals.forEach(function (el) { el.classList.add('reveal'); });

  if (!('IntersectionObserver' in window)) {
    if (meters) meters.classList.add('is-on');
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add(entry.target === meters ? 'is-on' : 'is-visible');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  if (meters) io.observe(meters);
  reveals.forEach(function (el) { io.observe(el); });
})();
