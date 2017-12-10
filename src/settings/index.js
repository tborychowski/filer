const { $, EVENT, helper } = require('../core');
const FS = require('fs-extra');
const file = `${helper.getUserDataFolder()}/filer-settings.js`;
const JSON5 = require('json5');

const defaults = {
	startupDir: 'auto', // or fixed dir
	openDirInExternalApp: [
		{ name: 'Terminal', icon: 'fa-terminal', cmd: 'open -a Terminal', params: '$dir' }
	]
};


function purgeSettings () {

}

function writeDefaultSettings () {
	FS.writeFileSync(file, JSON5.stringify(defaults, null, '\t'));
	return defaults;
}


function get () {
	return JSON5.parse(FS.readFileSync(file));
}


function init () {
	if (!FS.pathExistsSync(file)) return writeDefaultSettings();

	$.on(EVENT.settings.show, () => helper.openFile(file));
	$.on(EVENT.settings.purge, purgeSettings);
}



module.exports = {
	init,
	get,
};
