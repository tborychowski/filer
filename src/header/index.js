const { $, EVENT } = require('../core');

let el, btnPaste, btnPasteText;

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
	if (e.target.matches('.toolbar-btn')) {
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
	el = $('.toolbar');

	btnPaste = el.find('.btn-paste');
	btnPasteText = btnPaste.find('span');

	el.on('click', onClick);

	$.on(EVENT.clipboard.changed, onClipboardChanged);
}


module.exports = {
	init,
};
