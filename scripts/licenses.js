// Writes src/licenses.json from the installed production dependency tree.
// Run `npm run licenses` after adding or upgrading a dependency.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dirs = execSync('npm ls --omit=dev --all --parseable', {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split(/\r?\n/)
  .slice(1); // the first line is the project itself

const seen = new Set();
const licenses = [];
for (const dir of dirs) {
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const id = `${pkg.name}@${pkg.version}`;
  if (seen.has(id)) continue;
  seen.add(id);
  licenses.push({
    name: pkg.name,
    version: pkg.version,
    license:
      (typeof pkg.license === 'object' ? pkg.license.type : pkg.license) ??
      'UNKNOWN',
  });
}
licenses.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(
  path.join(root, 'src', 'licenses.json'),
  JSON.stringify(licenses, null, 2) + '\n',
);
console.log(`Wrote ${licenses.length} packages to src/licenses.json`);
