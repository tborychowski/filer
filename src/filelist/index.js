const { $, EVENT, helper, dialog } = require('../core');
const { Files, Config, Clipboard } = require('../services');
const Drops = require('../drops');
const Overedit = require('../overedit');
const Breadcrumbs = require('../breadcrumbs');

const sep = helper.pathSep;
let drops, currentDir, showHidden;
let fileNameEditMode = false;

function itemRenderer (item) {
	const name = item.highlighted ? item.highlighted.name : item.name;
	return `<i class="file-icon ${item.cls}"></i>
		<span class="file-name">${name}</span>`;
}


function fileNameValidator (name) {
	let er = '';
	if (/^[0-9a-zA-Z. ()'"!@€£$#%^&*-]+$/.test(name) === false) er = 'Incorrect name';
	const items = drops.getItems().map(i => i.name);
	if (items.includes(name) && name !== fileNameEditMode) er = 'Name already exists';
	if (!er) return true;
	console.log(er);
}

function reload (dir) {
	return drops.reload().then(() => {
		if (dir) drops.highlight(dir);
		$.trigger(EVENT.dir.changed, currentDir);
	});
}

function gotoDir (dir = helper.homeDir, previousDir) {
	if (dir === currentDir) return;
	currentDir = dir;
	Config.set('currentDir', dir);
	Breadcrumbs.set(dir);
	reload(previousDir);
}


function goUp () {
	if (fileNameEditMode) return;
	const ar = currentDir.split(sep);
	const prev = ar.pop();
	gotoDir(ar.join(sep), prev);
}

function enterFolder (e, item) {
	if (fileNameEditMode) return;
	if (item.isDir) {
		if (item.name === '..') goUp();
		else gotoDir(item.path);
	}
	else helper.openFile(item.path);
}


function toggleHidden () {
	if (fileNameEditMode) return;
	showHidden = !showHidden;
	Config.set('showHidden', showHidden);
	reload(drops.getSelectedItem().name);
}


function rename () {
	if (fileNameEditMode) return;
	const item = drops.getSelectedItem();
	if (item.name === '..') return;
	fileNameEditMode = item.name;
	drops.lock();
	Overedit(item.el, { value: item.name, validator: fileNameValidator })
		.on('save', newName => {
			drops.unlock();
			Files
				.rename(item, newName)
				.then(() => reload(newName));
		})
		.on('done', () => { fileNameEditMode = false; });
}


function getNextFolderName () {
	const items = drops.getItems().map(i => i.name).filter(i => i !== '..');
	let i = 1, name = 'New Folder';
	while (items.includes(name)) name = `New Folder (${i++})`;
	return name;
}

function newFolder () {
	if (fileNameEditMode) return;
	const name = getNextFolderName();
	Files
		.mkdir(currentDir, name)
		.then(() => reload(name))
		.then(rename);
}


function doDelete (item) {
	const idx = drops.getSelectedIndex();
	Files
		.rm(item.path)
		.then(() => {
			drops.reload().then(() => {
				const prevItem = drops.getItemByIdx(idx);
				drops.highlight(prevItem.name);
				$.trigger(EVENT.dir.changed, currentDir);
			});
		});

}

function del () {
	if (fileNameEditMode) return;
	const item = drops.getSelectedItem();
	if (item.name === '..') return;
	dialog
		.question({ message: `Delete "${item.name}"?` })
		.then(res => {
			if (res) doDelete(item);
		});
}


function doClipboardAction (action) {
	if (fileNameEditMode) return;
	const items = drops.getSelectedItems(true);
	if (items.length) Clipboard.save({ action, items });
}

function paste () {
	if (fileNameEditMode) return;
	const clip = Clipboard.get();
	const action = (clip.action === 'cut') ? 'move' : clip.action;

	if (typeof Files[action] !== 'function') return console.log('Unknown action:', action);

	Files[action](clip.items, currentDir).then(() => {
		Clipboard.clear();
		reload(drops.getSelectedItem().name);
	});
}



function dropsAction (action) {
	return () => {
		if (!fileNameEditMode && typeof drops[action] === 'function') drops[action]();
	};
}


function init () {
	showHidden = Config.get('showHidden');

	drops = new Drops('.file-list', {
		dataSrc: () => Files.readDir(currentDir, { showHidden }),
		itemRenderer,
		valueField: 'path',
		searchInFields: ['name'],
	});

	drops.on('dblclick', enterFolder);


	drops.on('keydown', (e, item) => {
		if (e.key === 'Backspace') return goUp();
		if (e.key === 'Enter') return enterFolder(e, item);
		console.log('filelist:', e);
	});

	drops.on('change', (e, d) => $.trigger(EVENT.filelist.changed, d)); // update statusbar


	// $.on(EVENT.filelist.undo, undo);
	// $.on(EVENT.filelist.redo, redo);
	$.on(EVENT.filelist.cut, () => doClipboardAction('cut'));
	$.on(EVENT.filelist.copy, () => doClipboardAction('copy'));
	$.on(EVENT.filelist.paste, paste);
	$.on(EVENT.filelist.delete, del);
	$.on(EVENT.filelist.rename, rename);
	$.on(EVENT.filelist.newfolder, newFolder);
	$.on(EVENT.filelist.togglehidden, toggleHidden);
	$.on(EVENT.filelist.select, dropsAction('selectItem'));
	$.on(EVENT.filelist.selectall, dropsAction('selectAll'));
	$.on(EVENT.filelist.unselectall, dropsAction('unselectAll'));
	$.on(EVENT.search.start, dropsAction('onFocus'));

	gotoDir(Config.get('currentDir'));
}


module.exports = {
	init
};
