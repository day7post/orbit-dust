'use strict';
/* Orbit Dust — physics tests. Run: node tests/physics.test.js */
const assert = require('assert');
const P = require('../physics.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('ok - ' + name);
}

const G = 1;
const EPS = 4;

test('softening avoids singularity for coincident bodies', () => {
  const a = P.createBody({ x: 100, y: 100, mass: 100 });
  const b = P.createBody({ x: 100, y: 100, mass: 50 });
  P.computeAccelerations([a, b], G, EPS);
  assert.ok(Number.isFinite(a.ax) && Number.isFinite(a.ay), 'accel must be finite');
  assert.ok(Number.isFinite(b.ax) && Number.isFinite(b.ay), 'accel must be finite');
  // coincident + softened => acceleration ~ 0, definitely not huge
  assert.ok(Math.abs(a.ax) < 1e-9 && Math.abs(b.ax) < 1e-9);
  // and a step must not blow up positions
  const bodies = [a, b];
  for (let i = 0; i < 100; i++) P.step(bodies, 0.1, { G, softening: EPS, merge: false });
  assert.ok(bodies.every((x) => Number.isFinite(x.x) && Number.isFinite(x.y)));
});

test('two-body circular orbit is stable', () => {
  const star = P.createBody({ x: 0, y: 0, mass: 1000, radius: 14 });
  const r = 150;
  const v = P.circularOrbitSpeed(G, star.mass, r);
  const planet = P.createBody({ x: r, y: 0, vx: 0, vy: v, mass: 1, radius: 3 });
  const bodies = [star, planet];
  const dt = 0.25;
  let minR = Infinity, maxR = 0;
  for (let i = 0; i < 4000; i++) {
    P.step(bodies, dt, { G, softening: EPS, merge: false });
    const dx = planet.x - star.x, dy = planet.y - star.y;
    const d = Math.hypot(dx, dy);
    if (i > 200) { // after settling
      minR = Math.min(minR, d);
      maxR = Math.max(maxR, d);
    }
  }
  assert.ok(minR > r * 0.85, `orbit shrank too much: minR=${minR.toFixed(1)}`);
  assert.ok(maxR < r * 1.15, `orbit grew too much: maxR=${maxR.toFixed(1)}`);
});

test('total energy is approximately conserved (3 bodies, softened Verlet)', () => {
  const bodies = [
    P.createBody({ x: 0, y: 0, mass: 1000, radius: 14 }),
    P.createBody({ x: 150, y: 0, vx: 0, vy: P.circularOrbitSpeed(G, 1000, 150), mass: 1, radius: 3 }),
    P.createBody({ x: -220, y: 40, vx: 0.3, vy: -P.circularOrbitSpeed(G, 1000, 224) * 0.95, mass: 2, radius: 3 })
  ];
  const e0 = P.totalEnergy(bodies, G, EPS).total;
  for (let i = 0; i < 2000; i++) P.step(bodies, 0.25, { G, softening: EPS, merge: false });
  const e1 = P.totalEnergy(bodies, G, EPS).total;
  const drift = Math.abs((e1 - e0) / e0);
  assert.ok(drift < 0.02, `energy drift too large: ${(drift * 100).toFixed(3)}% (E0=${e0.toFixed(2)}, E1=${e1.toFixed(2)})`);
  console.log(`   energy drift: ${(drift * 100).toFixed(4)}%`);
});

test('collision merging conserves momentum and mass', () => {
  const a = P.createBody({ x: 0, y: 0, vx: 1, vy: 0, mass: 10, radius: 6 });
  const b = P.createBody({ x: 5, y: 0, vx: -1, vy: 0.5, mass: 10, radius: 6 });
  const px = a.mass * a.vx + b.mass * b.vx;
  const py = a.mass * a.vy + b.mass * b.vy;
  const bodies = [a, b];
  P.mergeCollisions(bodies);
  assert.strictEqual(bodies.length, 1, 'overlapping bodies should merge');
  const m = bodies[0];
  assert.strictEqual(m.mass, 20);
  assert.ok(Math.abs(m.mass * m.vx - px) < 1e-9, 'x momentum conserved');
  assert.ok(Math.abs(m.mass * m.vy - py) < 1e-9, 'y momentum conserved');
});

console.log(`\n${passed} tests passed`);
