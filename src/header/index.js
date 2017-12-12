const { $, EVENT, helper } = require('../core');
const Settings = require('../settings');

let btnPaste, btnPasteText, customButtonsEl;
let customButtons;
let currentDir = '';


const actionMap = {
	newfolder: () => $.trigger(EVENT.filelist.newfolder),
	newfile: () => $.trigger(EVENT.filelist.newfile),
	openfolder: () => $.trigger(EVENT.filelist.openfolder),
	openterminal: () => $.trigger(EVENT.filelist.openterminal),
	openrepo: () => $.trigger(EVENT.filelist.openrepo),
	copypath: () => $.trigger(EVENT.filelist.copypath),
	copy: () => $.trigger(EVENT.filelist.copy),
	paste: () => $.trigger(EVENT.filelist.paste),
	custom: customAction,
};


function onClick (e) {
	if (e.target && e.target.dataset && e.target.dataset.action) {
		const actionName = e.target.dataset.action;
		if (!actionName) return;
		const fn = actionMap[actionName];
		if (typeof fn === 'function') fn(e.target);
	}
}



function onClipboardChanged (clip) {
	const len = clip && clip.length || 0;
	btnPaste[0].disabled = !len;
	btnPasteText.text(len ? len : '');
}


function customAction (btn) {
	const name = btn.dataset.name;
	let cmd = customButtons.find(b => b.name === name).cmd;
	if (cmd) cmd = cmd.replace(/\$dir/ig, currentDir);
	if (cmd) helper.run(cmd).then(res => console.log(res));
}


function getButtonHtml (btn) {
	return `<button class="toolbar-btn" title="${btn.name}"
		data-action="custom" data-name="${btn.name}">
			<i class="fa ${btn.icon}"></i>
	</button>`;

}

function initCustomButtons () {
	const settings = Settings.get();
	if (settings) customButtons = settings.customButtons;
	if (!customButtons.length) return;
	const html = customButtons.map(getButtonHtml).join('');
	customButtonsEl.html(html);
}


function init () {
	const toolbar = $('.toolbar');
	btnPaste = toolbar.find('.btn-paste');
	btnPasteText = btnPaste.find('span');
	customButtonsEl = toolbar.find('.toolbar-custom-buttons');

	initCustomButtons();

	document.addEventListener('click', onClick);

	$.on(EVENT.clipboard.changed, onClipboardChanged);
	$.on(EVENT.dir.changed, dir => (currentDir = dir));
	$.on(EVENT.settings.updated, initCustomButtons);
}


module.exports = {
	init,
};
