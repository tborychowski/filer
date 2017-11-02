const { $, EVENT, helper, dialog, config } = require('../core');
const { Files, Clipboard } = require('../services');
const FileList = require('./filelist');

let flist;


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


function newItem (type, newName) {
	const action = type === 'folder' ? 'mkdir' : 'mkfile';
	const currentDir = flist.getCurrentDir();
	Files[action](currentDir, newName).then(() => flist.load(newName));
}

function rename (newName, item) {
	Files.rename(item, newName).then(() => flist.load(newName));
}


// highlight item with the same index after delete
function reloadAfterDelete () {
	const idx = flist.getHighlightedIndex();
	flist.load().then(() => {
		const item = flist.getItemByIdx(idx);
		flist.highlight(item.name);
	});
}

function del (item = flist.getHighlightedItem()) {
	if (item.name === '..') return;
	dialog
		.question({ message: `Delete "${item.name}"?` })
		.then(res => {
			if (res === 0) Files.rm(item.path).then(reloadAfterDelete);
		});
}


function init () {
	flist = FileList({
		dataSrc: dir => Files.readDir(dir, { showHidden: config.get('showHidden') }),
		dir: config.get('currentDir') || helper.homeDir,
		pathSeparator: helper.pathSep,
	})
		.on('openFile', path => helper.openFile(path))
		.on('change', () => $.trigger(EVENT.filelist.changed, flist))
		.on('dirChange', path => {
			config.set('currentDir', path);
			$.trigger(EVENT.dir.changed, path);
		})
		.on('deleteItem', del)
		.on('newItem', newItem)
		.on('rename', rename)
		.start();


	// $.on(EVENT.filelist.undo, undo);
	// $.on(EVENT.filelist.redo, redo);
	// $.on(EVENT.filelist.cut, () => doClipboardAction('cut'));
	// $.on(EVENT.filelist.copy, () => doClipboardAction('copy'));
	// $.on(EVENT.filelist.paste, paste);
	$.on(EVENT.filelist.rename, () => flist.rename());
	$.on(EVENT.filelist.newfile, () => flist.newItem('file'));
	$.on(EVENT.filelist.newfolder, () => flist.newItem('folder'));
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
