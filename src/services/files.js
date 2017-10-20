const FS = require('fs-extra');
const PATH = require('path');
const naturalSort = require('javascript-natural-sort');
const { app } = require('../core');
const sep = app.pathSep;


const dotRegEx = /^\./;

let CASE_SENSITIVE = false;
let SHOW_HIDDEN = false;


// TODO: add more mappings
function getIconCls (file) {
	let cls = '';
	if (file.isDir) cls = 'folder';
	if (file.isFile) cls = 'file-o';
	return 'fa fa-' + cls;
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
	const item = {
		name: file,
		path,
		stats,
		ext: PATH.extname(file),
		isDir: stats.isDirectory(),
		isFile: stats.isFile(),
		isHidden: dotRegEx.test(file),
	};
	item.cls = getIconCls(item);
	return item;
}


function getFilesDetails (dirPath, fileList) {
	fileList = fileList.map(file => getFileDetails(dirPath, file));
	const folders = fileList.filter(f => f.isDir);
	const files = fileList.filter(f => f.isFile);
	return folders.concat(files);
}


// adds ".."
function addFolderUp (dirPath, fileList) {
	if (dirPath !== sep) {
		fileList.unshift({
			name: '..',
			path: dirPath.split(sep).slice(0, -1).join(sep),
			isHidden: false,
			isDir: true,
			unselectable: true
		});
	}
	return fileList;
}

function readDir (path) {
	if (!path) path = '/';
	return FS.readdir(path)
		.then(files => sortFiles(path, files))
		.then(files => getFilesDetails(path, files))
		.then(files => addFolderUp(path, files))
		.catch(console.error.bind(console));
}


module.exports = {
	readDir
};
