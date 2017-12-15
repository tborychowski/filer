const {shell} = require('electron');
const FS = require('fs-extra');
const Path = require('path');
const PrettyBytes = require('pretty-bytes');
const Copy = require('recursive-copy');
const FileExtMap = require('./file-ext-map.js');
const Chokidar = require('chokidar');


const naturalSort = require('javascript-natural-sort');
const { helper } = require('../core');
const sep = helper.pathSep;

const dotRegEx = /^\./;

let CASE_SENSITIVE = false;	// for sorting


// /some/long/path => /some/long
const dropLastSegment = path => path.split(sep).slice(0, -1).join(sep);


// Monitors for file-system changes (to reload the file-list)
const watcher = {
	instance: null,
	onChangeCallback: () => {},
	options: {
		depth: 0,
		disableGlobbing: true,
		ignoreInitial: true,
		followSymlinks: false,
	},
	start: (dir) => {
		watcher.stop();
		watcher.instance = Chokidar
			.watch(dir, watcher.options)
			.on('raw', (ev, path, details) => watcher.onChangeCallback(ev, path, details));
	},
	stop: () => {
		if (watcher.instance) watcher.instance.close();
		watcher.instance = null;
	}
};



function FileWatcher (file) {
	if (!(this instanceof FileWatcher)) return new FileWatcher(file);
	this.watcher = Chokidar.watch(file, watcher.options);
	this.watcher.on('raw', (event) => {
		if (event === 'modified') this.triggerEvent('change');
	});
	this.eventListeners = { change: [] };
	return this;
}


FileWatcher.prototype.on = function (event, cb) {
	if (!this.eventListeners[event]) throw new Error(`Event doesnt exist: ${event}`);
	this.eventListeners[event].push(cb);
	return this;
};

FileWatcher.prototype.triggerEvent = function (event, ...params) {
	if (this.eventListeners[event]) {
		this.eventListeners[event].forEach(cb => { cb.apply(cb, params); });
	}
	return this;
};


FileWatcher.prototype.stop = function () {
	this.watcher.close();
};








function findFileIcon (ext = '') {
	ext = ext.toLowerCase().substr(1);
	if (FileExtMap[ext]) return `file-${FileExtMap[ext]}-o`;
	return 'file-o';
}


function getIconCls (type, ext) {
	let cls = (type === 'folder') ? type : findFileIcon(ext);
	return `fa fa-${cls}`;
}


function sortFiles (dirPath, fileList) {
	if (!Array.isArray(fileList)) return [];
	naturalSort.insensitive = !CASE_SENSITIVE;
	return fileList.sort(naturalSort);
}


function getFileDetails (parentPath, name) {
	const path = Path.join(parentPath, name);
	const stats = FS.lstatSync(path);
	const isFile = stats.isFile();
	const isDir = stats.isDirectory();
	const type = isDir ? 'folder' : isFile ? 'file' : '';
	const isHidden = dotRegEx.test(name);
	const ext = isFile ? Path.extname(name) : '';
	const basename = Path.basename(name, ext);
	const iconClass = getIconCls(type, ext);
	const size = isFile ? PrettyBytes(stats.size) : '';
	return { name, basename, path, parentPath, type, isDir, isFile, ext, iconClass, isHidden, size };
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
			basename: '..',
			ext: '',
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


function readDir (path, options) {
	watcher.start(path);
	return FS.readdir(path)
		.then(files => sortFiles(path, files, options))
		.then(files => getFilesDetails(path, files))
		.then(files => addFolderUp(path, files))
		.then(files => options.showHidden ? files : files.filter(i => !i.isHidden))
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


function rm (items) {
	const ops = items
		.map(i => i.path)
		.map(shell.moveItemToTrash);
	return Promise.resolve(ops);
}


function _copyItem (op) {
	return Copy(op.src, op.dest, { dot: true })
		// .on(Copy.events.COPY_FILE_START, copyOp => {
		// 	console.info('Copying file ' + copyOp.src + '...');
		// })
		// .on(Copy.events.COPY_FILE_COMPLETE, copyOp => {
		// 	console.info('Copied to ', copyOp);
		// })
		.on(Copy.events.ERROR, err => (op.error = err.code))
		.then(res => res[0])
		.catch(() => op);
}

// loop through files and do copy
// - gather failed and loop again
// - if EEXIST - ask to overwrite, rename or cancel


function copy (items, path) {
	const ops = items
		.map(src => ({ src, dest: Path.join(path, Path.basename(src)) }))
		.map(_copyItem);
	return Promise.all(ops);
}


function move (items, path) {
	return copy(items, path)
		.then(res => {
			if (!res.length) return Promise.resolve([]);
			res = res.map(i => i.src).map(i => FS.remove(i));
			return Promise.all(res);
		});
}


function onChange (cb) {
	if (typeof cb === 'function') watcher.onChangeCallback = cb;
}


module.exports = {
	readDir,
	rename,
	mkdir,
	mkfile,
	rm,
	copy,
	move,
	onChange,
	FileWatcher,
};
