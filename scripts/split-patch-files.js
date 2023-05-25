const path = require('path');
const fs = require('fs');
const readline = require('readline');

const patchesDir = "patches"
if (!fs.existsSync(patchesDir)) {
	console.log("Patches directory not found: ", patchesDir);
	console.log("Current working directory: ", require('process').cwd());
	throw `Failed to merge patch files due to missing '${patchesDir}' directory`;
}

let found = false;
var files = fs.readdirSync(patchesDir);
for (var i = 0; i < files.length; i++) {
	if (files[i].endsWith(".patch")) {
		console.log(`Processing patch file: ${files[i]}`);
		processMegaPatchFile(files[i]);
		found = true;
	}
}

if (!found) {
	throw `No patch files found to process in '${path.join(require('process').cwd(), patchesDir)}'!!!`;
}

function processMegaPatchFile(filename) {
	// Assuming format like: standardnotes-app+1.5.11.patch
	const moduleName = filename.split("+")[0];
	fs.rmSync(path.join(patchesDir, moduleName), { recursive: true, force: true });
	fs.mkdirSync(path.join(patchesDir, moduleName), { recursive: true });
	
	// Save off the original patch filename so it can be reassembled later (in combine-patch-files.js)
	fs.writeFile(path.join(patchesDir, moduleName, "original_patch_filename.txt"), filename, function (err) {
		if (err) throw err;
	});
	
	const megaPatchFile = readline.createInterface({
		input: fs.createReadStream(path.join(patchesDir, filename)),
		crlfDelay: Infinity
	});
	
	let output;
	const newFileNeededPrefix = `diff --git a/node_modules/${moduleName}/`
	megaPatchFile.on('line', (line) => {
		if (line.startsWith(newFileNeededPrefix)) {
			// Parse the filepath from the line and make it into a filename (remove/replace path separators)
			let singlePatchFilename = line.substring(newFileNeededPrefix.length, line.lastIndexOf(" "));
			singlePatchFilename = singlePatchFilename.replace(/\//g, "_") + "_patch"; // named "_patch" so patch-package ignores them
			console.log(`Writting to: ${singlePatchFilename}`);
			output = fs.createWriteStream(path.join(patchesDir, moduleName, singlePatchFilename));
		}
		
		if (output) {
			output.write(line + "\n");
		}
		else {
			console.log(`No output stream to write to!!!  Dropping line: ${line}`);
		}
	});
	
	megaPatchFile.on('close', () => {
		console.log(`Finished processing '${filename}'; deleting now.`);
		fs.unlinkSync(path.join(patchesDir, filename));
	});
}