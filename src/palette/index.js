const { $, EVENT } = require('../core');
const { History } = require('../services');
const CommandPalette = require('./command-palette');
const Path = require('path');


function getDirMetadata (dir) {
	const path = dir;
	const name = Path.basename(path);
	const accessed_at = +new Date();
	return { name, path, accessed_at };
}



function onDirChanged (dir) {
	History.add(getDirMetadata(dir));
}



function onAction (item) {
	$.trigger(EVENT.filelist.goto, item.path);
}



function init () {
	const palette = new CommandPalette({
		searchInFields: ['name', 'path'],
		dataSrc: () => History.get(),
		sizeContainer: '.filelist-wrapper',
		itemRenderer: ({name, path, highlighted}) => {
			if (highlighted) {
				if (highlighted.name) name = highlighted.name;
				if (highlighted.path) path = highlighted.path;
			}
			return `<div class="item-name">${name}</div>
				<span class="item-sub">${path}</span>`;
		}
	});

	palette
		.on('show', () => $.trigger(EVENT.commandpalette.show))
		.on('hide', () => $.trigger(EVENT.commandpalette.hide))
		.on('action', onAction);

	$.on(EVENT.dir.changed, onDirChanged);
}


module.exports = {
	init
};
