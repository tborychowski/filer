const { $, EVENT } = require('../core');
const CommandPalette = require('./command-palette');
const data = [
	{ id: 0, name: 'item 0', path: 'subtext for item 0' },
	{ id: 1, name: 'item 1', path: 'subtext for item 1' },
	{ id: 2, name: 'item 2', path: 'subtext for item 2' },
	{ id: 3, name: 'item 3', path: 'subtext for item 3' },
	{ id: 4, name: 'item 4', path: 'subtext for item 4' },
	{ id: 5, name: 'item 5', path: 'subtext for item 5' },
	{ id: 6, name: 'item 6', path: 'subtext for item 6' },
	{ id: 7, name: 'item 7', path: 'subtext for item 7' },
	{ id: 8, name: 'item 8', path: 'subtext for item 8' },
	{ id: 9, name: 'item 9', path: 'subtext for item 9' },
];
let palette;


function onAction (action) {
	console.log(action);
}


function init () {

	palette = new CommandPalette({
		searchInFields: ['name', 'path'],
		dataSrc: () => Promise.resolve(data),
		itemRenderer: ({name, path, highlighted}) => {
			if (highlighted) {
				if (highlighted.name) name = highlighted.name;
				if (highlighted.path) path = highlighted.path;
			}
			return `<div class="item-name">${name}</div><span class="item-sub">${path}</span>`;

		}
	});

	palette
		.on('show', () => $.trigger(EVENT.commandpalette.show))
		.on('hide', () => $.trigger(EVENT.commandpalette.hide))
		.on('action', item => onAction(item.name));
}


module.exports = {
	init
};
