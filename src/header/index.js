const { $, EVENT } = require('../core');

let btnPaste, btnPasteText;

const actionMap = {
	newfolder: () => $.trigger(EVENT.filelist.newfolder),
	newfile: () => $.trigger(EVENT.filelist.newfile),
	openfolder: () => $.trigger(EVENT.filelist.openfolder),
	openterminal: () => $.trigger(EVENT.filelist.openterminal),
	openrepo: () => $.trigger(EVENT.filelist.openrepo),
	copypath: () => $.trigger(EVENT.filelist.copypath),
	copy: () => $.trigger(EVENT.filelist.copy),
	paste: () => $.trigger(EVENT.filelist.paste),
};


function onClick (e) {
	if (e.target && e.target.dataset && e.target.dataset.action) {
		const actionName = e.target.dataset.action;
		if (!actionName) return;
		const fn = actionMap[actionName];
		if (typeof fn === 'function') fn();
	}
}



function onClipboardChanged (clip) {
	const len = clip && clip.length || 0;
	btnPaste[0].disabled = !len;
	btnPasteText.text(len ? len : '');
}




function init () {
	btnPaste = $('.toolbar .btn-paste');
	btnPasteText = btnPaste.find('span');

	document.addEventListener('click', onClick);

	$.on(EVENT.clipboard.changed, onClipboardChanged);
}


module.exports = {
	init,
};
