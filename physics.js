/*
 * Orbit Dust — physics core
 * N-body gravity, velocity Verlet integration, Plummer softening.
 * Works in the browser (window.OrbitPhysics) and in Node (require).
 */
(function (global) {
  'use strict';

  var DEFAULTS = {
    G: 1,            // scaled gravitational constant (sandbox units)
    softening: 4,    // epsilon, in px — Plummer softening length
    merge: true      // merge bodies on collision
  };

  function createBody(opts) {
    opts = opts || {};
    var mass = opts.mass != null ? opts.mass : 1;
    return {
      x: opts.x || 0,
      y: opts.y || 0,
      vx: opts.vx || 0,
      vy: opts.vy || 0,
      ax: 0,
      ay: 0,
      mass: mass,
      // visual / collision radius; default grows slowly with mass
      radius: opts.radius != null ? opts.radius : 2 + Math.cbrt(mass) * 1.2,
      fixed: !!opts.fixed,
      name: opts.name || '',
      hue: opts.hue != null ? opts.hue : Math.floor(Math.random() * 360),
      trail: []
    };
  }

  /*
   * Accelerations with Plummer softening:
   *   a_i = -G * sum_j  m_j * (r_i - r_j) / (|r_i - r_j|^2 + eps^2)^(3/2)
   * Softening caps the force at close range, so coincident bodies give a
   * finite (in fact near-zero) acceleration instead of a singularity.
   */
  function computeAccelerations(bodies, G, softening) {
    var eps2 = softening * softening;
    var n = bodies.length;
    for (var i = 0; i < n; i++) { bodies[i].ax = 0; bodies[i].ay = 0; }
    for (i = 0; i < n; i++) {
      var bi = bodies[i];
      for (var j = i + 1; j < n; j++) {
        var bj = bodies[j];
        var dx = bi.x - bj.x;
        var dy = bi.y - bj.y;
        var invR = 1 / Math.sqrt(dx * dx + dy * dy + eps2);
        var invR3 = invR * invR * invR;
        var si = G * bj.mass * invR3;
        var sj = G * bi.mass * invR3;
        bi.ax -= dx * si; bi.ay -= dy * si;
        bj.ax += dx * sj; bj.ay += dy * sj;
      }
    }
    return bodies;
  }

  /*
   * One velocity-Verlet step:
   *   x(t+dt) = x + v*dt + 0.5*a(t)*dt^2
   *   v(t+dt) = v + 0.5*(a(t) + a(t+dt))*dt
   * Symplectic and time-reversible, so total energy oscillates slightly
   * instead of drifting the way explicit Euler does.
   */
  function step(bodies, dt, opts) {
    opts = opts || {};
    var G = opts.G != null ? opts.G : DEFAULTS.G;
    var softening = opts.softening != null ? opts.softening : DEFAULTS.softening;
    var i, b;

    computeAccelerations(bodies, G, softening);
    var oldAx = [], oldAy = [];
    for (i = 0; i < bodies.length; i++) {
      b = bodies[i];
      oldAx.push(b.ax); oldAy.push(b.ay);
      if (!b.fixed) {
        b.x += b.vx * dt + 0.5 * b.ax * dt * dt;
        b.y += b.vy * dt + 0.5 * b.ay * dt * dt;
      }
    }
    computeAccelerations(bodies, G, softening);
    for (i = 0; i < bodies.length; i++) {
      b = bodies[i];
      if (!b.fixed) {
        b.vx += 0.5 * (oldAx[i] + b.ax) * dt;
        b.vy += 0.5 * (oldAy[i] + b.ay) * dt;
      } else {
        b.vx = 0; b.vy = 0;
      }
    }
    if (opts.merge != null ? opts.merge : DEFAULTS.merge) {
      mergeCollisions(bodies);
    }
    return bodies;
  }

  /* Perfectly inelastic merging: mass, position (centre of mass) and
   * momentum are conserved; the heavier body absorbs the lighter one. */
  function mergeCollisions(bodies) {
    var removed = {};
    for (var i = 0; i < bodies.length; i++) {
      if (removed[i]) continue;
      var a = bodies[i];
      for (var j = i + 1; j < bodies.length; j++) {
        if (removed[j]) continue;
        var b = bodies[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        // Collide when the larger disc's centre reaches the other body,
        // i.e. the discs overlap substantially (not just grazing).
        var minDist = Math.max(a.radius, b.radius);
        if (dist < minDist) {
          var heavy = a.mass >= b.mass ? a : b;
          var light = heavy === a ? b : a;
          var total = heavy.mass + light.mass;
          heavy.x = (heavy.x * heavy.mass + light.x * light.mass) / total;
          heavy.y = (heavy.y * heavy.mass + light.y * light.mass) / total;
          heavy.vx = (heavy.vx * heavy.mass + light.vx * light.mass) / total;
          heavy.vy = (heavy.vy * heavy.mass + light.vy * light.mass) / total;
          if (heavy.fixed || light.fixed) heavy.fixed = heavy.fixed || light.fixed;
          heavy.mass = total;
          heavy.radius = Math.cbrt(Math.pow(heavy.radius, 3) + Math.pow(light.radius, 3));
          removed[light === a ? i : j] = true;
          if (light === a) { a = heavy; }
        }
      }
    }
    for (var k = bodies.length - 1; k >= 0; k--) {
      if (removed[k]) bodies.splice(k, 1);
    }
    return bodies;
  }

  function totalEnergy(bodies, G, softening) {
    G = G != null ? G : DEFAULTS.G;
    softening = softening != null ? softening : DEFAULTS.softening;
    var eps2 = softening * softening;
    var ke = 0, pe = 0;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      ke += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy);
      for (var j = i + 1; j < bodies.length; j++) {
        var o = bodies[j];
        var dx = b.x - o.x, dy = b.y - o.y;
        pe -= G * b.mass * o.mass / Math.sqrt(dx * dx + dy * dy + eps2);
      }
    }
    return { kinetic: ke, potential: pe, total: ke + pe };
  }

  /* Speed for a circular orbit of radius r around mass M. */
  function circularOrbitSpeed(G, M, r) {
    return Math.sqrt(G * M / r);
  }

  var api = {
    DEFAULTS: DEFAULTS,
    createBody: createBody,
    computeAccelerations: computeAccelerations,
    step: step,
    mergeCollisions: mergeCollisions,
    totalEnergy: totalEnergy,
    circularOrbitSpeed: circularOrbitSpeed
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.OrbitPhysics = api;
  }
})(typeof window !== 'undefined' ? window : this);
