const FS = require('fs-extra');
const PATH = require('path');
const OS = require('os');
const naturalSort = require('javascript-natural-sort');


const homedir = OS.homedir();
const dotRegEx = /^\./;

let CASE_SENSITIVE = false;
let SHOW_HIDDEN = true;


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


module.exports = {
	readDir
};
