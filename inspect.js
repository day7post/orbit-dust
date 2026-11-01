/*
 * Orbit Dust — selection helpers (0.3.0: click a body to inspect it).
 * Pure logic, no DOM: the browser UI in main.js calls these, and the
 * Node tests in tests/inspect.test.js cover them directly.
 * Works in the browser (window.OrbitInspect) and in Node (require).
 */
(function (global) {
  'use strict';

  /* A click is a press + release with almost no movement; anything longer
   * is a drag-launch. Threshold in px (world coordinates). */
  var CLICK_MAX_DIST = 6;

  function isClick(dx, dy) {
    return Math.hypot(dx, dy) <= CLICK_MAX_DIST;
  }

  /* Nearest body under (x, y), or null. A body counts as hit when the
   * point lands within its disc plus a small grab margin (tiny dust
   * particles would otherwise be unclickable). Ties go to the nearer one. */
  function pickBody(bodies, x, y) {
    var best = null, bestDist = Infinity;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      var d = Math.hypot(b.x - x, b.y - y);
      var reach = Math.max(14, (b.radius || 0) + 8);
      if (d <= reach && d < bestDist) { best = b; bestDist = d; }
    }
    return best;
  }

  function bodySpeed(b) {
    return Math.hypot(b.vx || 0, b.vy || 0);
  }

  /* Change a body's mass. Planets get the same radius rule as creation
   * (2 + cbrt(mass) * 1.2); stars keep their fixed display radius, so a
   * star never shrinks to a dot or swells over the canvas. */
  function setMass(b, mass) {
    b.mass = mass;
    if (!b.isStar) b.radius = 2 + Math.cbrt(mass) * 1.2;
    return b;
  }

  var api = {
    CLICK_MAX_DIST: CLICK_MAX_DIST,
    isClick: isClick,
    pickBody: pickBody,
    bodySpeed: bodySpeed,
    setMass: setMass
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.OrbitInspect = api;
  }
})(typeof window !== 'undefined' ? window : this);
