const path = require('path');
const fs = require('fs');

const patchesDir = "patches"
if (!fs.existsSync(patchesDir)) {
	console.log("Patches directory not found: ", patchesDir);
	console.log("Current working directory: ", require('process').cwd());
	throw `Failed to merge patch files due to missing '${patchesDir}' directory`;
}

let files = fs.readdirSync(patchesDir);
for (let i = 0; i < files.length; i++) {
	if (fs.lstatSync(path.join(patchesDir, files[i])).isDirectory()) {
		console.log(`Processing patch module directory: ${files[i]}`);
		processPatchDirectory(files[i]);
	}
}

function processPatchDirectory(moduleName) {
	const filename = fs.readFileSync(path.join(patchesDir, moduleName, "original_patch_filename.txt")).toString();
	let megaPatchWriteStream = fs.createWriteStream(path.join(patchesDir, filename));
	megaPatchWriteStream.setMaxListeners(100);
	
	let files = fs.readdirSync(path.join(patchesDir, moduleName)).sort();
	for (let i = 0; i < files.length; i++) {
		if (files[i].endsWith("_patch")) {
			console.log(`  looking at patch file: ${files[i]}`);
			let singlePatchReadStream = fs.createReadStream(path.join(patchesDir, moduleName, files[i]));
			singlePatchReadStream.pipe(megaPatchWriteStream, { end: false });
		}
	}
}