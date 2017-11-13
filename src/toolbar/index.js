const { $, EVENT } = require('../core');

let el;
const actionMap = {
	newfolder: () => $.trigger(EVENT.filelist.newfolder),
	newfile: () => $.trigger(EVENT.filelist.newfile),
	openfolder: () => $.trigger(EVENT.filelist.openfolder),
	openterminal: () => $.trigger(EVENT.filelist.openterminal),
	openrepo: () => $.trigger(EVENT.filelist.openrepo),
};


function onClick (e) {
	if (e.target.matches('.toolbar-btn')) {
		const actionName = e.target.dataset.action;
		if (!actionName) return;
		const fn = actionMap[actionName];
		if (typeof fn === 'function') fn();
	}
}


function init () {
	el = $('.toolbar');
	el.on('click', onClick);
}


module.exports = {
	init,
};
