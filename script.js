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
    var LOOP = 46800, GLITCHES = [0.1609 * LOOP, 0.2769 * LOOP, 0.3885 * LOOP, 0.9253 * LOOP];   // matches the tv-glitch keyframes
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

  // ---- Mailbox flag swings up a second after the mailbox is well on screen ----
  var mailbox = document.querySelector('.mailbox');
  if (mailbox) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      mailbox.classList.add('is-up');
    } else {
      new IntersectionObserver(function (entries, obs) {
        // wait until the whole mailbox is up out of the bottom quarter of the screen, then a beat, so it's seen
        if (entries[0].isIntersecting) { obs.disconnect(); setTimeout(function () { mailbox.classList.add('is-up'); }, 1000); }
      }, { threshold: 1, rootMargin: '0px 0px -25% 0px' }).observe(mailbox);
    }
  }

  // ---- Record player: the tonearm drops onto the record a second after it's well on screen (hover still works) ----
  var turntable = document.querySelector('.turntable');
  if (turntable && !reduceMotion && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) { obs.disconnect(); setTimeout(function () { turntable.classList.add('is-playing'); }, 1000); }
    }, { threshold: 1, rootMargin: '0px 0px -25% 0px' }).observe(turntable);
  }

  // ---- Under the hood: the hood swings open each time the car comes on screen ----
  // A soft-edged wedge pivots at the hood hinge (40% across, 41% down the picture) and sweeps up the hood's arc
  // while the open picture fades in and the rest of the car crossfades at the same time. Once the car is fully
  // off screen the hood quietly shuts again, so it swings open again the next time it scrolls into view.
  var hood = document.querySelector('.hood-swap');
  if (hood && !reduceMotion && 'IntersectionObserver' in window) {
    hood.classList.add('is-armed');                                     // without this (or with reduced motion) the hood shows open
    var openImg = hood.querySelector('.hood-open'), shutImg = hood.querySelector('.hood-shut');
    var HX = 40, HY = 41, SWING = 1200, wait = 0, raf = 0, state = 'shut';
    var smooth = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    var mask = function (m) { openImg.style.webkitMaskImage = m; openImg.style.maskImage = m; };
    var shut = function () {                                            // back to closed, off screen so nobody sees it
      clearTimeout(wait); cancelAnimationFrame(raf);
      mask(''); openImg.style.opacity = ''; shutImg.style.opacity = '';
      hood.classList.remove('is-open', 'is-done'); state = 'shut';
    };
    var swing = function () {
      var t0 = performance.now();
      hood.classList.add('is-open'); state = 'swinging';
      (function frame(now) {
        var k = Math.min(1, (now - t0) / SWING), ease = 1 - Math.pow(1 - k, 3);
        var from = 240, to = 258 + 64 * ease;                           // conic angles (0deg points up): fender line to past the hood tip
        var rest = 'rgba(0,0,0,' + smooth(k).toFixed(3) + ')';            // the rest of the car changes in step with the hood
        openImg.style.opacity = Math.min(1, 0.25 + k * 1.2).toFixed(2);
        // the two drawings' outlines sit a pixel apart, so while both show the black lines look heavier;
        // ease the shut picture out over the second half so the outline thins gradually
        shutImg.style.opacity = (1 - smooth((k - 0.45) / 0.55)).toFixed(3);
        mask('conic-gradient(from 0deg at ' + HX + '% ' + HY + '%, ' + rest + ' 0deg ' + (from - 8) + 'deg, #000 ' + from + 'deg ' + (to - 10) + 'deg, ' + rest + ' ' + (to + 4) + 'deg 360deg)');
        if (k < 1) raf = requestAnimationFrame(frame);
        else { mask(''); openImg.style.opacity = ''; shutImg.style.opacity = ''; hood.classList.add('is-done'); state = 'open'; }
      })(t0);
    };
    new IntersectionObserver(function (entries) {
      var e = entries[entries.length - 1];
      if (!e.isIntersecting) { if (state !== 'shut') shut(); return; }    // fully off screen: shut it for next time
      if (e.intersectionRatio >= 0.5 && state === 'shut') {             // half the car on screen, then a short beat
        state = 'waiting';
        openImg.loading = 'eager';                                      // it's hidden while shut, so lazy loading might never fetch it
        wait = setTimeout(function () {                                 // wait for the open-hood picture so the swing never shows a gap
          (openImg.decode ? openImg.decode() : Promise.resolve()).then(function () { if (state === 'waiting') swing(); }, function () { if (state === 'waiting') swing(); });
        }, 1200);
      }
    }, { threshold: [0, 0.5] }).observe(hood);
  }

  // ---- The marker underline under "It's a legal issue." draws itself once it's on screen ----
  // (watches the words themselves, since phones hide the wide stroke and draw one under each line instead)
  var markerLine = document.querySelector('.marker-wipe');
  var markerWords = markerLine && markerLine.parentNode;
  var drawMarker = function () { markerLine.classList.add('is-drawn'); markerWords.classList.add('is-drawn'); };
  if (markerLine && !reduceMotion) {
    if (!('IntersectionObserver' in window)) { drawMarker(); }
    else {
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) { drawMarker(); obs.disconnect(); }
      }, { threshold: 0.5, rootMargin: '0px 0px -15% 0px' }).observe(markerWords);
    }
  }

  // ---- Phones: the "haunt you" ghost floats out once the tagline is actually on screen ----
  var haunt = document.querySelector('.hero-haunt');
  if (haunt && !reduceMotion && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) { haunt.classList.add('haunt-seen'); obs.disconnect(); }
    }, { threshold: 0.6 }).observe(haunt);
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

