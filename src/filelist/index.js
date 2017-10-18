// const { $ } = require('../core');
const Drops = require('./drops');
const Files = require('./files');
const Icons = require('./icons');
let drops;

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
	return Files.readDir()
		.then(items => Promise.all(items.map(getItemIcon)));
}


function goUp (item) {
	console.log('up', item);
}

function enterFolder (item) {
	console.log('enter', item);
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
