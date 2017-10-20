const { $, app } = require('../core');
const { Files } = require('../services');
const Drops = require('../drops');
const sep = app.pathSep;
let drops, currentDir, currentPathEl;


function itemRenderer (item) {
	const name = item.highlighted ? item.highlighted.name : item.name;
	return `<i class="file-icon ${item.cls}"></i>
		<span class="file-name">${name}</span>`;
}


function dataSrc () {
	return Files.readDir(currentDir);
}


function gotoDir (dir = app.homeDir, previousDir) {
	if (dir === currentDir) return;


	// console.log(dir, currentDir)
	// if ".." - then highlight the previous folder also!

	currentDir = dir;
	currentPathEl.html(dir);
	drops.reload().then(() => {
		if (previousDir) drops.highlight(previousDir);
	});
}


function openFile (path) {
	app.openFile(path);
}

function goUp () {
	const ar = currentDir.split(sep);
	const prev = ar.pop();
	gotoDir(ar.join(sep), prev);
}

function enterFolder (e, item) {
	if (item.isDir) gotoDir(item.path);
	else openFile(item.path);
}

function Enter (e, item) {
	if (e.metaKey) console.log('rename', item);
	else enterFolder(e, item);
}

function Backspace (e, item) {
	if (e.metaKey) console.log('delete', item);
	else goUp();
}


function init () {
	currentPathEl = $('.current-path');
	drops = new Drops('.file-list', {
		dataSrc,
		itemRenderer,
		valueField: 'path',
		searchInFields: ['name', 'path'],
	});

	drops.on('dblclick', enterFolder);


	drops.on('keydown', (e, item) => {
		const key = e.key.toLowerCase();
		if (key === 'backspace') return Backspace(e, item);
		if (key === 'enter') return Enter(e, item);
		console.log('filelist:', e);
	});

	gotoDir();
}


module.exports = {
	init
};
