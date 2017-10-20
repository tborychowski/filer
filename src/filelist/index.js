const { $, app } = require('../core');
const { Files } = require('../services');
const Drops = require('../drops');
const sep = app.pathSep;
let drops, currentDir, currentPathEl;

const keyMap = {
	ArrowLeft: goUp,
	ArrowRight: enterFolder,
	Backspace,
	Enter,
};



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
	currentDir = dir;
	currentPathEl.html(dir);
	drops.reload().then(() => {
		if (previousDir) drops.select(previousDir);
	});
}


function openFile (path) {

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
		let key = e.key;
		if (key === ' ') key = 'Space';
		if (typeof keyMap[key] === 'function') keyMap[key](e, item);
	});

	gotoDir();
}


module.exports = {
	init
};
