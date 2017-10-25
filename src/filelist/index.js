const { $, EVENT, helper } = require('../core');
const { Files, Config } = require('../services');
const Drops = require('../drops');
const Breadcrumbs = require('../breadcrumbs');
const sep = helper.pathSep;
let drops, currentDir;


function itemRenderer (item) {
	const name = item.highlighted ? item.highlighted.name : item.name;
	return `<i class="file-icon ${item.cls}"></i>
		<span class="file-name">${name}</span>`;
}


function gotoDir (dir = helper.homeDir, previousDir) {
	if (dir === currentDir) return;
	currentDir = dir;
	Config.set('currentDir', dir);
	Breadcrumbs.set(dir);
	drops.reload().then(() => {
		if (previousDir) drops.highlight(previousDir);
		$.trigger(EVENT.dir.changed, currentDir);
	});
}



function goUp () {
	const ar = currentDir.split(sep);
	const prev = ar.pop();
	gotoDir(ar.join(sep), prev);
}

function enterFolder (e, item) {
	if (item.isDir) {
		if (item.name === '..') goUp();
		else gotoDir(item.path);
	}
	else helper.openFile(item.path);
}

function rename (e, item) {
	console.log('rename', item);
}

function del (e, item) {
	console.log('delete', item);
}

function cut () {
	console.log('cut', drops.getSelectedItems());
}

function copy () {
	console.log('copy', drops.getSelectedItems());
}

function paste () {
	console.log('paste', currentDir);
}

function init () {
	drops = new Drops('.file-list', {
		dataSrc: () => Files.readDir(currentDir),
		itemRenderer,
		valueField: 'path',
		searchInFields: ['name', 'path'],
	});

	drops.on('dblclick', enterFolder);


	drops.on('keydown', (e, item) => {
		if (e.key === 'Backspace') return goUp();
		if (e.key === 'Enter') return enterFolder(e, item);
		console.log('filelist:', e);
	});

	drops.on('change', (e, d) => $.trigger(EVENT.filelist.changed, d));


	$.on(EVENT.filelist.cut, cut);
	$.on(EVENT.filelist.copy, copy);
	$.on(EVENT.filelist.paste, paste);
	$.on(EVENT.filelist.delete, del);
	$.on(EVENT.filelist.rename, rename);
	$.on(EVENT.filelist.select, () => drops.selectItem());
	$.on(EVENT.filelist.selectall, () => drops.selectAll());
	$.on(EVENT.filelist.unselectall, () => drops.unselectAll());
	$.on(EVENT.search.start, () => drops.onFocus());

	gotoDir(Config.get('currentDir'));
}


module.exports = {
	init
};
