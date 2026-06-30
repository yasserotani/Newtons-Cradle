import test from "node:test";
import assert from "node:assert/strict";
import { PhysicsEngine } from "../src/physics/PhysicsEngine.js";

test("physics engine returns positions for the configured ball count", () => {
  const config = {
    ballCount: 5,
    cradleWidth: 3.2,
    supportHeight: 3.0,
    threadLength: 2.0,
  };

  const engine = new PhysicsEngine(config);
  engine.update(0.016);
  const positions = engine.getPositions();

  assert.equal(positions.length, config.ballCount);
  assert.ok(
    positions.every((pos) => Number.isFinite(pos.x) && Number.isFinite(pos.y)),
  );
});

test("physics engine can initialize a custom launch state", () => {
  const config = {
    ballCount: 5,
    cradleWidth: 3.2,
    supportHeight: 3.0,
    threadLength: 2.0,
    initialLaunchAngle: -0.8,
    liftedBallCount: 3,
  };

  const engine = new PhysicsEngine(config);

  assert.equal(engine.balls[0].angle, config.initialLaunchAngle);
  assert.equal(engine.balls[1].angle, config.initialLaunchAngle);
  assert.equal(engine.balls[2].angle, config.initialLaunchAngle);
  assert.equal(engine.balls[3].angle, 0);
});

test("physics engine does not transfer momentum before actual contact", () => {
  const config = {
    ballCount: 3,
    cradleWidth: 3.2,
    supportHeight: 3.0,
    threadLength: 2.0,
    ballRadius: 0.4,
  };

  const engine = new PhysicsEngine(config);
  engine.balls[0].angle = 0;
  engine.balls[0].angularVelocity = 0.8;
  engine.balls[1].angle = 0;
  engine.balls[1].angularVelocity = 0;

  engine.simulateStep(0.016);

  assert.equal(engine.balls[0].angularVelocity > 0, true);
  assert.equal(engine.balls[1].angularVelocity, 0);
});
