#!/usr/bin/env node

import { execFileSync, spawn } from "node:child_process";
import path from "node:path";

function getPort(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--port" || value === "-p") {
      const nextValue = argv[index + 1];
      if (nextValue) return nextValue;
    }
    if (value.startsWith("--port=")) {
      return value.slice("--port=".length);
    }
    if (value.startsWith("-p=")) {
      return value.slice(3);
    }
  }
  return "3000";
}

function getListeningPids(port) {
  try {
    const output = execFileSync("lsof", ["-ti", `tcp:${port}`], { encoding: "utf8" }).trim();
    if (!output) return [];
    return output
      .split(/\s+/)
      .map((value) => Number(value))
      .filter((pid) => Number.isInteger(pid) && pid > 0);
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status === 1) {
      return [];
    }
    throw error;
  }
}

function getProcessCwd(pid) {
  try {
    const output = execFileSync("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"], {
      encoding: "utf8",
    });
    const cwdLine = output
      .split(/\r?\n/)
      .find((line) => line.startsWith("n"));
    return cwdLine ? cwdLine.slice(1).trim() : "";
  } catch {
    return "";
  }
}

function getListeningProcesses(ports) {
  const processes = [];
  for (const port of ports) {
    const listeningPids = getListeningPids(port);
    for (const pid of listeningPids) {
      processes.push({ port, pid, cwd: getProcessCwd(pid) });
    }
  }
  return processes;
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function waitForPortToClear(port, timeoutMs = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const output = execFileSync("lsof", ["-ti", `tcp:${port}`], { encoding: "utf8" }).trim();
      if (!output) return true;
    } catch (error) {
      if (error && typeof error === "object" && "status" in error && error.status === 1) {
        return true;
      }
      throw error;
    }
    await sleep(250);
  }
  return false;
}

const port = getPort(process.argv.slice(2));
const projectRoot = path.resolve(process.cwd());
const candidatePorts = Array.from({ length: 21 }, (_, index) => Number(port) + index);
const listeningProcesses = getListeningProcesses(candidatePorts);
const sameProjectProcesses = listeningProcesses.filter(({ cwd }) => cwd && path.resolve(cwd) === projectRoot);

if (sameProjectProcesses.length > 0) {
  const uniquePorts = [...new Set(sameProjectProcesses.map(({ port: listeningPort }) => listeningPort))];
  console.log(
    `[dev] clearing ${sameProjectProcesses.length} stale process(es) for this app on port${sameProjectProcesses.length > 1 ? "s" : ""} ${uniquePorts.join(", ")}...`,
  );
  for (const { pid } of sameProjectProcesses) {
    try {
      process.kill(pid, "SIGINT");
    } catch {
      // Ignore processes that disappear between lsof and kill.
    }
  }
  await Promise.all(uniquePorts.map((listeningPort) => waitForPortToClear(String(listeningPort))));
} else if (listeningProcesses.length > 0) {
  console.log(`[dev] port ${port} is already in use by another app; letting Next choose the next available port...`);
}

const nextBin = execFileSync("node", ["-p", "require.resolve('next/dist/bin/next')"], {
  encoding: "utf8",
}).trim();

const child = spawn(process.execPath, [nextBin, "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
