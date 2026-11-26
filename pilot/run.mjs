import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const catalog = JSON.parse(readFileSync(new URL('./catalog.json', import.meta.url), 'utf8'));
const sourceDirectory = resolve(process.argv[2] ?? 'app-source');
const reportFile = resolve(process.argv[3] ?? 'pilot-output/report.json');

function checkSource() {
  try {
    const options = { cwd: sourceDirectory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] };
    const head = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], options).trim();
    if (head !== catalog.source.commit) return 'SOURCE_PIN_MISMATCH';
    const changes = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], options);
    if (changes.trim()) return 'SOURCE_CHECKOUT_MODIFIED';
  } catch {
    return 'SOURCE_CHECKOUT_UNAVAILABLE';
  }
  return null;
}

function runSuite(suite) {
  const start = Date.now();
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', suite.file], {
    cwd: sourceDirectory,
    env: { CI: 'true', NO_COLOR: '1', TZ: 'UTC' },
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    timeout: 90_000,
    maxBuffer: 2 * 1024 * 1024,
  });
  const counts = Object.fromEntries(
    [...(result.stdout ?? '').matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)]
      .map(([, name, count]) => [name, Number(count)]),
  );
  const completed = ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']
    .every(name => Number.isInteger(counts[name]));
  const passed = completed && counts.tests > 0 && counts.tests === counts.pass && result.status === 0;
  return {
    id: suite.id,
    status: passed ? 'PASS' : 'FAIL',
    exitCode: result.status,
    durationMs: Date.now() - start,
    counts: completed ? counts : null,
    reason: passed ? null : result.error?.code === 'ETIMEDOUT' ? 'SUITE_TIMEOUT' : 'SUITE_INCOMPLETE_OR_FAILED',
  };
}

const startedAt = new Date().toISOString();
const sourceProblem = checkSource();
const suites = sourceProblem
  ? catalog.suites.map(({ id }) => ({ id, status: 'BLOCKED', reason: sourceProblem }))
  : catalog.suites.map(runSuite);
const status = sourceProblem ? 'BLOCKED' : suites.every(suite => suite.status === 'PASS') ? 'PASS' : 'FAIL';
const exitCode = status === 'PASS' ? 0 : 1;
const report = {
  schemaVersion: 1,
  stage: catalog.stage,
  fr: catalog.fr,
  batch: catalog.batch,
  source: catalog.source,
  startedAt,
  finishedAt: new Date().toISOString(),
  node: process.version,
  status,
  exitCode,
  suites,
};

mkdirSync(dirname(reportFile), { recursive: true });
writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
process.exitCode = exitCode;
