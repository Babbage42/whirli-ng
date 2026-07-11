# Releasing whirli-ng

GitHub releases use a two-step workflow. Neither command publishes to npm.

## 1. Prepare the version pull request

Start from a clean, synchronized `main` branch:

```bash
nvm use
git switch main
git pull --ff-only
npm run release:prepare -- 0.1.0 --dry-run
npm run release:prepare -- 0.1.0
```

The command creates `release/0.1.0`, updates the library package version,
commits and pushes it, then opens a draft pull request. Review and merge that
pull request before continuing.

## 2. Publish the GitHub Release

Return to a clean and synchronized `main`:

```bash
git switch main
git pull --ff-only
npm run release:github -- 0.1.0 --dry-run
npm run release:github -- 0.1.0
```

The second command creates `v0.1.0` on `main` and publishes a GitHub Release
with generated notes. It verifies that the library package already contains
the requested version and refuses to reuse an existing tag.

Use `--yes` only in controlled automation when interactive confirmation is
not possible.
