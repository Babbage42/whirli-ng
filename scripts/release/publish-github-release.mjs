import { readFileSync } from 'node:fs';
import {
  capture,
  confirmRelease,
  fail,
  parseReleaseArgs,
  requireCleanMain,
  requireGitHubCli,
  requireMainUpToDate,
  requireVersion,
  run,
} from './release-utils.mjs';

const PACKAGE_PATH = 'projects/whirli-ng/package.json';

function printHelp() {
  console.log(`Usage: npm run release:github -- <version> [--dry-run] [--yes]

Creates tag v<version> on main and publishes the matching GitHub Release with
generated notes. It does not publish the package to npm.`);
}

async function main() {
  const args = parseReleaseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  requireVersion(args.version);
  requireCleanMain();
  requireGitHubCli();
  requireMainUpToDate();

  const packageJson = JSON.parse(readFileSync(PACKAGE_PATH, 'utf8'));
  const tag = `v${args.version}`;
  if (packageJson.version !== args.version) {
    throw new Error(
      `${PACKAGE_PATH} is ${packageJson.version}, expected ${args.version}. Merge the release PR first.`,
    );
  }
  if (capture('git', ['tag', '--list', tag])) {
    throw new Error(`Tag ${tag} already exists.`);
  }

  console.log(`\nGitHub release plan\n  target: main\n  tag:    ${tag}\n  title:  whirli-ng ${tag}`);
  if (args.dryRun) {
    console.log('\nDry run complete. No tag or GitHub Release was created.');
    return;
  }

  await confirmRelease('Publish this GitHub Release?', tag, args.yes);
  run('gh', [
    'release',
    'create',
    tag,
    '--target',
    'main',
    '--title',
    `whirli-ng ${tag}`,
    '--generate-notes',
  ]);
}

main().catch(fail);
