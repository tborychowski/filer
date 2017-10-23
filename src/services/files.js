const FS = require('fs-extra');
const PATH = require('path');
const naturalSort = require('javascript-natural-sort');
const { app } = require('../core');
const sep = app.pathSep;


const dotRegEx = /^\./;

let CASE_SENSITIVE = false;
let SHOW_HIDDEN = false;

const FILE_TYPES = {
	code: { js: 1, css: 1, html: 1, php: 1, xml: 1, json: 1, ts: 1, sh: 1 },
	image: { png: 1, jpg: 1, jpeg: 1, gif: 1 },
	video: { avi: 1, mpg: 1, mpeg: 1, mp4: 1, mkv: 1, mov: 1 },
	audio: { mp3: 1, flac: 1, wav: 1, mid: 1 },
	archive: { zip: 1, rar: 1, '7z': 1, tar: 1, gz: 1 },
	text: { txt: 1, srt: 1, md: 1, log: 1 },
	pdf: { pdf: 1 },
	word: { doc: 1, docx: 1 },
	excel: { xls: 1, xlsx: 1 },
	powerpoint: { ppt: 1, pptx: 1 },
};


function findFileIcon (ext = '') {
	ext = ext.toLowerCase().substr(1);
	for (let t in FILE_TYPES) if (ext in FILE_TYPES[t]) return `file-${t}-o`;
	return 'file-o';
}


function getIconCls (file) {
	const cls = file.isDir ? 'folder' : findFileIcon(file.ext);
	return `fa fa-${cls}`;
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
