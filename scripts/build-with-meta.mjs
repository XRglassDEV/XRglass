#!/usr/bin/env node
import { execSync, spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const env = { ...process.env };

function safeGit(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

if (!env.NEXT_PUBLIC_GIT_BRANCH) {
  env.NEXT_PUBLIC_GIT_BRANCH = env.VERCEL_GIT_COMMIT_REF ?? safeGit("git rev-parse --abbrev-ref HEAD") ?? "unknown";
}

if (!env.NEXT_PUBLIC_GIT_COMMIT) {
  env.NEXT_PUBLIC_GIT_COMMIT = env.VERCEL_GIT_COMMIT_SHA ?? safeGit("git rev-parse --short HEAD") ?? "unknown";
}

if (!env.WS_NO_BUFFER_UTIL) {
  env.WS_NO_BUFFER_UTIL = "1";
}

if (!env.WS_NO_UTF_8_VALIDATE) {
  env.WS_NO_UTF_8_VALIDATE = "1";
}

const here = dirname(fileURLToPath(import.meta.url));
const nextBinary = resolve(
  here,
  process.platform === "win32" ? "../node_modules/.bin/next.cmd" : "../node_modules/.bin/next",
);

const child = spawn(nextBinary, ["build"], {
  env,
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("Failed to run next build:", error);
  process.exit(1);
});
