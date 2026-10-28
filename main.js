'use strict';
/* Orbit Dust — UI / rendering layer. Physics lives in physics.js,
 * share-link codec lives in share.js. */
(function () {
  var P = window.OrbitPhysics;
  var S = window.OrbitShare;
  var canvas = document.getElementById('scene');
  var ctx = canvas.getContext('2d');

  var SOFTENING = 4;
  var BASE_G = 1;
  var DT = 0.35;          // simulation step
  var SUBSTEPS = 3;       // physics substeps per frame at full quality
  var MAX_BODIES = (S && S.MAX_BODIES) || 240;

  var state = {
    bodies: [],
    running: true,
    gScale: 1,
    trailLength: 90,
    speed: 1,
    merge: true,
    preset: 'solar',
    drag: null, // {x, y, cx, cy}
    launchedOnce: false,
    fromShare: false,
    shareAnchor: null, // centroid of shared scene's stars, for re-centring
    quality: 0 // 0 = full, 1 = shorter trails, 2 = fewer substeps
  };

  function centre() {
    return { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 };
  }

  // ---------- body-count cap ----------
  // O(n^2) gravity gets expensive fast; never let the sandbox wedge itself.
  // Over the cap we drop the oldest non-star bodies first.
  function trimToCap() {
    while (state.bodies.length > MAX_BODIES) {
      var idx = -1;
      for (var i = 0; i < state.bodies.length; i++) {
        if (!state.bodies[i].isStar) { idx = i; break; }
      }
      if (idx < 0) break; // nothing but stars left; leave them alone
      state.bodies.splice(idx, 1);
    }
  }
  function addBody(b) {
    state.bodies.push(b);
    trimToCap();
    return b;
  }

  // ---------- presets ----------
  function star(x, y, mass) {
    var b = P.createBody({ x: x, y: y, mass: mass, radius: 16, name: 'star', hue: 45 });
    b.isStar = true;
    return b;
  }
  function planetOrbiting(cx, cy, centralMass, r, angle, mass, dir) {
    var v = P.circularOrbitSpeed(BASE_G, centralMass, r) * (dir || 1);
    return P.createBody({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      vx: -Math.sin(angle) * v,
      vy: Math.cos(angle) * v,
      mass: mass || 2,
      radius: 3.5
    });
  }

  var presets = {
    solar: function () {
      var c = centre();
      var bodies = [star(c.x, c.y, 1200)];
      var radii = [90, 140, 195, 255, 320];
      radii.forEach(function (r, i) {
        bodies.push(planetOrbiting(c.x, c.y, 1200, r, i * 1.35, 1.5 + i * 0.6));
      });
      // a few dust particles on wider, slightly off-circular orbits
      for (var i = 0; i < 26; i++) {
        var r = 110 + Math.random() * 300;
        var a = Math.random() * Math.PI * 2;
        var d = planetOrbiting(c.x, c.y, 1200, r, a, 0.4);
        d.vx *= 0.92 + Math.random() * 0.14;
        d.vy *= 0.92 + Math.random() * 0.14;
        d.radius = 1.6;
        bodies.push(d);
      }
      return bodies;
    },
    binary: function () {
      var c = centre();
      var sep = 120, m = 800;
      var v = Math.sqrt(BASE_G * m / (2 * sep)) * 0.92; // approx. mutual orbit speed
      var a = star(c.x - sep, c.y, m); a.vy = -v; a.radius = 13;
      var b = star(c.x + sep, c.y, m); b.vy = v; b.radius = 13;
      var bodies = [a, b];
      for (var i = 0; i < 18; i++) {
        var r = 240 + Math.random() * 140;
        var ang = Math.random() * Math.PI * 2;
        bodies.push(planetOrbiting(c.x, c.y, 2 * m, r, ang, 0.5));
      }
      return bodies;
    },
    threebody: function () {
      var c = centre();
      // classic equal-mass figure-8 (stable-ish, visibly chaotic with dust)
      var s = 110, m = 500;
      var vx = 0.93240737, vy = 0.86473146, k = 0.55;
      var a = star(c.x + 0.97000436 * s, c.y - 0.24308753 * s, m);
      a.vx = vx * k; a.vy = vy * k; a.radius = 11;
      var b = star(c.x - 0.97000436 * s, c.y + 0.24308753 * s, m);
      b.vx = vx * k; b.vy = vy * k; b.radius = 11;
      var d = star(c.x, c.y, m);
      d.vx = -2 * vx * k; d.vy = -2 * vy * k; d.radius = 11;
      return [a, b, d];
    }
  };

  function loadPreset(name) {
    state.preset = name;
    state.fromShare = false;
    state.bodies = presets[name]();
    state.bodies.forEach(function (b) { b.trail = []; });
    trimToCap();
  }

  // ---------- shared scenes (URL hash) ----------
  function loadSharedScene() {
    if (!S) return false;
    var data = S.decodeHash(window.location.hash || '');
    if (!data) return false; // bad hash -> silently fall back to the preset
    state.bodies = data.map(function (d) {
      var b = P.createBody({
        x: d.x, y: d.y, vx: d.vx, vy: d.vy, mass: d.mass,
        radius: d.isStar ? 16 : (d.mass >= 1 ? 3.5 : 1.6),
        hue: d.isStar ? 45 : undefined,
        name: d.isStar ? 'star' : ''
      });
      b.isStar = !!d.isStar;
      b.trail = [];
      return b;
    });
    trimToCap();
    // remember where the shared scene's centre of interest was, so the
    // second layout pass can re-centre it on this screen
    var anchors = state.bodies.filter(function (b) { return b.isStar; });
    var pool = anchors.length ? anchors : state.bodies;
    var ax = 0, ay = 0;
    pool.forEach(function (b) { ax += b.x; ay += b.y; });
    state.shareAnchor = { x: ax / pool.length, y: ay / pool.length };
    state.fromShare = true;
    return true;
  }

  function recentreShared() {
    if (!state.fromShare || !state.shareAnchor) return;
    var c = centre();
    var dx = c.x - state.shareAnchor.x, dy = c.y - state.shareAnchor.y;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    state.bodies.forEach(function (b) { b.x += dx; b.y += dy; b.trail = []; });
    state.shareAnchor = { x: c.x, y: c.y };
  }

  // ---------- canvas sizing ----------
  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    var old = { w: canvas.width / dpr, h: canvas.height / dpr };
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // keep bodies roughly centred after a resize
    if (old.w && (old.w !== w || old.h !== h)) {
      var dx = (w - old.w) / 2, dy = (h - old.h) / 2;
      state.bodies.forEach(function (b) { b.x += dx; b.y += dy; b.trail = []; });
    }
  }
  window.addEventListener('resize', resize);

  // ---------- interaction: drag to launch ----------
  function pos(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  canvas.addEventListener('pointerdown', function (e) {
    var p = pos(e);
    state.drag = { x: p.x, y: p.y, cx: p.x, cy: p.y };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!state.drag) return;
    var p = pos(e);
    state.drag.cx = p.x; state.drag.cy = p.y;
  });
  canvas.addEventListener('pointerup', function (e) {
    if (!state.drag) return;
    var d = state.drag;
    state.drag = null;
    var vx = (d.cx - d.x) * 0.022;
    var vy = (d.cy - d.y) * 0.022;
    addBody(P.createBody({ x: d.x, y: d.y, vx: vx, vy: vy, mass: 3, radius: 3.5 }));
    if (!state.launchedOnce) {
      state.launchedOnce = true;
      var tip = document.getElementById('first-tip');
      if (tip) tip.classList.add('hide');
    }
  });
  canvas.addEventListener('pointercancel', function () { state.drag = null; });

  // ---------- controls ----------
  var $ = function (id) { return document.getElementById(id); };
  document.querySelectorAll('[data-preset]').forEach(function (btn) {
    btn.addEventListener('click', function () { loadPreset(btn.getAttribute('data-preset')); });
  });
  $('btn-pause').addEventListener('click', function () {
    state.running = !state.running;
    this.textContent = state.running ? '⏸ 暂停' : '▶ 继续';
    $('stat-state').textContent = state.running ? '运行中' : '已暂停';
  });
  $('btn-reset').addEventListener('click', function () {
    if (state.fromShare) { loadPreset('solar'); } else { loadPreset(state.preset); }
  });
  function heaviest() {
    return state.bodies.reduce(function (m, b) { return (!m || b.mass > m.mass) ? b : m; }, null);
  }
  $('btn-random').addEventListener('click', function () {
    var heavy = heaviest();
    if (!heavy) { loadPreset('solar'); return; }
    var r = 120 + Math.random() * 220;
    var a = Math.random() * Math.PI * 2;
    var v = P.circularOrbitSpeed(BASE_G * state.gScale, heavy.mass, r);
    addBody(P.createBody({
      x: heavy.x + Math.cos(a) * r, y: heavy.y + Math.sin(a) * r,
      vx: heavy.vx - Math.sin(a) * v, vy: heavy.vy + Math.cos(a) * v,
      mass: 2.5, radius: 3.5
    }));
  });
  $('btn-clear').addEventListener('click', function () {
    state.bodies = state.bodies.filter(function (b) { return b.isStar; });
  });
  $('btn-surprise').addEventListener('click', function () {
    var heavy = heaviest();
    if (!heavy) { loadPreset('solar'); heavy = heaviest(); }
    var c = centre();
    // one eccentric comet: well under circular speed plus an inward push,
    // so it dives toward the star and slingshots back out
    var ang = Math.random() * Math.PI * 2;
    var dist = Math.max(300, Math.min(canvas.clientWidth, canvas.clientHeight) * 0.46);
    var px = c.x + Math.cos(ang) * dist, py = c.y + Math.sin(ang) * dist;
    var rNow = Math.max(60, Math.hypot(px - heavy.x, py - heavy.y));
    var vc = P.circularOrbitSpeed(BASE_G * state.gScale, heavy.mass, rNow);
    var tx = -(py - heavy.y) / rNow, ty = (px - heavy.x) / rNow; // tangential
    var rx = (heavy.x - px) / rNow, ry = (heavy.y - py) / rNow;   // inward
    var comet = P.createBody({
      x: px, y: py,
      vx: heavy.vx + tx * vc * 0.55 + rx * vc * 0.35,
      vy: heavy.vy + ty * vc * 0.55 + ry * vc * 0.35,
      mass: 2, radius: 3.2, hue: 185 + Math.floor(Math.random() * 60)
    });
    addBody(comet);
    // plus a loose cluster of stardust on a shared near-circular orbit
    var da = Math.random() * Math.PI * 2;
    var dr = 190 + Math.random() * 110;
    var cxp = heavy.x + Math.cos(da) * dr, cyp = heavy.y + Math.sin(da) * dr;
    var vd = P.circularOrbitSpeed(BASE_G * state.gScale, heavy.mass, dr);
    for (var i = 0; i < 24; i++) {
      var ox = (Math.random() - 0.5) * 52, oy = (Math.random() - 0.5) * 52;
      var dust = P.createBody({
        x: cxp + ox, y: cyp + oy,
        vx: heavy.vx - Math.sin(da) * vd * (0.94 + Math.random() * 0.1) + (Math.random() - 0.5) * 0.14,
        vy: heavy.vy + Math.cos(da) * vd * (0.94 + Math.random() * 0.1) + (Math.random() - 0.5) * 0.14,
        mass: 0.3, radius: 1.4
      });
      addBody(dust);
    }
  });
  $('btn-share').addEventListener('click', function () {
    var btn = this;
    var url = window.location.href.split('#')[0] + '#s=' + S.encodeScene(state.bodies);
    try { window.history.replaceState(null, '', url); } catch (e) { /* file:// etc. */ }
    function done() {
      var old = btn.textContent;
      btn.textContent = '✓ 已复制，去分享吧';
      setTimeout(function () { btn.textContent = old; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { window.prompt('复制下面的链接，分享你的星尘场景：', url); });
    } else {
      window.prompt('复制下面的链接，分享你的星尘场景：', url);
    }
  });
  $('chk-merge').addEventListener('change', function () { state.merge = this.checked; });
  $('rng-g').addEventListener('input', function () {
    state.gScale = parseFloat(this.value);
    $('out-g').textContent = state.gScale.toFixed(2) + '×';
  });
  $('rng-trail').addEventListener('input', function () {
    state.trailLength = parseInt(this.value, 10);
    $('out-trail').textContent = this.value;
  });
  $('rng-speed').addEventListener('input', function () {
    state.speed = parseFloat(this.value);
    $('out-speed').textContent = state.speed.toFixed(2).replace(/0$/, '') + '×';
  });

  // ---------- adaptive quality ----------
  // Watch the (smoothed) frame time. Sustained < ~45fps steps quality down:
  // first shorter trails, then fewer physics substeps. Sustained > 55fps
  // steps it back up. The status bar says 流畅模式 whenever we degrade.
  var perf = { lastTs: 0, emaMs: 1000 / 60, frames: 0, goodStreak: 0, fps: 60 };
  function perfSample(ts) {
    if (perf.lastTs) {
      var dt = ts - perf.lastTs;
      if (dt > 0 && dt < 250) perf.emaMs = perf.emaMs * 0.92 + dt * 0.08; // ignore tab-switch gaps
    }
    perf.lastTs = ts;
    perf.fps = 1000 / Math.max(1, perf.emaMs);
    if (++perf.frames % 30 !== 0) return;
    if (perf.fps < 45 && state.quality < 2) {
      state.quality++;
      perf.goodStreak = 0;
      showQuality();
    } else if (perf.fps >= 55) {
      if (++perf.goodStreak >= 3 && state.quality > 0) {
        state.quality--;
        perf.goodStreak = 0;
        showQuality();
      }
    } else {
      perf.goodStreak = 0;
    }
  }
  function showQuality() {
    var el = $('stat-quality');
    if (!el) return;
    if (state.quality > 0) { el.hidden = false; el.textContent = '流畅模式'; }
    else { el.hidden = true; }
  }
  function effectiveTrail() {
    return state.quality >= 1 ? Math.min(state.trailLength, 30) : state.trailLength;
  }

  // ---------- simulation + rendering ----------
  function simulate() {
    var steps = state.quality >= 2
      ? Math.max(1, Math.round(1 * state.speed))
      : Math.max(1, Math.round(SUBSTEPS * state.speed));
    var trail = effectiveTrail();
    var opts = { G: BASE_G * state.gScale, softening: SOFTENING, merge: state.merge };
    for (var i = 0; i < steps; i++) P.step(state.bodies, DT, opts);
    state.bodies.forEach(function (b) {
      b.trail.push({ x: b.x, y: b.y });
      while (b.trail.length > trail) b.trail.shift();
    });
    // drop bodies that flew far away so the sandbox stays usable
    var c = centre();
    state.bodies = state.bodies.filter(function (b) {
      return b.isStar || Math.hypot(b.x - c.x, b.y - c.y) < 3000;
    });
  }

  function draw() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // faint starfield backdrop
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (var i = 0; i < 40; i++) {
      var sx = (i * 197.3) % w, sy = (i * 131.7) % h;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }

    var trail = effectiveTrail();
    state.bodies.forEach(function (b) {
      if (trail > 0 && b.trail.length > 1) {
        ctx.beginPath();
        b.trail.forEach(function (p, idx) {
          if (idx === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = b.isStar
          ? 'rgba(255,209,102,0.35)'
          : 'hsla(' + b.hue + ',85%,68%,0.38)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    });

    state.bodies.forEach(function (b) {
      if (b.isStar) {
        var grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 2.6);
        grad.addColorStop(0, 'rgba(255,236,170,0.95)');
        grad.addColorStop(0.35, 'rgba(255,209,102,0.75)');
        grad.addColorStop(1, 'rgba(255,170,60,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffe9a8';
      } else {
        ctx.fillStyle = 'hsl(' + b.hue + ',85%,68%)';
      }
      ctx.beginPath(); ctx.arc(b.x, b.y, Math.max(1.4, b.radius), 0, Math.PI * 2); ctx.fill();
    });

    if (state.drag) {
      var d = state.drag;
      ctx.strokeStyle = '#7dd3fc';
      ctx.fillStyle = '#7dd3fc';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.cx, d.cy); ctx.stroke();
      ctx.beginPath(); ctx.arc(d.x, d.y, 4, 0, Math.PI * 2); ctx.fill();
      var ang = Math.atan2(d.cy - d.y, d.cx - d.x);
      ctx.beginPath();
      ctx.moveTo(d.cx, d.cy);
      ctx.lineTo(d.cx - 10 * Math.cos(ang - 0.42), d.cy - 10 * Math.sin(ang - 0.42));
      ctx.lineTo(d.cx - 10 * Math.cos(ang + 0.42), d.cy - 10 * Math.sin(ang + 0.42));
      ctx.closePath(); ctx.fill();
      ctx.font = '12px sans-serif';
      ctx.fillText('v = ' + Math.hypot(d.cx - d.x, d.cy - d.y).toFixed(0) + ' px drag', d.cx + 10, d.cy - 8);
    }
  }

  var statTick = 0;
  function frame(ts) {
    perfSample(ts || 0);
    if (state.running) simulate();
    draw();
    if (++statTick % 20 === 0) {
      $('stat-bodies').textContent = state.bodies.length;
      $('stat-fps').textContent = Math.round(perf.fps);
      var e = P.totalEnergy(state.bodies, BASE_G * state.gScale, SOFTENING);
      $('stat-energy').textContent = state.bodies.length ? e.total.toFixed(0) : '—';
    }
    requestAnimationFrame(frame);
  }

  resize();
  if (!loadSharedScene()) loadPreset('solar');
  // canvas may have had zero size on first layout pass; fix positions once more
  requestAnimationFrame(function () {
    resize();
    if (state.fromShare) recentreShared(); else loadPreset(state.preset);
    frame();
  });
})();
