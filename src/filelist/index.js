const { $, EVENT, helper, dialog, config } = require('../core');
const { Files, Clipboard } = require('../services');
const ListView = require('./list-view');
const ListEdit = require('./list-edit');

const sep = helper.pathSep;
let listView, currentDir;
let fileNameEditMode = false;

function fileNameValidator (name) {
	let er = '';
	if (/^[0-9a-zA-Z. ()'"!@€£$#%^&*-]+$/.test(name) === false) er = 'Incorrect name';
	const items = listView.getItems().map(i => i.name);
	if (items.includes(name) && name !== fileNameEditMode) er = 'Name already exists';
	if (!er) return true;
	console.log(er);
}

function reload (dir) {
	return listView.reload(dir).then(() => {
		$.trigger(EVENT.dir.changed, currentDir);
	});
}

function gotoDir (dir = helper.homeDir, previousDir) {
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


function getNextFolderName () {
	const items = listView.getItems().map(i => i.name).filter(i => i !== '..');
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


function del () {
	if (fileNameEditMode) return;
	const item = listView.getSelectedItem();
	if (item.name === '..') return;
	dialog
		.question({ message: `Delete "${item.name}"?` })
		.then(res => {
			if (res) Files.rm(item.path).then(() => reload());
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
	$.on(EVENT.filelist.newfolder, newFolder);
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
