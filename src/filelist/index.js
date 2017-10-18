// const { $ } = require('../core');
const Drops = require('../drops');
const Files = require('./files');
const Icons = require('./icons');

function itemRenderer (item) {
	return `<img class="file-icon" src="${item.img}">
		<span class="file-name">${item.name}</span>`;
}

function getItemIcon (item) {
	return Icons.get(item).then(img => {
		item.img = img;
		return item;
	});
}

function dataSrc (/*val*/) {
	return Files.readDir().then(items => Promise.all(items.map(getItemIcon)));

}


function init () {
	new Drops('.file-list', {
		dataSrc,
		itemRenderer,
		valueField: 'path',
		searchInFields: ['name', 'path'],
	});
}


module.exports = {
	init
};
