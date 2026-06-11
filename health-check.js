#!/usr/bin/env node

const http = require("http");

const tests = [
  {
    name: "Backend Health",
    method: "GET",
    host: "localhost",
    port: 5000,
    path: "/api/health",
  },
  {
    name: "Frontend Health",
    method: "GET",
    host: "localhost",
    port: 5500,
    path: "/pages/index.html",
  },
];

async function runTest(test) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: test.host,
        port: test.port,
        path: test.path,
        method: test.method,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ ${test.name}: ${res.statusCode}`);
          } else {
            console.log(
              `⚠️  ${test.name}: ${res.statusCode} (may need auth)`
            );
          }
          resolve();
        });
      }
    );

    req.on("error", (err) => {
      console.log(`❌ ${test.name}: ${err.message}`);
      resolve();
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`⏱️  ${test.name}: Timeout`);
      resolve();
    });

    req.end();
  });
}

async function main() {
  console.log("🔍 Running health checks...\n");
  for (const test of tests) {
    await runTest(test);
  }

  console.log("\n✅ All checks complete!");
  console.log("\n📚 Test the application:");
  console.log("  • http://localhost:5500/pages/index.html (Homepage)");
  console.log("  • http://localhost:5500/pages/login.html (Login)");
  console.log("  • Backend API: http://localhost:5000");
}

main().catch(console.error);
