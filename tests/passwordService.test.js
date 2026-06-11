const { test } = require("node:test");
const assert = require("node:assert/strict");
const { hashPassword, comparePassword } = require("../backend/services/passwordService");

test("hashPassword and comparePassword round-trip", async () => {
  const hash = await hashPassword("Password123");
  assert.ok(hash.startsWith("$2"));
  assert.equal(await comparePassword("Password123", hash), true);
  assert.equal(await comparePassword("wrong", hash), false);
});
