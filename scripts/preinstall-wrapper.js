#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { createWriteStream } = require('fs');
const { spawn } = require('child_process');

const packageJson = require('../package.json');
const downloadUrl = packageJson['pre-install-depends']['sn-server'];
const targetFolder = './work';
const zipFileName = path.basename(downloadUrl);
const zipFile = path.join(targetFolder, zipFileName);

if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
}

function log(message, type = 'step') {
    const prefix = {
      step: '○',
      success: '●',
      error: '[ERROR]',
    }[type];
  
    console.error(`${new Date().toISOString().replace('T', '_').substring(0, 19)} ${prefix} ${message}`);
  }

const download = (url, filePath) => {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(filePath);

        const downloadWithRedirects = (url) => {
            https.get(url, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    log(`Following redirect to ${response.headers.location}`, 'step');
                    downloadWithRedirects(response.headers.location);
                } else {
                    const totalBytes = parseInt(response.headers['content-length'], 10);
                    let downloadedBytes = 0;
                    let showProgress = true;

                    if (isNaN(totalBytes)) {
                        // console.warn('Unable to determine file size for download progress.');
                        showProgress = false;
                    }

                    response.on('data', (chunk) => {
                        downloadedBytes += chunk.length;
                        if (showProgress) {
                            const percentage = ((downloadedBytes / totalBytes) * 100).toFixed(2);
                            process.stdout.write(`Downloading: ${percentage}%\r`);
                        }
                    });

                    pipeline(response, file, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            log('\nDownload complete.', 'success');
                            resolve(filePath);
                        }
                    });
                }
            }).on('error', (err) => {
                fs.unlinkSync(filePath);
                reject(err);
            });
        };

        downloadWithRedirects(url);
    });
};

const extract = (zipFilePath, targetPath) => {
    return new Promise((resolve, reject) => {
        let command, args;
        if (process.platform === 'win32') {
            command = 'powershell';
            args = ['Expand-Archive', '-LiteralPath', zipFilePath, '-DestinationPath', targetPath];
        } else {
            command = 'unzip';
            args = ['-qq', zipFilePath, '-d', targetPath];
        }

        const unzip = spawn(command, args);
        unzip.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Unzip process exited with code ${code}`));
            }
        });
        unzip.on('error', reject);
    });
};

const renameAndCleanup = () => {
    const folderName = 'server-' + path.parse(zipFileName).name;
    const extractedFolder = path.join(targetFolder, folderName);
    const finalFolder = path.join(targetFolder, 'standardnotes-server');

    if (fs.existsSync(finalFolder)) {
        fs.rmSync(finalFolder, { recursive: true, force: true });
    }

    fs.renameSync(extractedFolder, finalFolder);
    fs.unlinkSync(zipFile);
};

const addMissingVersion = (packageName, version) => {
    const packageJsonPath = path.join(__dirname, `../work/${packageName}/package.json`);
    let rawdata = fs.readFileSync(packageJsonPath);
    let packageJson = JSON.parse(rawdata);

    if (!packageJson.version) {
        const packageJsonKeys = Object.keys(packageJson);
        const authorIndex = packageJsonKeys.indexOf('author');

        // Create a new object to store the reordered package.json properties
        let reorderedPackageJson = {};

        // Add the properties before 'author' to the new object
        for (let i = 0; i <= authorIndex; i++) {
            reorderedPackageJson[packageJsonKeys[i]] = packageJson[packageJsonKeys[i]];
        }

        // Add the 'version' key right after the 'author' key
        reorderedPackageJson.version = version;

        // Add the remaining properties to the new object
        for (let i = authorIndex + 1; i < packageJsonKeys.length; i++) {
            reorderedPackageJson[packageJsonKeys[i]] = packageJson[packageJsonKeys[i]];
        }

        // Write the reordered package.json content to the file
        let data = JSON.stringify(reorderedPackageJson, null, 4);
        fs.writeFileSync(packageJsonPath, data);
        log(`Added missing version ${version} to ${packageJsonPath}`, 'success');
    }
};

(async () => {
    try {
        log(`Downloading file from ${downloadUrl}`, 'step');
        const zipFilePath = await download(downloadUrl, zipFile);
        log(`Downloaded file to ${zipFilePath}`, 'success');

        log(`Extracting file to ${targetFolder}`, 'step');
        await extract(zipFilePath, targetFolder);
        log(`File extracted to ${targetFolder}`, 'success');

        log(`Renaming and cleaning up`, 'step');
        renameAndCleanup();
        log(`Process completed`, 'success');

        // Call the addMissingVersion function
        const packageName = 'standardnotes-server';
        const version = "0.0.1";
        addMissingVersion(packageName, version);
    } catch (err) {
        log(`${err.message}`, 'error');
    }
})();
