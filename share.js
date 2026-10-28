/*
 * Orbit Dust — share-link scene codec
 * Encodes a scene (per body: x, y, vx, vy, mass, isStar) into a compact
 * base64url payload for the URL hash, and decodes it back with strict
 * validation. Quantisation: positions to 1px, velocities to 0.01,
 * mass to 0.1 — plenty for a sandbox scene, tiny in a URL.
 * Works in the browser (window.OrbitShare) and in Node (require).
 */
(function (global) {
  'use strict';

  var MAX_BODIES = 240;
  var MAX_PAYLOAD = 32768;
  var VEL_SCALE = 100;
  var MASS_SCALE = 10;

  function b64encode(str) {
    var out;
    if (typeof btoa === 'function') out = btoa(str);
    else out = Buffer.from(str, 'utf8').toString('base64');
    return out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64decode(payload) {
    var s = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    if (typeof atob === 'function') return atob(s);
    return Buffer.from(s, 'base64').toString('utf8');
  }

  /* bodies: [{x, y, vx, vy, mass, isStar}] -> payload string */
  function encodeScene(bodies) {
    var rows = [];
    var list = (bodies || []).slice(0, MAX_BODIES);
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      rows.push([
        Math.round(b.x),
        Math.round(b.y),
        Math.round((b.vx || 0) * VEL_SCALE),
        Math.round((b.vy || 0) * VEL_SCALE),
        Math.max(1, Math.round((b.mass || 1) * MASS_SCALE)),
        b.isStar ? 1 : 0
      ].join(','));
    }
    return b64encode(rows.join(';'));
  }

  /* payload string -> [{x, y, vx, vy, mass, isStar}] or null on any problem */
  function decodeScene(payload) {
    try {
      if (typeof payload !== 'string' || !payload) return null;
      if (payload.length > MAX_PAYLOAD) return null;
      if (!/^[A-Za-z0-9_-]+$/.test(payload)) return null;
      var text = b64decode(payload);
      if (!text) return null;
      var rows = text.split(';');
      if (rows.length < 1 || rows.length > MAX_BODIES) return null;
      var out = [];
      for (var i = 0; i < rows.length; i++) {
        var parts = rows[i].split(',');
        if (parts.length !== 6) return null;
        var nums = [];
        for (var k = 0; k < 6; k++) {
          if (!/^-?\d+$/.test(parts[k])) return null;
          nums.push(parseInt(parts[k], 10));
        }
        var x = nums[0], y = nums[1];
        var vx = nums[2] / VEL_SCALE, vy = nums[3] / VEL_SCALE;
        var mass = nums[4] / MASS_SCALE;
        var flag = nums[5];
        if (!isFinite(x) || !isFinite(y) || !isFinite(vx) || !isFinite(vy) || !isFinite(mass)) return null;
        if (Math.abs(x) > 20000 || Math.abs(y) > 20000) return null;
        if (Math.abs(vx) > 100 || Math.abs(vy) > 100) return null;
        if (!(mass > 0) || mass > 100000) return null;
        if (flag !== 0 && flag !== 1) return null;
        out.push({ x: x, y: y, vx: vx, vy: vy, mass: mass, isStar: flag === 1 });
      }
      return out.length ? out : null;
    } catch (e) {
      return null;
    }
  }

  /* Extract and decode a scene from a location.hash string like "#s=...". */
  function decodeHash(hash) {
    if (typeof hash !== 'string') return null;
    var m = /(?:^#|[#&])s=([A-Za-z0-9_-]+)/.exec(hash);
    if (!m) return null;
    return decodeScene(m[1]);
  }

  var api = {
    MAX_BODIES: MAX_BODIES,
    encodeScene: encodeScene,
    decodeScene: decodeScene,
    decodeHash: decodeHash
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.OrbitShare = api;
  }
})(typeof window !== 'undefined' ? window : this);
