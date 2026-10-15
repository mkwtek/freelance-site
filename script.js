// Business Name (placeholder) - small progressive enhancements.
// The page works fully without this file.
(function () {
  'use strict';
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;

  // ---- Mobile menu ----
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

  // ---- "Free site check" links preselect that option in the contact form ----
  document.querySelectorAll('[data-need]').forEach(function (link) {
    link.addEventListener('click', function () {
      var select = document.getElementById('f-need');
      if (select) select.value = link.getAttribute('data-need');
    });
  });

  // ---- Channel dial: turn the knob and light up the matching service card ----
  var dial = document.querySelector('.dial');
  if (dial) {
    var dialButtons = dial.querySelectorAll('.dial-ch');
    dialButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        dial.style.setProperty('--angle', btn.getAttribute('data-angle') + 'deg');
        dialButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        document.querySelectorAll('.channel.is-tuned').forEach(function (c) { c.classList.remove('is-tuned'); });
        var card = document.getElementById(btn.getAttribute('aria-controls'));
        if (!card) return;
        card.classList.add('is-tuned');
        var r = card.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight) {
          card.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      });
    });
  }

  // ---- FM tuning band: the pointer slides to the step you hover, focus or tap ----
  var band = document.querySelector('.tuning-band');
  if (band) {
    var steps = document.querySelectorAll('.tuner li');
    var tuneTo = function (i) {
      var badge = steps[i] && steps[i].querySelector('.tuner-freq');
      if (!badge) return;
      var b = band.getBoundingClientRect(), r = badge.getBoundingClientRect();
      var oneRow = steps[0].getBoundingClientRect().top === steps[steps.length - 1].getBoundingClientRect().top;
      // One row: sit right above the step number. Stacked on phones: spread the five steps across the band.
      var x = oneRow ? r.left + r.width / 2 - b.left : b.width * (i + 0.5) / steps.length;
      band.style.setProperty('--tb', x + 'px');
      steps.forEach(function (li, k) { li.classList.toggle('is-tuned', k === i); });
    };
    steps.forEach(function (li, j) { li.classList.toggle('is-tuned', j === i); });
    };
    steps.forEach(function (li, i) {
      li.addEventListener('mouseenter', function () { tuneTo(i); });
      li.addEventListener('click', function () { tuneTo(i); });
    });
    // Sweep to the first station once the band is on screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) { tuneTo(0); obs.disconnect(); }
      }, { threshold: 0.8 }).observe(band);
    } else { tuneTo(0); }
    window.addEventListener('resize', function () {
      var on = document.querySelector('.tuner li.is-tuned');
      if (on) tuneTo([].indexOf.call(steps, on));
    });
  }

  // ---- Meter needles swing up once the gauges are mostly on screen ----
  // A high threshold so on phones (stacked layout) it happens while you're looking at them.
  var meters = document.querySelector('.meters');
  if (meters) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      meters.classList.add('is-on');
    } else {
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { meters.classList.add('is-on'); obs.disconnect(); }
        });
      }, { threshold: 0.6 }).observe(meters);
    }
  }

  // ---- Scroll-in reveal: blocks fade up once as they come into view ----
  // Only blocks that start below the fold are hidden, so nothing on screen ever flickers.
  // Skipped with reduced motion and data saver.
  if (reduceMotion || saveData) return;
  var SELECTORS = '.section .eyebrow, .section h2, .section-lede, .channel, .site-check, .hood, ' +
    '.compare-wrap, .legal-box, .ask-box, .how-copy, .meters, .pull-quote, .case, .sub-title, .mini-case, ' +
    '.tuner li, .quote, .about-photo, .about-copy, .contact-copy, .contact-form';
  var pending = [].slice.call(document.querySelectorAll(SELECTORS)).filter(function (el) {
    return el.getBoundingClientRect().top > window.innerHeight;
  });
  if (!pending.length) return;
  pending.forEach(function (el) { el.classList.add('rv'); });
  document.documentElement.classList.add('reveal-on');

  function done(el) { el.classList.remove('rv', 'rv-in'); el.style.removeProperty('--rv-delay'); }
  function reveal(el, order) {
    var i = pending.indexOf(el);
    if (i < 0) return;
    pending.splice(i, 1);
    el.style.setProperty('--rv-delay', Math.min(order * 0.08, 0.32) + 's');   // a row arrives one after another
    el.classList.add('rv-in');
    el.addEventListener('transitionend', function end(ev) {
      if (ev.propertyName !== 'opacity') return;
      el.removeEventListener('transitionend', end);
      done(el);
    });
    setTimeout(function () { if (el.classList.contains('rv-in')) done(el); }, 1400);   // safety net
  }

  // Two triggers call the same reveal, so a block can never stay hidden if one misfires
  function check() {
    var limit = window.innerHeight * 0.94, n = 0;
    pending.slice().forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < limit && r.bottom > 0) reveal(el, n++);
    });
    if (!pending.length) {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    }
  }
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.unobserve(e.target); reveal(e.target, n++); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    pending.forEach(function (el) { io.observe(el); });
  }
})();
