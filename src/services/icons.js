// const {app} = require('electron').remote;
const apphelper = require('../core').app;
const FS = require('fs-extra');
const fileIcon = require('file-icon');
const iconsPath = apphelper.getUserDataFolder() + '/icons';


let READY = false, cached;


function get (file) {
	if (!READY) init();

	const destination = `${iconsPath}/${file.name}.png`;
	if (cached.includes(destination)) return Promise.resolve(destination);

	return fileIcon.file(file.path, {size: 64, destination }).then(() => destination);
}



function getClass (file) {
	let cls = '';
	if (file.isDir) cls = 'folder';
	if (file.isFile) cls = 'file-o';

	return Promise.resolve('fa fa-' + cls);
}


function init () {
	if (READY) return;
	FS.ensureDir(iconsPath);
	cached = FS.readdirSync(iconsPath).map(f => `${iconsPath}/${f}`);
	READY = true;
}


module.exports = {
	get,
	getClass,
};
