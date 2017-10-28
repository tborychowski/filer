const {shell} = require('electron');
const FS = require('fs-extra');
const Path = require('path');
// const Copy = require('copy');
const Copy = require('recursive-copy');


const naturalSort = require('javascript-natural-sort');
const { helper } = require('../core');
const sep = helper.pathSep;


const dotRegEx = /^\./;

let CASE_SENSITIVE = false;	// for sorting


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

// /some/long/path => /some/long
const dropLastSegment = path => path.split(sep).slice(0, -1).join(sep);


function ifNameValid (name) {
	if (name === '.' || name === '..') return false;
	if (/^[0-9a-zA-Z. ()'"!@€£$#%^&*-]+$/.test(name) === false) return false;
	return true;
}

function findFileIcon (ext = '') {
	ext = ext.toLowerCase().substr(1);
	for (let t in FILE_TYPES) if (ext in FILE_TYPES[t]) return `file-${t}-o`;
	return 'file-o';
}


function getIconCls (type, ext) {
	let cls = (type === 'folder') ? type : findFileIcon(ext);
	return `fa fa-${cls}`;
}


function sortFiles (dirPath, fileList, options) {
	if (!Array.isArray(fileList)) return [];

	const isNotHidden = name => !dotRegEx.test(name);

	naturalSort.insensitive = !CASE_SENSITIVE;
	if (!options.showHidden) fileList = fileList.filter(isNotHidden);
	return fileList.sort(naturalSort);
}


function getFileDetails (parentPath, name) {
	const path = Path.join(parentPath, name);
	const stats = FS.lstatSync(path);
	const isFile = stats.isFile();
	const isDir = stats.isDirectory();
	const type = isDir ? 'folder' : isFile ? 'file' : '';
	const isHidden = dotRegEx.test(name);
	const ext = Path.extname(name);
	const cls = getIconCls(type, ext);
	return { name, path, parentPath, type, isDir, isFile, ext, cls, isHidden };
}


function getFilesDetails (dirPath, fileList) {
	fileList = fileList.map(file => getFileDetails(dirPath, file));
	const folders = fileList.filter(f => f.isDir);
	const files = fileList.filter(f => f.isFile);
	return folders.concat(files);
}


// adds ".."
function addFolderUp (parentPath, fileList) {
	if (parentPath !== sep) {
		fileList.unshift({
			name: '..',
			path: dropLastSegment(parentPath),
			parentPath,
			isHidden: false,
			isDir: true,
			type: 'folder',
			unselectable: true
		});
	}
	return fileList;
}

function readDir (path, options = { showHidden: false }) {
	if (!path) path = '/';
	return FS.readdir(path)
		.then(files => sortFiles(path, files, options))
		.then(files => getFilesDetails(path, files))
		.then(files => addFolderUp(path, files))
		.catch(console.error.bind(console));
}


function rename (item, newName) {
	const newPath = Path.join(item.parentPath, newName);
	// undo: rename(newPath, item.path);
	return FS.rename(item.path, newPath);
}


function mkdir (path, name) {
	return FS.mkdir(Path.join(path, name)).catch(e => console.log(e));
}

function mkfile (path, name) {
	return FS.ensureFile(Path.join(path, name)).catch(e => console.log(e));
}


function rm (path) {
	return Promise.resolve(shell.moveItemToTrash(path));
}


function _copy (op) {
	return Copy(op.src, op.dest, { dot: true })
		// .on(Copy.events.COPY_FILE_START, copyOp => {
		// 	console.info('Copying file ' + copyOp.src + '...');
		// })
		// .on(Copy.events.COPY_FILE_COMPLETE, copyOp => {
		// 	console.info('Copied to ', copyOp);
		// })
		.on(Copy.events.ERROR, err => (op.error = err.code))
		.then(res => (op.res = res, op))
		.catch(() => op);
}


// loop through files and do copy
// - gather failed and loop again
// - if EEXIST - ask to overwrite, rename or cancel


function copy (items, path) {
	const ops = items
		.map(i => ({ src: i.path, dest: path }))
		.map(_copy);


	return Promise.all(ops)
		.then(res => console.log(res));

}




function move (items, path) {
	return Promise.resolve();
}

module.exports = {
	ifNameValid,
	readDir,
	rename,
	mkdir,
	mkfile,
	rm,
	copy,
	move,
};
