// Publishes this package with the npm CLI, then creates the git tag.
//
// Used by the release workflow instead of `changeset publish`, which always runs
// `pnpm publish` in a pnpm project. npm (>= 11.5.1) does the Trusted Publishing
// (OIDC) token exchange; pnpm 10 does not, which shows up as a misleading E404.
//
// - Skips when this version is already on npm (the workflow runs on every push).
// - Runs `changeset tag` afterwards: it prints "New tag: …", which tells
//   changesets/action that something was published (git tags, GitHub release).
//
// PUBLISH_DRY_RUN=1 node scripts/publish.mjs  → npm publish --dry-run, no tag.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(
	readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
);
const spec = `${pkg.name}@${pkg.version}`;
const dryRun = process.env.PUBLISH_DRY_RUN === '1';

const run = (command, args) =>
	execFileSync(command, args, { stdio: 'inherit' });

function isPublished() {
	try {
		const out = execFileSync('npm', ['view', spec, 'version'], {
			encoding: 'utf-8',
			stdio: ['ignore', 'pipe', 'ignore']
		});
		return out.trim() === pkg.version;
	} catch {
		return false; // E404: this version (or the package) is not on npm yet
	}
}

if (isPublished()) {
	console.log(`${spec} is already on npm, nothing to publish.`);
	process.exit(0);
}

console.log(
	`Publishing ${spec} with npm ${execFileSync('npm', ['--version'], { encoding: 'utf-8' }).trim()}`
);

// --loglevel verbose: if the OIDC exchange fails, npm logs the real reason
// ("npm verbose oidc …") instead of only the generic E404.
run('npm', [
	'publish',
	'--access',
	'public',
	'--loglevel',
	'verbose',
	...(dryRun ? ['--dry-run'] : [])
]);

if (dryRun) {
	console.log(`Dry run: would now run "changeset tag" for ${spec}.`);
} else {
	run('pnpm', ['exec', 'changeset', 'tag']);
}
