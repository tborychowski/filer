const { app } = require('../core');
const { Files, Icons } = require('../services');
const Drops = require('../drops');
let drops, currentDir = app.homeDir;
const sep = app.pathSep;

const keyMap = {
	ArrowLeft: goUp,
	ArrowRight: enterFolder,
	Space: quickView,
	Backspace,
	Enter,
};



function itemRenderer (item) {
	const name = item.highlighted ? item.highlighted.name : item.name;
	// return `<img class="file-icon" src="${item.img}">
	return `<i class="file-icon ${item.cls}"></i>
		<span class="file-name">${name}</span>`;
}

// function getItemIcon (item) {
// 	return Icons.get(item).then(img => {
// 		item.img = img;
// 		return item;
// 	});
// }


function getItemIconCls (item) {
	return Icons.getClass(item).then(cls => {
		item.cls = cls;
		return item;
	});
}

function dataSrc () {
	return Files.readDir(currentDir)
		.then(items => Promise.all(items.map(getItemIconCls)));
}


function gotoDir (dir = app.homeDir, previousDir) {
	currentDir = dir;
	drops.reload().then(() => {
		if (previousDir) drops.select(previousDir);
	});
}




function goUp () {
	const ar = currentDir.split(sep);
	const prev = ar.pop();
	gotoDir(ar.join(sep), prev);
}

function enterFolder (e, item) {
	if (item.isDir) gotoDir(item.path);
}

function quickView (e, item) {
	console.log('quickView', item);
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
}


module.exports = {
	init
};
