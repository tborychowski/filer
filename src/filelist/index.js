const { $, EVENT, helper, dialog, config } = require('../core');
const { Files, Clipboard } = require('../services');
// const ListView = require('./list-view');
// const ListEdit = require('./list-edit');
const FileList = require('./file-list');

let flist;


// function fileNameValidator (name) {
// 	if (!Files.isNameValid(name)) return 'Incorrect name';
// 	if (listView.getItems().map(i => i.name).includes(name)) return 'Name already exists';
// 	return true;
// }





// function rename () {
// 	if (fileNameEditMode) return;
// 	const item = listView.getSelectedItem();
// 	if (item.name === '..') return;
// 	fileNameEditMode = item.name;
// 	listView.lock();
// 	ListEdit(item.el, { value: item.name, validator: fileNameValidator })
// 		.on('save', newName => {
// 			listView.unlock();
// 			Files
// 				.rename(item, newName)
// 				.then(() => reload(newName));
// 		})
// 		.on('done', () => { fileNameEditMode = false; });
// }


// function newItem (action = 'mkdir') {
// 	if (fileNameEditMode) return;
// 	const name = getNextName(action === 'mkdir' ? 'Folder' : 'File');
// 	const el = listView.injectEmptyRowAfter(name);
// 	fileNameEditMode = name;
// 	listView.lock();

// 	ListEdit(el, { value: name, validator: fileNameValidator })
// 		.on('save', newName => {
// 			Files[action](currentDir, newName).then(() => reload(newName));
// 		})
// 		.on('cancel', () => reload());
// }



// function doClipboardAction (action) {
// 	if (fileNameEditMode) return;
// 	const items = listView.getSelectedItems(true);
// 	if (items.length) Clipboard.save({ action, items });
// }


// function paste () {
// 	if (fileNameEditMode) return;
// 	const clip = Clipboard.get();
// 	const action = (clip.action === 'cut') ? 'move' : clip.action;

// 	if (typeof Files[action] !== 'function') return console.log('Unknown action:', action);

// 	Files[action](clip.items, currentDir).then(() => {
// 		Clipboard.clear();
// 		reload(listView.getSelectedItem().name);
// 	});
// }



function toggleHidden () {
	config.set('showHidden', !config.get('showHidden'));
	flist.load();
}


function del (item = flist.getSelectedItem()) {
	if (item.name === '..') return;
	dialog
		.question({ message: `Delete "${item.name}"?` })
		.then(res => {
			if (res === 0) Files.rm(item.path).then(flist.load.bind(flist));
		});
}


function init () {
	flist = FileList({
		dataSrc: dir => Files.readDir(dir, { showHidden: config.get('showHidden') }),
		dir: config.get('currentDir') || helper.homeDir,
		pathSeparator: helper.pathSep,
	});

	flist
		.on('openFile', path => helper.openFile(path))
		.on('change', () => $.trigger(EVENT.filelist.changed, flist))
		.on('dirChange', path => {
			config.set('currentDir', path);
			$.trigger(EVENT.dir.changed, path);
		})
		.on('deleteItem', del)
		.start();


	// $.on(EVENT.filelist.undo, undo);
	// $.on(EVENT.filelist.redo, redo);
	// $.on(EVENT.filelist.cut, () => doClipboardAction('cut'));
	// $.on(EVENT.filelist.copy, () => doClipboardAction('copy'));
	// $.on(EVENT.filelist.paste, paste);
	// $.on(EVENT.filelist.rename, rename);
	// $.on(EVENT.filelist.newfile, () => newItem('mkfile'));
	// $.on(EVENT.filelist.newfolder, () => newItem('mkdir'));
	$.on(EVENT.filelist.delete, del);
	$.on(EVENT.filelist.togglehidden, toggleHidden);
	$.on(EVENT.filelist.select, () => flist.selectItem());
	$.on(EVENT.filelist.selectall, () => flist.selectAll());
	$.on(EVENT.filelist.unselectall, () => flist.unselectAll());
	$.on(EVENT.search.start, () => flist.onFocus());
}


module.exports = {
	init
};
