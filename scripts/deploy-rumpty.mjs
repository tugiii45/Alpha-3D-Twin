import { spawn } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("Created .env from .env.example.");
}

await run("docker", ["version"]);
await run("docker", ["compose", "up", "-d", "--build"]);

const port = process.env.HOST_PORT || "8080";
const healthUrl = `http://127.0.0.1:${port}/api/health`;

for (let attempt = 1; attempt <= 30; attempt += 1) {
  try {
    const response = await fetch(healthUrl);
    if (response.ok) {
      console.log(`RumptyCloud container is healthy: ${healthUrl}`);
      console.log(JSON.stringify(await response.json(), null, 2));
      process.exit(0);
    }
  } catch {
    // The server is still starting.
  }
  await delay(1000);
}

console.error(`Health check did not pass at ${healthUrl}. Run: docker compose logs`);
process.exit(1);

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: true });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed (${code})`));
    });
  });
}
