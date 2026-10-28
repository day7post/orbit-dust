'use strict';
/* Orbit Dust — UI / rendering layer. Physics lives in physics.js. */
(function () {
  var P = window.OrbitPhysics;
  var canvas = document.getElementById('scene');
  var ctx = canvas.getContext('2d');

  var SOFTENING = 4;
  var BASE_G = 1;
  var DT = 0.35;          // simulation step
  var SUBSTEPS = 3;       // physics substeps per frame

  var state = {
    bodies: [],
    running: true,
    gScale: 1,
    trailLength: 90,
    speed: 1,
    merge: true,
    preset: 'solar',
    drag: null // {x, y, cx, cy}
  };

  function centre() {
    return { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 };
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
    state.bodies = presets[name]();
    state.bodies.forEach(function (b) { b.trail = []; });
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
    var b = P.createBody({ x: d.x, y: d.y, vx: vx, vy: vy, mass: 3, radius: 3.5 });
    state.bodies.push(b);
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
  $('btn-reset').addEventListener('click', function () { loadPreset(state.preset); });
  $('btn-random').addEventListener('click', function () {
    var c = centre();
    var r = 120 + Math.random() * 220;
    var a = Math.random() * Math.PI * 2;
    // orbit around the most massive body, wherever it is
    var heavy = state.bodies.reduce(function (m, b) { return b.mass > m.mass ? b : m; }, state.bodies[0]);
    if (!heavy) { loadPreset('solar'); return; }
    var v = P.circularOrbitSpeed(BASE_G * state.gScale, heavy.mass, r);
    state.bodies.push(P.createBody({
      x: heavy.x + Math.cos(a) * r, y: heavy.y + Math.sin(a) * r,
      vx: heavy.vx - Math.sin(a) * v, vy: heavy.vy + Math.cos(a) * v,
      mass: 2.5, radius: 3.5
    }));
    void c;
  });
  $('btn-clear').addEventListener('click', function () {
    state.bodies = state.bodies.filter(function (b) { return b.isStar; });
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

  // ---------- simulation + rendering ----------
  function simulate() {
    var steps = Math.max(1, Math.round(SUBSTEPS * state.speed));
    var opts = { G: BASE_G * state.gScale, softening: SOFTENING, merge: state.merge };
    for (var i = 0; i < steps; i++) P.step(state.bodies, DT, opts);
    state.bodies.forEach(function (b) {
      b.trail.push({ x: b.x, y: b.y });
      while (b.trail.length > state.trailLength) b.trail.shift();
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

    state.bodies.forEach(function (b) {
      if (state.trailLength > 0 && b.trail.length > 1) {
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
  function frame() {
    if (state.running) simulate();
    draw();
    if (++statTick % 20 === 0) {
      $('stat-bodies').textContent = state.bodies.length;
      var e = P.totalEnergy(state.bodies, BASE_G * state.gScale, SOFTENING);
      $('stat-energy').textContent = state.bodies.length ? e.total.toFixed(0) : '—';
    }
    requestAnimationFrame(frame);
  }

  resize();
  loadPreset('solar');
  // canvas may have had zero size on first layout pass; re-centre once more
  requestAnimationFrame(function () { resize(); loadPreset(state.preset); frame(); });
})();