// ---- Room lights, timed to the TV: on its second peek (as the TV first changes channel) the ghost tugs the lamp's pull chain and the room
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
  var TV = 46800, OFF_PEAK = 18030, ON_PEAK = 44030;  // TV loop; peeks just as the PSA comes on, and at the star's flash
  var FIRST_PEAK = 7630;                             // first lights-on: the second peek, as the TV changes to its first channel
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
    var w = first ? untilTv(FIRST_PEAK, 1200) : untilTv(ON_PEAK, 1200);
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

/* The Finish Line : the road is drawn on the same ground plane as the car art.
   Measured on the (mirrored) car: rear tire -> front tire runs F, front tire -> far front tire runs A.
   Every road point is O + s*F + t*A (s = along the road in car lengths, t = across it in car widths). */
(function () {
  var root = document.querySelector('.finish');
  if (!root) return;
  var strip = root.querySelector('.strip'), shop = root.querySelector('.paint-shop'), again = root.querySelector('.paint-race');
  var NS = 'http://www.w3.org/2000/svg';
  var K = 0.7;                                       // overall size of the scene's pieces
  var CW = 300 * K, CH = CW * 499 / 900;
  var F = [160 * K, 36.3 * K], A = [95.7 * K, -31.3 * K], O = [0, 300];
  var REAR = [CW * 70 / 900, CH * 385 / 499];        // rear tire contact inside the mirrored image
  var P = function (s, t) { return [O[0] + s * F[0] + t * A[0], O[1] + s * F[1] + t * A[1]]; };
  var pt = function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); };
  var quad = function (s0, s1, t0, t1) { return 'M' + pt(P(s0, t0)) + 'L' + pt(P(s1, t0)) + 'L' + pt(P(s1, t1)) + 'L' + pt(P(s0, t1)) + 'Z'; };

  var NARROW = strip.clientWidth < 600;               // phones: a shorter strip so everything draws about a third bigger
  var ROAD = 2.9, LANE_T = 0.22, START = 1.0, FIN = NARROW ? 4.7 : 5.25 / K, S0 = -0.05, VW = NARROW ? 820 : 1200;
  var svg = '';
  svg += '<defs><radialGradient id="puffg"><stop offset="0" stop-color="#fbf7ef"/><stop offset=".6" stop-color="#ddd6ca" stop-opacity=".9"/><stop offset="1" stop-color="#ddd6ca" stop-opacity="0"/></radialGradient></defs>';
  // shoulders, road, edge lines
  svg += '<path d="' + quad(-4, 16, -0.45, ROAD + 0.45) + '" fill="#3a342e"/>';
  svg += '<path d="' + quad(-4, 16, 0, ROAD) + '" fill="#5d5650"/>';
  svg += '<path d="' + quad(-4, 16, 0, 0.05) + '" fill="#f4ebd9"/><path d="' + quad(-4, 16, ROAD - 0.05, ROAD) + '" fill="#f4ebd9"/>';
  for (var s = -4; s < 16; s += 0.7) svg += '<path d="' + quad(s, s + 0.36, 1.43, 1.5) + '" fill="#e8c547"/>';   // lane dashes
  svg += '<path d="' + quad(START, START + 0.05, 0, ROAD) + '" fill="#f4ebd9"/>';                            // start line
  // checkered finish line across the road
  var rows = 2, cols = 14, ds = 0.09, dt = ROAD / cols;
  for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++)
    svg += '<path d="' + quad(FIN + r * ds, FIN + (r + 1) * ds, c * dt, (c + 1) * dt) + '" fill="' + ((r + c) % 2 ? '#221f1b' : '#fff8ec') + '"/>';

  // christmas tree, modeled on real trees: padded base, post, black light housing, cap on top.
  // It stands on the center line just past the start and faces the drivers (back up the road),
  // so from here we see its back and near side, the light hoods poking toward the cars, and the glow.
  // Built in feet: x across the road (+ = far side), y along it (+ = toward the finish), z up.
  var tb = P(START + 0.25, 1.465);
  var WX = 1.5;                                                     // widen it a little so it reads at this size
  var ax = [A[0] / 6 * WX, A[1] / 6 * WX], fy = [F[0] / 13 * WX, F[1] / 13 * WX], upz = 22 * K;
  var q = function (x, y, z) { return [tb[0] + x * ax[0] + y * fy[0], tb[1] + x * ax[1] + y * fy[1] - z * upz]; };
  var poly = function (ps) { return 'M' + ps.map(pt).join('L') + 'Z'; };
  var face = function (ps, fill, extra) { return '<path d="' + poly(ps) + '" fill="' + fill + '" stroke="#6b645c" stroke-width=".9" stroke-linejoin="round"' + (extra || '') + '/>'; };
  // visible faces of a box from this camera: back (+y), near side (-x), top
  var box = function (x0, x1, y0, y1, z0, z1, back, side, top) {
    return face([q(x0, y0, z0), q(x0, y1, z0), q(x0, y1, z1), q(x0, y0, z1)], side) +
      face([q(x0, y1, z0), q(x1, y1, z0), q(x1, y1, z1), q(x0, y1, z1)], back) +
      face([q(x0, y0, z1), q(x1, y0, z1), q(x1, y1, z1), q(x0, y1, z1)], top);
  };
  var ring = function (x, y, z, r) {                              // a circle standing across the road
    var ps = []; for (var i = 0; i < 18; i++) { var th = i / 18 * Math.PI * 2; ps.push(q(x + Math.cos(th) * r, y, z + Math.sin(th) * r)); }
    return poly(ps);
  };
  var tree = '';
  tree += box(-0.45, 0.45, 0, 0.9, 0, 1.4, '#e8c547', '#c9a53a', '#f4cf5c');                       // padded base
  tree += '<path d="' + poly([q(-0.45, 0.1, 0.25), q(-0.45, 0.45, 1.15), q(-0.45, 0.7, 1.15), q(-0.45, 0.35, 0.25)]) + '" fill="#221f1b"/>';   // chevron
  tree += box(-0.12, 0.12, 0.33, 0.57, 1.4, 4.4, '#34589a', '#26406f', '#34589a');                   // post
  // lights: two columns (one per lane); pre-stage + stage small up top, then 3 amber, green, red
  var LZ = [[7.62, 's', 0.12], [7.38, 's', 0.12], [7.0, 0, 0.21], [6.5, 1, 0.21], [6.0, 2, 0.21], [5.5, 3, 0.21], [5.0, 4, 0.21]];
  var tint = { s: 'stage', 0: 'amber', 1: 'amber', 2: 'amber', 3: 'green', 4: 'red' };
  // each light is its own black pod with a hood pointing at the drivers; pods sit either side of a narrow spine
  var pods = function (xc, glowOnly) {
    var out = '';
    LZ.forEach(function (L) {
      var z = L[0], r = L[2], cls = 'lt-' + L[1] + ' ' + tint[L[1]];
      if (glowOnly) {
        var g = q(xc, -0.5, z);
        out += '<circle class="glow ' + cls + '" cx="' + g[0].toFixed(1) + '" cy="' + g[1].toFixed(1) + '" r="' + (r * 120 * K).toFixed(1) + '" fill="url(#glow-' + tint[L[1]] + ')"/>';
        return;
      }
      out += face([q(xc - r, 0.0, z + r), q(xc - r, -0.42, z + r), q(xc - r, -0.42, z - r), q(xc - r, 0.0, z - r)], '#2e2a26') +    // hood side
        face([q(xc - r, 0.0, z + r), q(xc + r, 0.0, z + r), q(xc + r, -0.42, z + r), q(xc - r, -0.42, z + r)], '#4a443d') +       // hood top
        '<path class="rim ' + cls + '" d="' + ring(xc, -0.42, z, r) + '"/>' +
        box(xc - r - 0.03, xc + r + 0.03, 0.0, 0.42, z - r - 0.03, z + r + 0.03, '#1a1716', '#2e2a26', '#3a342e');               // pod
    });
    return out;
  };
  tree += pods(0.5, true) + pods(-0.5, true);                     // glow first, so the pods sit on top of it
  tree += pods(0.5, false);                                       // far lane column
  tree += box(-0.16, 0.16, 0.0, 0.42, 4.4, 7.95, '#34589a', '#26406f', '#4f74b8');                   // spine
  tree += pods(-0.5, false);                                      // near lane column
  tree += box(-0.85, 0.85, -0.25, 0.6, 7.95, 8.2, '#221f1b', '#221f1b', '#4a443d');                  // cap
  var glowDef = function (id, c) { return '<radialGradient id="glow-' + id + '"><stop offset="0" stop-color="' + c + '" stop-opacity=".95"/><stop offset=".35" stop-color="' + c + '" stop-opacity=".55"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient>'; };
  svg = svg.replace('</defs>', glowDef('amber', '#ffb23a') + glowDef('green', '#6fe36a') + glowDef('red', '#ff4a3a') + glowDef('stage', '#fff4c8') + '</defs>');
  var treeSvg = '<g class="tree">' + tree + '</g>';
  var treeTop = q(0, 0.6, 8.2)[1];

  // banner gantry: far pole behind the car, near pole and banner in front
  var POLE = 262 * K, BAN = 58 * K;
  var nb = P(FIN + 0.09, -0.25), fb = P(FIN + 0.09, ROAD + 0.25);
  var pole = function (b) { return '<rect x="' + (b[0] - 5).toFixed(1) + '" y="' + (b[1] - POLE).toFixed(1) + '" width="10" height="' + POLE + '" fill="#f4ebd9" stroke="#221f1b" stroke-width="2.5"/>'; };

  svg += '<g class="far-pole">' + pole(fb) + '</g>';
  svg += treeSvg;
  svg += '<g class="smoke"></g>';
  svg += '<g class="car"><g class="car-tilt"><g transform="scale(-1,1)"><image href="images/ratrod-classic.webp?v=1" x="' + (-(CW - REAR[0])).toFixed(1) + '" y="' + (-REAR[1]).toFixed(1) + '" width="' + CW + '" height="' + CH.toFixed(1) + '"/></g></g></g>';
  var slope = (fb[1] - nb[1]) / (fb[0] - nb[0]);
  var ban = 'M' + pt([nb[0], nb[1] - POLE]) + 'L' + pt([fb[0], fb[1] - POLE]) + 'L' + pt([fb[0], fb[1] - POLE + BAN]) + 'L' + pt([nb[0], nb[1] - POLE + BAN]) + 'Z';
  var len = fb[0] - nb[0];
  svg += '<g class="banner">' + pole(nb) +
    '<path d="' + ban + '" fill="#fff8ec" stroke="#221f1b" stroke-width="3" stroke-linejoin="round"/>' +
    '<text transform="matrix(1 ' + slope.toFixed(4) + ' 0 1 ' + nb[0].toFixed(1) + ' 0)" x="' + (len / 2).toFixed(1) + '" y="' + (nb[1] - POLE + BAN / 2 + 13 * K).toFixed(1) + '" text-anchor="middle" font-family="Shrikhand, Georgia, serif" font-size="' + (36 * K) + '" fill="#a63a24" letter-spacing="1">FINISH LINE</text></g>';
  // checkered flags on top of the two banner poles; they rise and wave once the car crosses
  var cloth = ''; for (var fr = 0; fr < 4; fr++) for (var fc = 0; fc < 6; fc++) cloth += '<rect x="' + (6 + fc * 8) + '" y="' + (2 + fr * 8) + '" width="8" height="8" fill="' + ((fr + fc) % 2 ? '#221f1b' : '#fff8ec') + '"/>';
  var flag = '<rect x="2" y="0" width="4" height="56" rx="2" fill="#fff8ec" stroke="#221f1b" stroke-width="1.5"/><g class="cloth">' + cloth + '<rect x="6" y="2" width="48" height="32" fill="none" stroke="#221f1b" stroke-width="2"/></g>';
  var FS = 1.5 * K;
  var onPole = function (b, cls, flip) {
    return '<g class="flag ' + cls + '"><g transform="translate(' + (b[0] + (flip ? 4 : -4) * FS).toFixed(1) + ',' + (b[1] - POLE - 52 * FS).toFixed(1) + ') scale(' + (flip ? -FS : FS) + ',' + FS + ')">' + flag + '</g></g>';
  };
  svg += onPole(nb, 'flag-a', true) + onPole(fb, 'flag-b', false);
  var top = Math.min(treeTop - 6, fb[1] - POLE - 56 * FS, P(S0, LANE_T)[1] - REAR[1]) - 10, bottom = P(FIN + 0.18, 0)[1] + 22;   // top includes the flag tips on the poles
  strip.innerHTML = '<svg class="race" viewBox="0 ' + top.toFixed(0) + ' ' + VW + ' ' + (bottom - top).toFixed(0) + '" aria-hidden="true" focusable="false">' + svg + '</svg>';
  var el = strip.querySelector('svg'), car = el.querySelector('.car'), tilt = el.querySelector('.car-tilt'), smoke = el.querySelector('.smoke');
  var lights = [0, 1, 2, 3, 4].map(function (i) { return el.querySelectorAll('.lt-' + i); });
  var light = function (i) { [].forEach.call(lights[i], function (l) { l.classList.add('on'); }); };

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var paused = function () { return document.documentElement.classList.contains('motion-paused'); };
  var timers = [], raf = 0, puffs = [];
  var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
  var place = function (s, ang, bob) {
    var p = P(s, LANE_T);
    car.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ',' + (p[1] + (bob || 0)).toFixed(1) + ')');
    tilt.setAttribute('transform', 'rotate(' + (ang || 0).toFixed(2) + ')');
  };
  var reset = function () {
    timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf);
    smoke.innerHTML = ''; puffs = [];
    [].forEach.call(el.querySelectorAll('[class*="lt-"]'), function (l) { l.classList.remove('on'); });
    root.classList.remove('is-done', 'is-parked');
    place(S0, 0);
  };
  var park = function () {
    reset(); place(FIN + 0.75, 0);
    light(3);
    root.classList.add('is-parked', 'is-done');
    showShop();
  };

  var addPuff = function (s, born) {
    var c = document.createElementNS(NS, 'circle'); c.setAttribute('fill', 'url(#puffg)'); smoke.appendChild(c);
    puffs.push({ el: c, s: s, born: born, life: 1500 + Math.random() * 700, dx: Math.random() * 0.5, up: (30 + Math.random() * 50) * K, r: (18 + Math.random() * 14) * K });
  };
  var drawPuffs = function (now) {
    puffs = puffs.filter(function (p) {
      var k = (now - p.born) / p.life;
      if (k >= 1) { p.el.remove(); return false; }
      var at = P(p.s - p.dx * k - 0.05, LANE_T + 0.15);
      p.el.setAttribute('cx', at[0].toFixed(1)); p.el.setAttribute('cy', (at[1] - 12 * K - p.up * k).toFixed(1));
      p.el.setAttribute('r', (p.r * (0.6 + 2.2 * k)).toFixed(1));
      p.el.setAttribute('opacity', (k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88).toFixed(2));
      return true;
    });
  };

  var race = function () {
    reset();
    later(function () { [].forEach.call(el.querySelectorAll('.lt-s'), function (l) { l.classList.add('on'); }); }, 150);
    [0, 1, 2].forEach(function (i) { later(function () { light(i); }, 500 + i * 500); });
    later(function () { light(3); }, 2000);
    var t0 = performance.now(), GO = 2100, DUR = 2600, END = 9.5 / K, lastPuff = 0, crossed = false;
    var RUMBLE = 1.5 * VW / Math.max(1, strip.clientWidth);           // idle shake of about 1.5 screen pixels at any size
    (function frame(now) {
      var e = now - t0;
      if (e < GO) { place(S0, 0, e > 200 ? Math.sin(e / 18) * RUMBLE : 0); }           // idle rumble at the line
      else {
        var k = Math.min(1, (e - GO) / DUR), d = e - GO;
        var s = S0 + (END - S0) * Math.pow(k, 2.1);
        var ang = d < 260 ? -7 * d / 260 : d < 1400 ? -7 * (1 - (d - 260) / 1140) : 0;   // front lifts, then settles
        place(s, ang);
        if (d < 1000 && now - lastPuff > 40) { addPuff(s, now); lastPuff = now; }
        if (!crossed && s + 1 >= FIN) {
          crossed = true; root.classList.add('is-done');
          later(showShop, 900);
        }
      }
      drawPuffs(now);
      if (e < GO + DUR || puffs.length) raf = requestAnimationFrame(frame);
    })(t0);
  };

  // paint shop: cycle the paint jobs (same car, same crop, so the road geometry fits every one)
  var PAINTS = [['classic', 'Flames and Pinstripes V1'], ['long-flames', 'Long Flames'], ['pinstripe', 'Pinstripes'],
    ['scrollwork', 'Scrollwork Pinstripes'], ['flames-pinstripe', 'Flames and Pinstripes V2']];
  var paintSrc = function (i) { return 'images/ratrod-' + PAINTS[i][0] + '.webp?v=1'; };
  var carImg = el.querySelector('.car image'), thumb = shop.querySelector('.paint-thumb');
  var label = shop.querySelector('.paint-label'), count = shop.querySelector('.paint-count');
  var pick = 0;
  var showPaint = function () {
    thumb.src = paintSrc(pick);
    label.textContent = PAINTS[pick][1]; count.textContent = (pick + 1) + ' of ' + PAINTS.length;
    if (root.classList.contains('is-parked')) carImg.setAttribute('href', paintSrc(pick));   // parked car (no motion) shows it right away
  };
  var showShop = function () {
    if (!shop.classList.contains('is-ready')) {
      PAINTS.forEach(function (p, i) { if (i) { var im = new Image(); im.src = paintSrc(i); } });   // warm up the other paint jobs
      showPaint();
    }
    shop.classList.add('is-ready');
    fitShop();
  };
  // keep the card in the corner under the road: lower the section only as far as needed to clear the road's shoulder
  var fitShop = function () {
    if (!shop.classList.contains('is-ready')) return;
    strip.style.marginBottom = '';
    var svgBox = el.getBoundingClientRect(), vb = el.viewBox.baseVal, sc = svgBox.width / vb.width;
    var cardRight = (shop.getBoundingClientRect().right - svgBox.left) / sc;              // in scene units
    var s = (cardRight - O[0] + 0.45 * A[0]) / F[0], edge = P(s, -0.45)[1];               // bottom of the near shoulder at that x
    var roadPx = svgBox.top + (edge - vb.y) * sc;
    var base = parseFloat(getComputedStyle(strip).marginBottom) || 0;
    var cardTop = svgBox.bottom + base - shop.offsetHeight - parseFloat(getComputedStyle(shop).bottom);
    var short = roadPx + 10 - cardTop;                                                     // how far it would overlap
    if (short > 0) strip.style.marginBottom = (base + short) + 'px';
  };
  var fitT = 0;
  window.addEventListener('resize', function () { clearTimeout(fitT); fitT = setTimeout(fitShop, 150); });
  var step = function (d) { pick = (pick + d + PAINTS.length) % PAINTS.length; showPaint(); };
  shop.querySelector('.paint-prev').addEventListener('click', function () { step(-1); });
  shop.querySelector('.paint-next').addEventListener('click', function () { step(1); });
  again.addEventListener('click', function () {
    carImg.setAttribute('href', paintSrc(pick));
    var go = function () { race(); };
    var im = new Image(); im.onload = im.onerror = go; im.src = paintSrc(pick);    // swap paint once it's loaded, then race
  });
  place(S0, 0);
  if (reduce || paused()) { park(); return; }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); race(); } }, { threshold: 0.6 });
    io.observe(strip);
  } else { park(); }
  document.addEventListener('motionchange', function (e) { if (e.detail.paused) park(); });
})();

