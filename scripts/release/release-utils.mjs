import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export function run(command, args = [], options = {}) {
  return execFileSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  })?.trim();
}

export function capture(command, args = []) {
  return run(command, args, { capture: true });
}

export function parseReleaseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith('--')));
  const version = argv.find((arg) => !arg.startsWith('-'));

  return {
    version,
    dryRun: flags.has('--dry-run'),
    yes: flags.has('--yes'),
    help: flags.has('--help') || argv.includes('-h'),
  };
}

export function requireVersion(version) {
  if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('Expected a semantic version such as 0.1.0.');
  }
}

export function requireVersionIncrease(currentVersion, nextVersion) {
  const numericParts = (version) =>
    version.split('-', 1)[0].split('.').map(Number);
  const current = numericParts(currentVersion);
  const next = numericParts(nextVersion);
  const comparison = next.findIndex((part, index) => part !== current[index]);

  if (comparison === -1 || next[comparison] < current[comparison]) {
    throw new Error(
      `Release version ${nextVersion} must be greater than ${currentVersion}.`,
    );
  }
}

export function requireCleanMain() {
  const branch = capture('git', ['branch', '--show-current']);
  if (branch !== 'main') {
    throw new Error(`Run this command from main (current branch: ${branch}).`);
  }

  if (capture('git', ['status', '--porcelain'])) {
    throw new Error('The working tree must be clean before preparing a release.');
  }
}

export function requireGitHubCli() {
  run('gh', ['auth', 'status'], { capture: true });
}

export function requireMainUpToDate() {
  run('git', ['fetch', 'origin', 'main', '--tags']);
  const local = capture('git', ['rev-parse', 'main']);
  const remote = capture('git', ['rev-parse', 'origin/main']);
  if (local !== remote) {
    throw new Error('main is not synchronized with origin/main. Run git pull --ff-only.');
  }
}

export async function confirmRelease(message, expected, yes) {
  if (yes) {
    return;
  }

  const prompt = createInterface({ input: stdin, output: stdout });
  const answer = await prompt.question(`${message}\nType ${expected} to continue: `);
  prompt.close();

  if (answer.trim() !== expected) {
    throw new Error('Release cancelled.');
  }
}

export function fail(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nRelease aborted: ${message}`);
  process.exitCode = 1;
}
