const FS = require('fs-extra');
const PATH = require('path');
const OS = require('os');
const naturalSort = require('javascript-natural-sort');
const fileIcon = require('file-icon');
const fileIcons = require('file-icons-js');


const homedir = OS.homedir();
const dotRegEx = /^\./;

let CASE_SENSITIVE = false;
let SHOW_HIDDEN = true;




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


function sortFiles (dirPath, fileList) {
	if (!Array.isArray(fileList)) return [];

	const isNotHidden = name => !dotRegEx.test(name);

	naturalSort.insensitive = !CASE_SENSITIVE;
	if (!SHOW_HIDDEN) fileList = fileList.filter(isNotHidden);
	return fileList.sort(naturalSort);
}


function getFileDetails (dirPath, file) {
	const path = PATH.join(dirPath, file);
	const stats = FS.lstatSync(path);
	return {
		name: file,
		path,
		stats,
		ext: PATH.extname(file),
		isDir: stats.isDirectory(),
		isFile: stats.isFile(),
		isHidden: dotRegEx.test(file)
	};
}


function getFilesDetails (dirPath, fileList) {
	fileList = fileList.map(file => getFileDetails(dirPath, file));
	const folders = fileList.filter(f => f.isDir);
	const files = fileList.filter(f => f.isFile);
	return folders.concat(files);
}


function readDir (path = homedir) {
	return FS.readdir(path)
		.then(files => sortFiles(path, files))
		.then(files => getFilesDetails(path, files))
		.catch(console.error.bind(console));
}


// Add caching
function getFileHtml (file) {
	return fileIcon.buffer(file.path, {size: 22})
		.then(bufToDataURI)
		.then(img => `<li class="file-item">
			<img class="file-icon" src="${img}">
			<span class="file-name">${file.name}</span>
		</li>`);
}

// leave as a backup
function getFileHtml2 (file) {
	const cls = fileIcons.getClass(file.name);
	return Promise.resolve(
		`<li class="file-item">
			<i class="file-icon ${cls}"></i>
			<span class="file-name">${file.name}</span>
		</li>`);
}

function printFiles (files) {
	const filesHtml = files.map(getFileHtml);
	return Promise.all(filesHtml)
		.then(html => {
			document.querySelector('.list').innerHTML = html.join('');
		});
}

readDir().then(printFiles);
