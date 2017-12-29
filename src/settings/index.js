const { $, EVENT, helper } = require('../core');
const { Files } = require('../services');
const FS = require('fs-extra');
const file = `${helper.getUserDataFolder()}/filer-settings.js`;
const JSON5 = require('json5');

const defaults = {
	startDir: 'auto', // or fixed dir
	customButtons: [
		{ name: 'Terminal', icon: 'fa-terminal', cmd: 'open -a Terminal $dir' }
	]
};


function purgeSettings () {
	FS.removeSync(file);
	writeDefaultSettings();
}


function writeDefaultSettings () {
	FS.writeFileSync(file, JSON5.stringify(defaults, null, '\t'));
	return defaults;
}


function onSettingsUpdated () {
	$.trigger(EVENT.settings.updated);
}


function get () {
	try {
		const json = FS.readFileSync(file);
		return JSON5.parse(json);
	}
	catch (e) {
		return {};
	}
}


function init () {
	if (!FS.pathExistsSync(file)) return writeDefaultSettings();

	const watcher = Files.FileWatcher(file);
	watcher.on('change', onSettingsUpdated);


	$.on(EVENT.settings.show, () => helper.openFile(file));
	$.on(EVENT.settings.purge, purgeSettings);
}



module.exports = {
	init,
	get,
};
