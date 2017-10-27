const { $, EVENT, helper, dialog, config } = require('../core');
const { Files, Clipboard } = require('../services');
const ListView = require('./list-view');
const ListEdit = require('./list-edit');

const sep = helper.pathSep;
let listView, currentDir;
let fileNameEditMode = false;

function fileNameValidator (name) {
	if (!Files.ifNameValid(name)) return 'Incorrect name';
	if (listView.getItems().map(i => i.name).includes(name)) return 'Name already exists';
	return true;
}

function reload (dir) {
	fileNameEditMode = false;
	return listView.reload(dir).then(() => {
		$.trigger(EVENT.dir.changed, currentDir);
	});
}

function gotoDir (dir = helper.homeDir, previousDir = false) {
	if (dir === currentDir) return;
	currentDir = dir;
	config.set('currentDir', dir);
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
	config.set('showHidden', !config.get('showHidden'));
	reload(listView.getSelectedItem().name);
}


function rename () {
	if (fileNameEditMode) return;
	const item = listView.getSelectedItem();
	if (item.name === '..') return;
	fileNameEditMode = item.name;
	listView.lock();
	ListEdit(item.el, { value: item.name, validator: fileNameValidator })
		.on('save', newName => {
			listView.unlock();
			Files
				.rename(item, newName)
				.then(() => reload(newName));
		})
		.on('done', () => { fileNameEditMode = false; });
}


function getNextName (itemName = 'Folder') {
	const items = listView.getItems().map(i => i.name).filter(i => i !== '..');
	let i = 1, name = `New ${itemName}`;
	while (items.includes(name)) name = `New ${itemName} (${i++})`;
	return name;
}


function newItem (action = 'mkdir') {
	if (fileNameEditMode) return;
	const name = getNextName(action === 'mkdir' ? 'Folder' : 'File');
	const el = listView.injectEmptyRowAfter(name);
	fileNameEditMode = name;
	listView.lock();

	ListEdit(el, { value: name, validator: fileNameValidator })
		.on('save', newName => {
			Files[action](currentDir, newName).then(() => reload(newName));
		})
		.on('cancel', () => reload());
}


function del () {
	if (fileNameEditMode) return;
	const item = listView.getSelectedItem();
	if (item.name === '..') return;
	dialog
		.question({ message: `Delete "${item.name}"?` })
		.then(res => {
			if (res === 0) Files.rm(item.path).then(() => reload());
		});
}


function doClipboardAction (action) {
	if (fileNameEditMode) return;
	const items = listView.getSelectedItems(true);
	if (items.length) Clipboard.save({ action, items });
}


function paste () {
	if (fileNameEditMode) return;
	const clip = Clipboard.get();
	const action = (clip.action === 'cut') ? 'move' : clip.action;

	if (typeof Files[action] !== 'function') return console.log('Unknown action:', action);

	Files[action](clip.items, currentDir).then(() => {
		Clipboard.clear();
		reload(listView.getSelectedItem().name);
	});
}



function listViewAction (action) {
	return () => {
		if (!fileNameEditMode && typeof listView[action] === 'function') listView[action]();
	};
}


function init () {
	listView = new ListView('.file-list', {
		dataSrc: () => Files.readDir(currentDir, { showHidden: config.get('showHidden') }),
		valueField: 'path',
		searchInFields: ['name'],
	});

	listView.on('dblclick', enterFolder);

	listView.on('keydown', (e, item) => {
		if (e.key === 'Backspace') return goUp();
		if (e.key === 'Enter') return enterFolder(e, item);
		console.log('filelist:', e);
	});

	listView.on('change', (e, d) => $.trigger(EVENT.filelist.changed, d)); // update statusbar


	// $.on(EVENT.filelist.undo, undo);
	// $.on(EVENT.filelist.redo, redo);
	$.on(EVENT.filelist.cut, () => doClipboardAction('cut'));
	$.on(EVENT.filelist.copy, () => doClipboardAction('copy'));
	$.on(EVENT.filelist.paste, paste);
	$.on(EVENT.filelist.delete, del);
	$.on(EVENT.filelist.rename, rename);
	$.on(EVENT.filelist.newfile, () => newItem('mkfile'));
	$.on(EVENT.filelist.newfolder, () => newItem('mkdir'));
	$.on(EVENT.filelist.togglehidden, toggleHidden);
	$.on(EVENT.filelist.select, listViewAction('selectItem'));
	$.on(EVENT.filelist.selectall, listViewAction('selectAll'));
	$.on(EVENT.filelist.unselectall, listViewAction('unselectAll'));
	$.on(EVENT.search.start, listViewAction('onFocus'));

	gotoDir(config.get('currentDir'));
}


module.exports = {
	init
};
