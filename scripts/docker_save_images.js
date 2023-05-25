const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const targetDir = 'target';
const webImage = 'standardnotes/web:latest';
const serverImage = 'standardnotes/server:latest';
const webTar = path.join(targetDir, 'standardnotes_web.image.docker.tar');
const serverTar = path.join(targetDir, 'standardnotes_server.image.docker.tar');

const config = {
  reminder: 'Please make sure to copy to central notes folder `components/notes/resources/initialize/`.'
};

// Check if Docker is installed and running
exec('docker info', (error) => {
  if (error) {
    console.error('Docker is not installed or running. Please install and start Docker before running this script.');
    process.exit(1);
  }

  // Create target directory if not exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
  }

  // Remove old images before saving new ones
  removeFileIfExists(webTar, () => {
    removeFileIfExists(serverTar, () => {
      saveImages();
    });
  });
});

function saveImages() {
  // Save Docker images
  console.log(`Saving ${webImage}...`);
  exec(`docker save ${webImage} > ${webTar}`, (error) => {
    if (error) {
      console.error(`Error saving web image: ${error}`);
      return;
    }
    displayFileSize(webTar, () => {
      checkCompletion();
    });
  });

  console.log(`Saving ${serverImage}...`);
  exec(`docker save ${serverImage} > ${serverTar}`, (error) => {
    if (error) {
      console.error(`Error saving server image: ${error}`);
      return;
    }
    displayFileSize(serverTar, () => {
      checkCompletion();
    });
  });
}

function removeFileIfExists(filePath, callback) {
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      callback();
      return;
    }
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error removing file: ${err}`);
        return;
      }
      callback();
    });
  });
}

let completedTasks = 0;

function checkCompletion() {
  completedTasks++;
  if (completedTasks === 2) {
    console.log(config.reminder);
  }
}

// Display file size in human readable format and calculate SHA-256 checksum
function displayFileSize(filePath, callback) {
  fs.stat(filePath, (error, stats) => {
    if (error) {
      console.error(`Error reading file size: ${error}`);
      return;
    }
    const fileSize = stats.size;
    const humanReadableSize = formatBytes(fileSize);
    getChecksum(filePath, (checksum) => {
      console.log(`${filePath}: ${humanReadableSize} (SHA-256: ${checksum})`);
      callback();
    });
  });
}

// Function to calculate SHA-256 checksum
function getChecksum(filePath, callback) {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath);
  
  stream.on('data', (data) => {
    hash.update(data);
  });

  stream.on('end', () => {
    const digest = hash.digest('hex');
    callback(digest);
  });
}

// Function to format bytes to human readable format
function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
