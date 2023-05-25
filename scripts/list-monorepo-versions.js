const fs = require('fs');
const path = require('path');

const getPackageDirectories = (monorepoPath) => {
  const packagesPath = path.join(monorepoPath, 'packages');
  let packageDirs = [];

  try {
    const items = fs.readdirSync(packagesPath, { withFileTypes: true });
    packageDirs = items
      .filter((item) => item.isDirectory())
      .map((item) => path.join(packagesPath, item.name));
  } catch (error) {
    console.error('Error reading packages directory:', error);
  }

  return packageDirs;
};

const processMonorepo = (monorepoPath) => {
  const packageDirs = getPackageDirectories(monorepoPath);
  packageDirs.forEach((packageDir) => {
    const packageJsonPath = path.join(packageDir, 'package.json');
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      console.log(`${packageJson.name}@${packageJson.version}`);
    } catch (error) {
      console.error(`Error reading package.json at ${packageDir}:`, error);
    }
  });
};

const scriptDir = path.dirname(__filename);
const rootDir = path.resolve(scriptDir, '..');
const monorepoPaths = process.argv.slice(2).map((monorepo) => path.resolve(rootDir, monorepo));

monorepoPaths.forEach((monorepoPath) => {
  console.log(`Packages in ${monorepoPath}:`);
  processMonorepo(monorepoPath);
  console.log();
});
