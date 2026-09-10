#!/usr/bin/env node
/**
 * Visual walkthrough — captures UI screenshots of the dev homepage across
 * browsers (chromium, webkit) and viewports (mobile/tablet/desktop).
 *
 * Usage:
 *   pnpm visual                              # chromium + webkit
 *   VISUAL_BROWSERS=firefox pnpm visual      # optional extra engines
 *
 * Reuses a running dev server when found on localhost:4321-4326 (a port
 * counts as "ours" only if the homepage returns 200 and mentions
 * "Labormin"); otherwise spawns one on the first free port and kills it
 * when done. Screenshots overwrite screenshots/<browser>-<w>x<h>.png.
 */
import { spawn } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit, firefox } from 'playwright';

const PORT_RANGE = [4321, 4322, 4323, 4324, 4325, 4326];
const VIEWPORTS = [
  { width: 375, height: 812 }, // mobile
  { width: 768, height: 1024 }, // tablet
  { width: 1280, height: 800 }, // desktop
];
const SITE_MARKER = 'Labormin';
const SPAWN_TIMEOUT_MS = 30_000;
const STABILIZE_MS = 1_000;
const PROBE_TIMEOUT_MS = 500;
const ENGINES = { chromium, webkit, firefox };
const OUT_DIR = path.resolve('screenshots');

/** Resolve a TCP connection to detect whether something listens on the port.
 *  Astro dev may bind IPv4 only, IPv6 only (e.g. ::1), or both. */
function portInUse(port) {
  const probe = (host) =>
    new Promise((resolve) => {
      const socket = net.createConnection({ host, port });
      const done = (result) => {
        socket.destroy();
        resolve(result);
      };
      socket.setTimeout(PROBE_TIMEOUT_MS);
      socket.on('connect', () => done(true));
      socket.on('error', () => done(false));
      socket.on('timeout', () => done(false));
    });
  return Promise.all([probe('127.0.0.1'), probe('::1')]).then(([v4, v6]) => v4 || v6);
}

/** True when the port serves this site's dev homepage. */
async function isOurApp(port) {
  try {
    const res = await fetch(`http://localhost:${port}/`, { redirect: 'manual' });
    if (res.status !== 200) return false;
    const html = await res.text();
    return html.includes(SITE_MARKER);
  } catch {
    return false;
  }
}

/** Find an existing dev server of ours, or the first port free to spawn on. */
async function findServer() {
  let firstFree;
  for (const port of PORT_RANGE) {
    if (!(await portInUse(port))) {
      firstFree ??= port;
      continue;
    }
    if (await isOurApp(port)) return { port, spawned: false };
  }
  return { firstFree, spawned: true };
}

/** Spawn `astro dev --port P --strictPort` and wait for it to serve. */
async function spawnServer(port) {
  console.log(`\nStarting dev server on port ${port}...`);
  const child = spawn(
    'pnpm',
    ['exec', 'astro', 'dev', '--port', String(port), '--strictPort'],
    { detached: true, stdio: 'ignore' },
  );
  const spawnError = new Promise((_, reject) => {
    child.on('error', reject);
    child.on('exit', (code) =>
      reject(new Error(`astro dev exited immediately (code ${code ?? 'signal'}).`)),
    );
  });
  const deadline = Date.now() + SPAWN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    // The ready check must race against the child dying (e.g. port taken):
    // never credit a foreign listener for our spawn.
    if (await Promise.race([isOurApp(port), spawnError.then(() => false)])) return child;
    await new Promise((r) => setTimeout(r, 300));
  }
  killServer(child);
  throw new Error(
    `Dev server did not become ready on port ${port} within ${SPAWN_TIMEOUT_MS / 1000}s. ` +
      `Run "pnpm dev" manually to see the error.`,
  );
}

/** Kill the whole process group (spawned detached with pnpm -> astro). */
function killServer(child) {
  if (!child || child.exitCode !== null) return;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    /* already gone */
  }
  setTimeout(() => {
    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch {
      /* already gone */
    }
  }, 1_000).unref();
}

function resolveBrowsers() {
  const requested = (process.env.VISUAL_BROWSERS ?? 'chromium,webkit')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  for (const name of requested) {
    if (!ENGINES[name]) {
      throw new Error(`Unknown browser "${name}". Valid: ${Object.keys(ENGINES).join(', ')}.`);
    }
  }
  if (requested.length === 0) throw new Error('VISUAL_BROWSERS is empty.');
  return requested;
}

function assertBrowserInstalled(name) {
  const executable = ENGINES[name].executablePath();
  if (!fs.existsSync(executable)) {
    throw new Error(
      `Playwright browser "${name}" is not installed. Run: npx playwright install ${name}`,
    );
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browsers = resolveBrowsers();
  browsers.forEach(assertBrowserInstalled);

  const found = await findServer();
  let child;
  let port;
  if (!found.spawned && found.port) {
    port = found.port;
    console.log(`Reusing dev server already running at http://localhost:${port}`);
  } else if (found.firstFree) {
    child = await spawnServer(found.firstFree);
    port = found.firstFree;
  } else {
    throw new Error(
      `Ports ${PORT_RANGE[0]}-${PORT_RANGE.at(-1)} are busy with other processes and ` +
        `no Labormin dev server was found among them. Free a port or stop the other processes.`,
    );
  }

  const url = `http://localhost:${port}/`;
  const failures = [];
  try {
    for (const name of browsers) {
      const browser = await ENGINES[name].launch();
      try {
        // One page reused across viewports: engines are light on memory.
        const page = await browser.newPage();
        for (const { width, height } of VIEWPORTS) {
          const file = path.join(OUT_DIR, `${name}-${width}x${height}.png`);
          const label = `${name} @ ${width}x${height}`;
          try {
            await page.setViewportSize({ width, height });
            await page.goto(url, { waitUntil: 'networkidle' });
            await new Promise((r) => setTimeout(r, STABILIZE_MS));
            await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
            console.log(`✓ ${label} -> ${file}`);
          } catch (err) {
            failures.push(label);
            console.error(`✗ ${label}: ${err.message}`);
          }
        }
      } finally {
        await browser.close();
      }
    }
  } finally {
    if (child) killServer(child);
  }

  if (failures.length > 0) {
    throw new Error(`${failures.length} capture(s) failed: ${failures.join(', ')}`);
  }
  console.log(`\nDone: ${browsers.length * VIEWPORTS.length} screenshot(s) in ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error(`visual: ${err.message}`);
  process.exit(1);
});
