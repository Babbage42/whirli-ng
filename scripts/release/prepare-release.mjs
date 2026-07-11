import { readFileSync, writeFileSync } from 'node:fs';
import {
  capture,
  confirmRelease,
  fail,
  parseReleaseArgs,
  requireCleanMain,
  requireGitHubCli,
  requireMainUpToDate,
  requireVersion,
  requireVersionIncrease,
  run,
} from './release-utils.mjs';

const PACKAGE_PATH = 'projects/whirli-ng/package.json';

function printHelp() {
  console.log(`Usage: npm run release:prepare -- <version> [--dry-run] [--yes]

Creates a release branch, bumps the library version, commits it, pushes it,
and opens a draft pull request. It never creates a tag or publishes a release.`);
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
  const currentVersion = packageJson.version;
  const tag = `v${args.version}`;
  const branch = `release/${args.version}`;

  requireVersionIncrease(currentVersion, args.version);
  if (capture('git', ['tag', '--list', tag])) {
    throw new Error(`Tag ${tag} already exists.`);
  }
  if (capture('git', ['ls-remote', '--heads', 'origin', branch])) {
    throw new Error(`Remote branch ${branch} already exists.`);
  }

  console.log(`\nRelease plan\n  package: whirli-ng\n  version: ${currentVersion} -> ${args.version}\n  branch:  ${branch}\n  PR base: main`);
  if (args.dryRun) {
    console.log('\nDry run complete. No files or remote resources were changed.');
    return;
  }

  await confirmRelease('Prepare the release pull request?', args.version, args.yes);

  run('git', ['switch', '-c', branch]);
  packageJson.version = args.version;
  writeFileSync(PACKAGE_PATH, `${JSON.stringify(packageJson, null, 2)}\n`);
  run('git', ['add', PACKAGE_PATH]);
  run('git', ['commit', '-m', `chore: prepare release ${args.version}`]);
  run('git', ['push', '-u', 'origin', branch]);
  run('gh', [
    'pr',
    'create',
    '--draft',
    '--base',
    'main',
    '--head',
    branch,
    '--title',
    `chore: prepare release ${args.version}`,
    '--body',
    `## Release preparation\n\n- bump whirli-ng from ${currentVersion} to ${args.version}\n- target GitHub release ${tag}\n\nAfter merging this PR, run:\n\n\`\`\`bash\nnpm run release:github -- ${args.version}\n\`\`\``,
  ]);
}

main().catch(fail);
