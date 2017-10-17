const { app } = require('../core');
const FS = require('fs-extra');
const fileIcon = require('file-icon');
const iconsPath = app.getUserDataFolder() + '/icons';

let READY = false, cached;


function get (file) {
	if (!READY) init();

	const destination = `${iconsPath}/${file.name}.png`;

	if (cached.indexOf(destination)) return Promise.resolve(destination);

	return fileIcon.file(file.path, {size: 64, destination })
		.then(() => destination);
}


function init () {
	if (READY) return;
	FS.ensureDir(iconsPath);
	cached = FS.readdirSync(iconsPath).map(f => `${iconsPath}/${f}`);
	READY = true;
}


module.exports = {
	get
};










// const fileIcons = require('file-icons-js');
// function bufToDataURI (buf) {
// 	const string = buf.toString('base64');
// 	const limit = parseInt(string.length / 50, 10);
// 	const lines = [];
// 	lines.push('data:image/png;base64,');
// 	for (let i = 1; i <= limit; i++) {
// 		lines.push(string.substring((i - 1) * 50, i * 50));
// 	}
// 	if (string.length > limit * 50) {
// 		lines.push(string.substring(limit * 50, string.length));
// 	}
// 	return lines.join('\n');
// }

// leave as a backup
// function getFileHtml2 (file) {
// 	const cls = fileIcons.getClass(file.name);
// 	return Promise.resolve(
// 		`<li class="file-item">
// 			<i class="file-icon ${cls}"></i>
// 			<span class="file-name">${file.name}</span>
// 		</li>`);
// }


