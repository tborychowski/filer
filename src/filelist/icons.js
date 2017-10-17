const { app } = require('../core');

const fileIcon = require('file-icon');
// const fileIcons = require('file-icons-js');

const iconsPath = app.getUserDataFolder() + '/icons/';


function bufToDataURI (buf) {
	const string = buf.toString('base64');
	const limit = parseInt(string.length / 50, 10);
	const lines = [];
	lines.push('data:image/png;base64,');
	for (let i = 1; i <= limit; i++) {
		lines.push(string.substring((i - 1) * 50, i * 50));
	}
	if (string.length > limit * 50) {
		lines.push(string.substring(limit * 50, string.length));
	}
	return lines.join('\n');
}

// leave as a backup
// function getFileHtml2 (file) {
// 	const cls = fileIcons.getClass(file.name);
// 	return Promise.resolve(
// 		`<li class="file-item">
// 			<i class="file-icon ${cls}"></i>
// 			<span class="file-name">${file.name}</span>
// 		</li>`);
// }



function get (path) {
	return fileIcon.file(path, {size: 64, dest: iconsPath });
}



module.exports = {
	get
};
