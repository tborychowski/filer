const { $, EVENT, helper, dialog, config } = require('../core');
const { Files } = require('../services');
const Clipboard = require('../clipboard');
const FileList = require('./filelist');

let flist;


function copy (e) {
	if (flist.getMode() !== 'nav') return;
	e.preventDefault();
	let items = flist.getSelectedItems();
	if (!items.length) items = [flist.getHighlightedItem()];
	if (items.length) Clipboard.save(items);
}

function paste (e) {
	if (flist.getMode() !== 'nav') return;
	e.preventDefault();
	const clip = Clipboard.get();
	const currentDir = flist.getCurrentDir();
	Files.copy(clip, currentDir)
		.then(() => {
			flist.load();
			Clipboard.clear();
		});
}

function move () {
	const clip = Clipboard.get();
	const currentDir = flist.getCurrentDir();
	Files.move(clip, currentDir)
		.then(() => {
			flist.load();
			Clipboard.clear();
		});
}


function toggleHidden () {
	config.set('showHidden', !config.get('showHidden'));
	flist.load();
}

function quicklook () {
	const item = flist.getHighlightedItem();
	helper.quicklook(item.path, item.name);
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

function del () {
	let items = flist.getSelectedItems();
	if (!items.length) {
		items = [flist.getHighlightedItem()];
		if (items[0].name === '..') return;
	}

	const names = items.map(i => i.name).join('"\n"');
	dialog
		.question({
			message: 'Delete?',
			detail: `"${names}"`,
			buttons: ['Delete', 'No' ]
		})
		.then(res => {
			if (res === 0) Files.rm(items).then(reloadAfterDelete);
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
		.on('newItem', newItem)
		.on('rename', rename)
		.start();


	// $.on(EVENT.filelist.undo, undo);
	// $.on(EVENT.filelist.redo, redo);

	$.on(EVENT.filelist.copy, copy);
	$.on(EVENT.filelist.paste, paste);
	$.on(EVENT.filelist.move, move);

	$.on(EVENT.filelist.delete, del);
	$.on(EVENT.filelist.rename, () => flist.rename());

	$.on(EVENT.filelist.newfile, () => flist.newItem('file'));
	$.on(EVENT.filelist.newfolder, () => flist.newItem('folder'));

	$.on(EVENT.filelist.togglehidden, toggleHidden);
	$.on(EVENT.filelist.quicklook, quicklook);

	$.on(EVENT.filelist.select, () => flist.selectItem());
	$.on(EVENT.filelist.selectall, () => flist.selectAll());
	$.on(EVENT.filelist.unselectall, () => flist.unselectAll());
	$.on(EVENT.search.start, () => flist.onFocus());
}


module.exports = {
	init
};
