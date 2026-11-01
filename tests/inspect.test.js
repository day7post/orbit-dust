'use strict';
/* Orbit Dust — selection helper tests. Run: node tests/inspect.test.js */
const assert = require('assert');
const I = require('../inspect.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('ok - ' + name);
}

function body(x, y, opts) {
  return Object.assign({ x, y, vx: 0, vy: 0, mass: 2, radius: 3.5 }, opts || {});
}

test('click vs drag threshold', () => {
  assert.strictEqual(I.isClick(0, 0), true);
  assert.strictEqual(I.isClick(4, 4), true); // ~5.7px, still a click
  assert.strictEqual(I.isClick(10, 0), false);
});

test('pickBody returns the nearest body within reach, null otherwise', () => {
  const bodies = [body(100, 100), body(130, 100), body(500, 500)];
  assert.strictEqual(I.pickBody(bodies, 102, 100), bodies[0]);
  assert.strictEqual(I.pickBody(bodies, 128, 100), bodies[1]);
  assert.strictEqual(I.pickBody(bodies, 300, 300), null);
});

test('tiny dust is still clickable via the grab margin', () => {
  const dust = body(200, 200, { radius: 1.4, mass: 0.3 });
  assert.strictEqual(I.pickBody([dust], 210, 200), dust);
  assert.strictEqual(I.pickBody([dust], 220, 200), null);
});

test('setMass resizes planets but keeps a star radius', () => {
  const planet = body(0, 0, { mass: 2, radius: 3.5 });
  I.setMass(planet, 8);
  assert.strictEqual(planet.mass, 8);
  assert.ok(Math.abs(planet.radius - (2 + Math.cbrt(8) * 1.2)) < 1e-9);
  const star = body(0, 0, { mass: 1200, radius: 16, isStar: true });
  I.setMass(star, 900);
  assert.strictEqual(star.mass, 900);
  assert.strictEqual(star.radius, 16);
});

test('bodySpeed reports the velocity magnitude', () => {
  assert.strictEqual(I.bodySpeed(body(0, 0, { vx: 3, vy: 4 })), 5);
});

console.log(`\n${passed} tests passed`);
