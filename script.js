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

  // ---- Pause / play all animations; remembered in this browser ----
  var motionBtn = document.querySelector('.motion-toggle');
  var isPaused = function () { return document.documentElement.classList.contains('motion-paused'); };
  var showMotionState = function () {
    if (!motionBtn) return;
    motionBtn.classList.toggle('is-paused', isPaused());   // both labels are in the button; CSS shows one
  };
  if (motionBtn) {
    showMotionState();
    motionBtn.addEventListener('click', function () {
      var paused = !isPaused();
      document.documentElement.classList.toggle('motion-paused', paused);
      try { localStorage.setItem('motion', paused ? 'paused' : 'on'); } catch (e) {}
      showMotionState();
      document.dispatchEvent(new CustomEvent('motionchange', { detail: { paused: paused } }));
    });
  }

  // ---- Keep section links out of the address bar ----
  // A menu link leaves "#about" in the address, so a refresh later would jump back to that
  // section instead of staying where you are. Clear it right after the jump.
  var clearHash = function () {
    if (location.hash && history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  };
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href^="#"]');
    if (link && link.getAttribute('href').length > 1) setTimeout(clearHash, 0);
  });
  // A shared link like /#contact still lands on its section; the hash is cleared after that
  window.addEventListener('load', function () { setTimeout(clearHash, 0); });

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
    var dialButtons = [].slice.call(dial.querySelectorAll('.dial-ch'));
    var tune = function (btn, fromUser, byKeyboard) {
      dial.style.setProperty('--angle', btn.getAttribute('data-angle') + 'deg');
      dialButtons.forEach(function (b) {
        b.setAttribute('aria-checked', String(b === btn));
        b.tabIndex = b === btn ? 0 : -1;   // one Tab stop: the dial lands on the current channel
      });
      document.querySelectorAll('.channel.is-tuned').forEach(function (c) { c.classList.remove('is-tuned'); });
      var card = document.getElementById(btn.getAttribute('aria-controls'));
      if (!card) return;
      if (!fromUser) return;
      // You picked it: its channel badge turns gold to match the dial; keyboard users also get an outline
      document.querySelectorAll('.channel.is-picked').forEach(function (c) { c.classList.remove('is-picked'); });
      card.classList.add('is-picked');
      if (byKeyboard) card.classList.add('is-tuned');
      if (byKeyboard) return;   // arrow keys keep you on the dial; the page doesn't jump
      var r = card.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        card.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    };

    // Channel surfing: while the dial is on screen it flips channels in time with the hero TV,
    // turning right as the TV glitches between the color bars and "Please stand by".
    // Pauses on hover or focus, stops for good once you pick a channel, and stops after a few turns.
    var surf = null, hops = 0, inView = false, held = false, surfDone = reduceMotion;
    var LOOP = 36400, GLITCHES = [0.2069 * LOOP, 0.3560 * LOOP, 0.4995 * LOOP, 0.9588 * LOOP];   // matches the tv-glitch keyframes
    var glitchAnim = function () {
      var g = document.querySelector('.tv-glitch');
      return g && g.getAnimations ? g.getAnimations()[0] : null;
    };
    var msToNextGlitch = function () {
      var anim = glitchAnim();
      if (!anim || anim.currentTime == null) return 7000;
      var t = anim.currentTime % LOOP;
      var next = GLITCHES.filter(function (g) { return g > t + 50; })[0];
      return (next === undefined ? GLITCHES[0] + LOOP : next) - t;
    };
    var stopSurf = function () { clearTimeout(surf); surf = null; };
    var startSurf = function () {
      if (surfDone || surf || !inView || held || motionHeld) return;
      surf = setTimeout(function () {
        surf = null;
        var current = dial.querySelector('[aria-checked="true"]');
        var others = dialButtons.filter(function (b) { return b !== current; });
        tune(others[Math.floor(Math.random() * others.length)], false);
        if (++hops >= 8) { surfDone = true; return; }
        startSurf();
      }, msToNextGlitch());
    };
    dialButtons.forEach(function (btn, i) {
      btn.addEventListener('click', function (e) { surfDone = true; stopSurf(); tune(btn, true, e.detail === 0); });
      // Radio-group keys: arrows turn the knob one channel at a time (wrapping), Home and End jump to the ends
      btn.addEventListener('keydown', function (e) {
        var n = dialButtons.length, next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + n) % n;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = n - 1;
        if (next === null) return;
        e.preventDefault();
        surfDone = true; stopSurf();
        tune(dialButtons[next], true, true);
        dialButtons[next].focus();
      });
    });
    ['mouseenter', 'focusin'].forEach(function (ev) { dial.addEventListener(ev, function () { held = true; stopSurf(); }); });
    var motionHeld = isPaused();
    document.addEventListener('motionchange', function (e) { motionHeld = e.detail.paused; if (motionHeld) { stopSurf(); } else { startSurf(); } });
    ['mouseleave', 'focusout'].forEach(function (ev) { dial.addEventListener(ev, function () { held = false; startSurf(); }); });
    if (!surfDone && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) { startSurf(); } else { stopSurf(); }
      }, { threshold: 0.5 }).observe(dial);
    }
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

  // ---- Mailbox flag swings up once the Fan Mail section comes into view ----
  var mailbox = document.querySelector('.mailbox');
  if (mailbox) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      mailbox.classList.add('is-up');
    } else {
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) { mailbox.classList.add('is-up'); obs.disconnect(); }
      }, { threshold: 0.8 }).observe(mailbox);
    }
  }

  // ---- Meter needles swing up once the gauges are mostly on screen ----
  // A high threshold so on phones (stacked layout) it happens while you're looking at them.
  var meters = document.querySelector('.meters');
  if (meters) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      meters.classList.add('is-on');
    } else {
      // Replays whenever the meters come back on screen; resets once they're fully out of view
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.intersectionRatio >= 0.6) meters.classList.add('is-on');
          else if (!e.isIntersecting) meters.classList.remove('is-on');
        });
      }, { threshold: [0, 0.6] }).observe(meters);
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