// ---- Agency builds: "Liner notes" slide up out of each album sleeve; Back in the sleeve or Escape puts them away ----
(function () {
  document.querySelectorAll('.liner-btn').forEach(function (btn) {
    var liner = document.getElementById(btn.getAttribute('aria-controls'));
    var close = liner.querySelector('.liner-close');
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var card = btn.closest('.mini-case');
    var open = function () {
      liner.hidden = false; btn.setAttribute('aria-expanded', 'true');
      card.style.minHeight = '';                                        // grow the card when the notes are taller than it
      if (liner.scrollHeight > liner.clientHeight) card.style.minHeight = (liner.scrollHeight + card.offsetHeight - liner.clientHeight + 4) + 'px';
      requestAnimationFrame(function () { requestAnimationFrame(function () { liner.classList.add('is-out'); }); });
      liner.querySelector('.liner-title').focus({ preventScroll: true });
    };
    var shut = function () {
      liner.classList.remove('is-out'); btn.setAttribute('aria-expanded', 'false'); btn.focus({ preventScroll: true });
      setTimeout(function () { if (!liner.classList.contains('is-out')) { liner.hidden = true; card.style.minHeight = ''; } }, reduce ? 0 : 500);
    };
    btn.addEventListener('click', function () { liner.hidden ? open() : shut(); });
    close.addEventListener('click', shut);
    liner.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
  });
})();
