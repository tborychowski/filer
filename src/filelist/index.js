const { $, EVENT, helper, dialog, config } = require('../core');
const { Files, Git, FileWatcher } = require('../services');
const Clipboard = require('../clipboard');
const FileList = require('./filelist');
const Settings = require('../settings');

let flist, watcher;


function copyPath () {
	const dir = flist.getCurrentDir();
	helper.copyToClipboard(dir);
	$.trigger(EVENT.toast.info, `Copied: <em>${dir}</em>`);
}


function open (what) {
	const dir = flist.getCurrentDir();
	if (what === 'folder') helper.openFolder(dir);
	else if (what === 'terminal') helper.openInTerminal(dir);
	else if (what === 'repo') {
		const url = Git.getRepoUrl(dir);
		if (url) helper.openInBrowser(url);
		else $.trigger(EVENT.toast.warning, 'This is not a Git repository');
	}
}


function copy (e) {
	if (flist.getMode() !== 'nav') return;
	if (e) e.preventDefault();
	let items = flist.getSelectedItems();
	if (!items.length) {
		const item = flist.getHighlightedItem();
		if (item.name !== '..') items = [item];
	}
	if (items.length) Clipboard.save(items);
}

function paste (e) {
	if (flist.getMode() !== 'nav') return;
	if (e) e.preventDefault();
	const clip = Clipboard.get();
	const currentDir = flist.getCurrentDir();
	Files.copy(clip, currentDir)
		.then(() => {
			flist.load();
			Clipboard.clear();
		});
}

function move () {
	if (flist.getMode() !== 'nav') return;
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
	if (flist.getMode() !== 'nav') return;
	const item = flist.getHighlightedItem();
	helper.quicklook(item.path, item.name);
}


function newItem (type, newName) {
	if (flist.getMode() !== 'nav') return;
	const action = type === 'folder' ? 'mkdir' : 'mkfile';
	const currentDir = flist.getCurrentDir();
	Files[action](currentDir, newName).then(() => flist.load(newName));
}

function rename (newName, item) {
	if (flist.getMode() !== 'nav') return;
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
	const settings = Settings.get();
	let startDir = config.get('currentDir') || helper.homeDir;
	if (settings.startDir && settings.startDir !== 'auto') startDir = settings.startDir;
	startDir = Files.getExistingDir(startDir);

	flist = FileList({
		dataSrc: dir => Files.readDir(dir, { showHidden: config.get('showHidden') }),
		dir: startDir, pathSeparator: helper.pathSep,
	})
		.on('openFile', path => helper.openFile(path))
		.on('change', () => $.trigger(EVENT.filelist.changed, flist))
		.on('dirChange', path => {
			config.set('currentDir', path);
			watcher.update(path);
			$.trigger(EVENT.dir.changed, path);
		})
		.on('newItem', newItem)
		.on('rename', rename);

	setTimeout(() => flist.start(), 300);

	watcher = FileWatcher(startDir)
		.on('change', reloadAfterDelete);


	// $.on(EVENT.filelist.undo, undo);
	// $.on(EVENT.filelist.redo, redo);

	$.on(EVENT.filelist.copy, copy);
	$.on(EVENT.filelist.paste, paste);
	$.on(EVENT.filelist.move, move);

	$.on(EVENT.filelist.togglehidden, toggleHidden);
	$.on(EVENT.filelist.quicklook, quicklook);

	$.on(EVENT.filelist.delete, del);
	$.on(EVENT.filelist.rename, () => flist.rename());
	$.on(EVENT.filelist.newfile, () => flist.newItem('file'));
	$.on(EVENT.filelist.newfolder, () => flist.newItem('folder'));
	$.on(EVENT.filelist.select, () => flist.selectItem());
	$.on(EVENT.filelist.selectall, () => flist.selectAll());
	$.on(EVENT.filelist.unselectall, () => flist.unselectAll());
	$.on(EVENT.search.start, () => flist.onFocus());


	$.on(EVENT.filelist.openfolder, () => open('folder'));
	$.on(EVENT.filelist.openterminal, () => open('terminal'));
	$.on(EVENT.filelist.openrepo, () => open('repo'));
	$.on(EVENT.filelist.copypath, copyPath);
	$.on(EVENT.filelist.goto, dir => flist.gotoDir(dir));


	$.on(EVENT.commandpalette.show, () => flist.setMode('palette'));
	$.on(EVENT.commandpalette.hide, () => flist.setMode());
}


module.exports = {
	init
};
