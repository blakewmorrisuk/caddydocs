/* Caddy · caddydocs.com
   Two jobs and nothing else: keep the frozen composition breathing, and fade a
   section in the first time it is seen. No dependencies.

   The drift is the app's own No Gravity behaviour, scaled for a page. In Caddy a
   floating tab feels a 6 pt/s² nudge whose direction turns every 9 s, damped with a
   14 s time constant, and it crosses a 1920-wide display in about a minute
   (Sources/Windows/ZeroGravityMath.swift). At that speed on a web page the
   composition would fall apart inside a minute, so the same wander is expressed as
   two slow out-of-phase sines with a few pixels of amplitude: the character of the
   motion, at about a fortieth of the distance. Rotation is scaled the same way. */

(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── sections fade in once ───────────────────────────────────────────── */

  var revealables = document.querySelectorAll('.reveal');
  if (reduce.matches || !('IntersectionObserver' in window)) {
    for (var r = 0; r < revealables.length; r++) revealables[r].classList.add('in');
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    for (var i = 0; i < revealables.length; i++) io.observe(revealables[i]);
  }

  /* ── the weightless fields ───────────────────────────────────────────── */

  var fields = document.querySelectorAll('[data-field]');
  if (!fields.length) return;

  // amplitude in px, rotation in degrees, and how much of the pointer each band takes
  var BAND = {
    1: { ax: 13, ay: 10, ar: 3.2, par: 15 },
    2: { ax: 9,  ay: 7,  ar: 4.6, par: 8 },
    3: { ax: 5,  ay: 4,  ar: 6.4, par: 3.5 }
  };

  var pieces = [], expanded = [];
  fields.forEach(function (field) {
    field.querySelectorAll('.tab, .chip').forEach(function (el) {
      var band = el.classList.contains('tab--b1') || el.classList.contains('chip--b1') ? 1
               : el.classList.contains('tab--b2') || el.classList.contains('chip--b2') ? 2 : 3;
      var phase = parseFloat(getComputedStyle(el).getPropertyValue('--p')) || 0;
      pieces.push({
        el: el, b: BAND[band],
        // every piece keeps its own phase, the way the app gives each pill its own
        // drift period, so nothing in a field moves in lockstep
        p1: phase * 0.00062, p2: phase * 0.00113, p3: phase * 0.00087,
        dx: 0, dy: 0, dr: 0
      });
    });
    field.querySelectorAll('.expanded').forEach(function (el) { expanded.push(el); });
  });

  var px = 0, py = 0, tx = 0, ty = 0, seen = 0, running = false, raf = 0;

  function frame(now) {
    var t = now / 1000;
    px += (tx - px) * 0.045;
    py += (ty - py) * 0.045;

    for (var i = 0; i < pieces.length; i++) {
      var s = pieces[i], b = s.b;
      // two out-of-phase sines: a wander that never repeats to the eye and never runs away
      var dx = b.ax * (Math.sin(t * 0.052 + s.p1) * 0.68 + Math.sin(t * 0.083 + s.p2) * 0.32) + px * b.par;
      var dy = b.ay * (Math.sin(t * 0.061 + s.p2) * 0.66 + Math.sin(t * 0.037 + s.p3) * 0.34) + py * b.par;
      var dr = b.ar * Math.sin(t * 0.029 + s.p3);
      if (Math.abs(dx - s.dx) > 0.05 || Math.abs(dy - s.dy) > 0.05 || Math.abs(dr - s.dr) > 0.02) {
        s.dx = dx; s.dy = dy; s.dr = dr;
        s.el.style.setProperty('--dx', dx.toFixed(2) + 'px');
        s.el.style.setProperty('--dy', dy.toFixed(2) + 'px');
        s.el.style.setProperty('--dr', dr.toFixed(2));
      }
    }

    for (var j = 0; j < expanded.length; j++) {
      expanded[j].style.setProperty('--dx', (px * 2.4).toFixed(2) + 'px');
      expanded[j].style.setProperty('--dy', (py * 2.4).toFixed(2) + 'px');
    }

    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduce.matches || !seen || document.hidden) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  // nothing drifts while it is off screen, and nothing drifts in a hidden tab
  if ('IntersectionObserver' in window) {
    var fo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen += e.isIntersecting ? 1 : -1; });
      seen = Math.max(0, seen);
      seen ? start() : stop();
    }, { threshold: 0 });
    fields.forEach(function (f) { fo.observe(f); });
  } else {
    seen = 1; start();
  }
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  // a small, damped, capped response to the pointer, applied to the whole field
  // rather than to individual pieces, so the room moves and not the objects in it
  window.addEventListener('pointermove', function (e) {
    if (reduce.matches || e.pointerType !== 'mouse') return;
    tx = Math.max(-1, Math.min(1, e.clientX / window.innerWidth * 2 - 1));
    ty = Math.max(-1, Math.min(1, e.clientY / window.innerHeight * 2 - 1));
  }, { passive: true });

  reduce.addEventListener('change', function () {
    if (!reduce.matches) { start(); return; }
    stop();
    tx = ty = px = py = 0;
    pieces.forEach(function (s) {
      s.el.style.removeProperty('--dx');
      s.el.style.removeProperty('--dy');
      s.el.style.removeProperty('--dr');
    });
    expanded.forEach(function (el) {
      el.style.removeProperty('--dx');
      el.style.removeProperty('--dy');
    });
  });
})();
