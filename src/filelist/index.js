const { app } = require('../core');
const { Files, Icons } = require('../services');
const Drops = require('../drops');
let drops, currentDir = app.homeDir;
const sep = app.pathSep;

function itemRenderer (item) {
	const name = item.highlighted ? item.highlighted.name : item.name;
	return `<img class="file-icon" src="${item.img}">
		<span class="file-name">${name}</span>`;
}

function getItemIcon (item) {
	return Icons.get(item).then(img => {
		item.img = img;
		return item;
	});
}

function dataSrc () {
	return Files.readDir(currentDir)
		.then(items => Promise.all(items.map(getItemIcon)));
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

function enterFolder (item) {
	if (item.isDir) gotoDir(item.path);
}

function quickView (item) {
	console.log('quickView', item);
}


function init () {
	drops = new Drops('.file-list', {
		dataSrc,
		itemRenderer,
		valueField: 'path',
		searchInFields: ['name', 'path'],
	});

	drops.on('left', goUp);
	drops.on('right', enterFolder);
	drops.on('space', quickView);

	drops.on('select', item => {
		console.log('rename', item);
	});
}


module.exports = {
	init
};
