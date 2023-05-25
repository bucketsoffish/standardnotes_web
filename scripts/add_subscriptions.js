const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const triggerFile = 'add_user_subscription_on_register-trigger.sql';
const triggerFilePath = path.join(process.cwd(), 'scripts', triggerFile);

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

async function checkDocker() {
  try {
    const version = await runCommand('docker --version');
    const dockerVersion = version.match(/Docker version [\d.]+/)[0];
    console.log('Docker installed:', dockerVersion);
  } catch (err) {
    console.error('Docker is not installed or not available in the PATH');
    process.exit(1);
  }

  try {
    await runCommand('docker ps');
    console.log('Docker is running');
  } catch (err) {
    console.error('Docker is not running');
    process.exit(1);
  }
}

async function checkDockerCompose() {
  try {
    const version = await runCommand('docker-compose version --short');
    console.log('Docker Compose installed:', 'version', version);
  } catch (err) {
    console.error('Docker Compose is not installed or not available in the PATH');
    process.exit(1);
  }
}

async function main() {
  await checkDocker();
  await checkDockerCompose();

  if (!fs.existsSync(triggerFilePath)) {
    console.error(`Trigger file not found: ${triggerFilePath}`);
    process.exit(1);
  }

  try {
    await runCommand(`docker-compose cp "${triggerFilePath}" db:/${triggerFile}`);
    console.log(`Copied ${triggerFilePath} to db:/${triggerFile}`);
  } catch (err) {
    console.error('Failed to copy the trigger file to the container', err);
    process.exit(1);
  }

  try {
    await runCommand(`docker-compose exec db sh -c "MYSQL_PWD=\\$MYSQL_ROOT_PASSWORD mysql \\$MYSQL_DATABASE < ${triggerFile}"`);
    console.log(`Executed ${triggerFile} in the db container`);
  } catch (err) {
    console.error('Failed to execute the trigger file in the container', err);
    process.exit(1);
  }
}

main();