// ---- Room lights, timed to the TV: on its first peek the ghost tugs the lamp's pull chain and the room
// lights up. It dims the room just as the PSA comes on, and turns the lights back on right as the PSA's
// star blooms into its flash. The ghost peeks seven times per TV loop (5.2s each, see .ghost in the CSS),
// so its peeks land on those moments. Reduced motion: the room just stays lit. ----
(function () {
  'use strict';
  var root = document.documentElement;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var startLit = !root.classList.contains('room-intro');   // loaded paused: lit until Play
  var ghost = document.querySelector('.ghost');
  var anim = ghost && ghost.getAnimations ? ghost.getAnimations()[0] : null;
  if (!anim || anim.currentTime == null) { root.classList.remove('room-intro'); return; }
  var LOOP = 5200, PEAK = 2430;                    // ghost peek: fully out at 45% of 5.2s, after a 0.09s delay
  var TV = 36400, OFF_PEAK = 18030, ON_PEAK = 33630;  // TV loop; peeks just as the PSA comes on, and at the star's flash
  var tv = document.querySelector('.tv-bars');
  var tvAnim = tv && tv.getAnimations ? tv.getAnimations()[0] : null;
  var untilTv = function (at, lead) {                 // ms until the TV loop reaches `at`, at least `lead` ms away
    if (!tvAnim || tvAnim.currentTime == null) return untilPeak(lead);
    var w = at - (tvAnim.currentTime % TV);
    while (w < lead) w += TV;
    return w;
  };
  var untilPeak = function (lead) {                 // ms to the next peek at least `lead` ms away
    var w = PEAK - (anim.currentTime % LOOP);
    while (w < lead) w += LOOP;
    return w;
  };
  var lamp = document.querySelector('.floor-lamp');
  var hasLamp = function () { return lamp && getComputedStyle(lamp).display !== 'none'; };
  var chain = lamp && lamp.querySelector('.lamp-chain');
  var arm = document.querySelector('.ghost-arm');
  var paths = arm ? arm.querySelectorAll('path') : [], hand = arm && arm.querySelector('.arm-hand');
  var timers = [];
  var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
  var setDash = function (v) { [].forEach.call(paths, function (el) { el.style.strokeDashoffset = v; }); };

  var reach = function () {
    var bob = chain.querySelector('.chain-pull'), bb = bob.getBBox();       // aim for the pull, wherever it hangs
    var p = lamp.createSVGPoint(); p.x = bb.x + bb.width / 2; p.y = bb.y + bb.height * 0.6;
    var local = p.matrixTransform(bob.getScreenCTM()).matrixTransform(arm.getScreenCTM().inverse());
    var hx = local.x, hy = local.y + 7;
    // shoulder high on the side, so the arm is short
    var d = 'M340 162Q' + (hx + 12).toFixed(1) + ' ' + ((162 + hy) / 2).toFixed(1) + ' ' + hx.toFixed(1) + ' ' + hy.toFixed(1);
    [].forEach.call(paths, function (el) { el.setAttribute('d', d); el.style.transition = 'none'; });
    hand.setAttribute('cx', hx.toFixed(1)); hand.setAttribute('cy', hy.toFixed(1));
    var len = paths[0].getTotalLength();
    [].forEach.call(paths, function (el) { el.style.strokeDasharray = len; });
    setDash(len); hand.style.opacity = 0; arm.style.opacity = 1;
    paths[0].getBoundingClientRect();                                        // apply the start state, then animate
    [].forEach.call(paths, function (el) { el.style.transition = ''; });
    setDash(0);
    later(function () { hand.style.opacity = 1; }, 260);
    return len;
  };
  var tugThen = function (len, flip) {
    later(function () { chain.classList.add('is-tug'); arm.setAttribute('transform', 'translate(0 5)'); }, 420);
    later(function () {
      chain.classList.remove('is-tug'); arm.removeAttribute('transform');
      flip();
      hand.style.opacity = 0; setDash(len);
      later(function () { arm.style.opacity = 0; }, 300);
    }, 620);
  };

  var lightsOn = function () {
    root.classList.add('room-glow');
    root.classList.remove('room-intro');
    later(function () { root.classList.remove('room-glow'); }, 900);
  };
  var lightsOff = function () {
    root.classList.add('room-intro');                                        // lamp fades, rug rolls up; chain still hangs
    later(function () {                                                 // then the chain goes, bottom link first
      root.classList.add('chain-out'); root.classList.remove('chain-in');
      later(function () { root.classList.remove('chain-out'); }, 700);
    }, 700);
  };

  var turnOn = function (first) {
    var w = first ? untilPeak(1200) : untilTv(ON_PEAK, 1200);
    if (!hasLamp()) {                                                        // phones: the rug alone, on the peek
      later(function () { lightsOn(); scheduleOff(); }, w);
      return;
    }
    later(function () { root.classList.add('chain-in'); }, w - 900);         // chain comes in link by link
    later(function () { tugThen(reach(), function () { lightsOn(); scheduleOff(); }); }, w);
  };
  var scheduleOff = function () {
    var w = untilTv(OFF_PEAK, 1200);                                          // lights down for the PSA
    later(function () {
      if (!hasLamp()) { lightsOff(); turnOn(false); return; }
      tugThen(reach(), function () { lightsOff(); turnOn(false); });
    }, w);
  };
  // Pause: stop the cycle and leave the room lit. Play: carry on from lit.
  document.addEventListener('motionchange', function (e) {
    timers.forEach(clearTimeout); timers = [];
    if (e.detail.paused) {
      root.classList.remove('room-intro', 'chain-out', 'room-glow');
      root.classList.add('chain-in');
      if (chain) chain.classList.remove('is-tug');
      if (arm) { arm.style.opacity = 0; arm.removeAttribute('transform'); }
    } else {
      scheduleOff();
    }
  });
  if (!startLit) turnOn(true);
})();
