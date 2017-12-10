const ListEdit = require('./filelist-edit');
const { $ } = require('../core');


function FileList (config = {}) {
	if (!(this instanceof FileList)) return new FileList(config);
	const defaults = {
		pathSeparator: '/',
		dir: './',
		list: '.filelist',
		input: '.filelist-input',
		searchInFields: ['basename', 'ext'],
		valueField: 'path'
	};
	this.config = Object.assign({}, defaults, config);

	if (!this.config.list) throw new Error('FileList target does not exist!');
	if (typeof this.config.dataSrc !== 'function') throw new Error('Data source missing!');


	this.dataSrc = this.config.dataSrc;
	this.data = {
		original: [],
		filtered: [],
		selected: [],
	};
	this.eventListeners = {
		openFile: [],
		loaded: [],
		dirChange: [],
		change: [],							// anything: filtering, selection, copy, etc.
		newItem: [],
		rename: [],
	};
	this.state = {
		currentDir: '',
		previousDir: '',
		mode: 'nav',						// nav || filter
		highlightedIndex: 0,
	};

	return this.render().initEvents();
}


FileList.prototype.render = function () {
	const c = this.config;
	this.list = (typeof c.list === 'string') ? document.querySelector(c.list) : c.list;
	this.input = (typeof c.input === 'string') ? document.querySelector(c.input) : c.input;
	this.state.rendered = true;
	return this;
};


FileList.prototype.updateList = function (highlightDir) {
	this.list.innerHTML = this.getItemsHtml();
	return this.highlight(highlightDir);
};


FileList.prototype.getItemsHtml = function () {
	return this.data.filtered.map(this.getItemHtml.bind(this)).join('');
};


FileList.prototype.getItemHtml = function (i) {
	if (!i) return '';
	let id = i[this.config.valueField] || '';
	let cls = ['filelist-item'];
	cls.push(i.name === '..' ? 'unselectable' : 'selectable');
	const name = i.highlighted ? i.highlighted.basename : i.basename;
	const ext = i.highlighted ? i.highlighted.ext : i.ext;
	// const size = i.size ? `${i.size}`: '';
	return `<div class="${cls.join(' ')}" data-id="${id}">
			<i class="file-icon ${i.iconClass}"></i>
			<span class="file-name">${name}</span>
			<span class="file-ext">${ext || ''}</span>
		</div>`;
	// <span class="file-size">${size}</span>
};




// *** EVENTS **************************************************************************************

FileList.prototype.initEvents = function () {
	if (this.input) {
		this.input.addEventListener('focus', this.onFocus.bind(this));
		this.input.addEventListener('blur', this.onBlur.bind(this));
		this.input.addEventListener('input', this.onInput.bind(this));
	}
	this.list.addEventListener('mousedown', this.onMouseDown.bind(this));
	this.list.addEventListener('dblclick', this.openItem.bind(this));
	this.list.addEventListener('longclick', this.rename.bind(this));
	document.addEventListener('keydown', this.onKeydown.bind(this));
	return this;
};


FileList.prototype.on = function (eventName, cb) {
	if (!this.eventListeners[eventName]) throw new Error(`Event doesnt exist: ${eventName}`);
	this.eventListeners[eventName].push(cb);
	return this;
};


FileList.prototype.triggerEvent = function (event, ...params) {
	if (this.eventListeners[event]) {
		params = params.concat([this.getHighlightedItem(), this]);
		this.eventListeners[event].forEach(cb => { cb.apply(cb, params); });
	}
	return this;
};


FileList.prototype.start = function () {
	return this.gotoDir();
};

FileList.prototype.gotoDir = function (dir = this.config.dir) {
	if (dir === this.state.currentDir) return;
	this.state.currentDir = dir;
	this.triggerEvent('dirChange', this.state.currentDir);
	this.load();
	return this;
};


FileList.prototype.goUp = function () {
	const ar = this.state.currentDir.split(this.config.pathSeparator);
	this.state.previousDir = ar.pop();
	const newDir = ar.join(this.config.pathSeparator);
	return this.gotoDir(newDir || '/');
};

FileList.prototype.openItem = function () {
	if (this.state.mode !== 'nav') return this;
	const item = this.getHighlightedItem();
	if (item.isDir) {
		if (item.name === '..') this.goUp();
		else this.gotoDir(item.path);
	}
	else this.triggerEvent('openFile', item.path);
};


FileList.prototype.onFocus = function () {
	this.input.select();
	this.state.mode = 'filter';
	return this;
};

FileList.prototype.onBlur = function () {
	this.state.mode = 'nav';
	return this;
};


FileList.prototype.onInput = function () {
	this.filter().updateList();
};


FileList.prototype.onMouseDown = function (e) {
	if (this.state.mode !== 'nav') return this;
	const target = e.target.closest('.filelist-item');
	if (!target) return;
	this.state.highlightedIndex = Array.from(target.parentNode.children).indexOf(target);
	return this.unselectAll().highlight();
};


FileList.prototype.onKeydown = function (e) {
	if (e.key === 'Escape') {
		this.state.highlightedIndex = 0;
		this.input.blur();
		return this.highlight().clear();
	}
	if (e.key === 'Enter') {
		this.input.blur();
		if (!e.metaKey) return this.openItem();
	}
	if (e.key === 'ArrowDown') {
		this.input.blur();
		return this.down();
	}
	if (e.key === 'ArrowUp') {
		this.input.blur();
		return this.up();
	}
	if (this.state.mode === 'nav') {
		if (e.key === ' ') return;
		if (e.key === 'ArrowLeft') return this.pageUp();
		if (e.key === 'ArrowRight') return this.pageDown();
		if (e.key === 'Backspace') if (!e.metaKey) return this.goUp();
		if ($.isAlphaNumeric(e)) return this.input.focus();
	}
};



FileList.prototype.load = function (highlightDir) {
	this.unselectAll();
	this.input.value = '';
	this.input.blur();
	if (this.state.previousDir) {
		highlightDir = this.state.previousDir;
		this.state.previousDir = null;
	}
	if (!highlightDir && this.data.filtered.length && this.state.highlightedIndex > 0) {
		highlightDir = this.getHighlightedItem().name;
		if (!highlightDir) highlightDir = this.getItemByIdx(this.state.highlightedIndex).name;
	}
	return this.dataSrc(this.state.currentDir).then(data => this.setData(data, highlightDir));
};


FileList.prototype.setData = function (data, highlightDir) {
	this.data.original = data;
	this.data.filtered = Array.from(data);
	return this.updateList(highlightDir);
};


//*** FILTERING ********************************************************************************
FileList.prototype.clear = function () {
	this.input.value = '';
	return this.filter().updateList();
};


FileList.prototype.filterFunction = function (q, item) {
	if (!this.config.searchInFields || !this.config.searchInFields.length) return false;
	let reg;
	try { reg = new RegExp(q.replace(/\s/g, '.*'), 'ig'); }
	catch (e) { reg = /.*/ig; }

	for (let field of this.config.searchInFields) {
		if (reg.test(item[field])) return true;
	}
	return false;
};


// 'item number one'.replace(/(it)(.*)(nu)(.*)(one)/ig, '<b>$1</b>$2 <b>$3</b>$4 <b>$5</b>')
FileList.prototype.highlightFilter = function (q) {
	const qs = '(' + q.trim().replace(/\s/g, ')(.*)(') + ')';
	let reg;
	try { reg = new RegExp(qs, 'ig'); }
	catch (e) { reg = /(.*)/ig; }

	let n = 1, len = qs.split(')(').length + 1, repl = '';
	for (; n < len; n++) repl += n % 2 ? `<b>$${n}</b>` : `$${n}`;

	return item => {
		const newI = Object.assign({ highlighted: {} }, item);
		if (this.config.searchInFields) {
			this.config.searchInFields.forEach(field => {
				if (!newI[field]) return;
				newI.highlighted[field] = newI[field].replace(reg, repl);
			});
		}
		return newI;
	};
};


FileList.prototype.filter = function () {
	this.unselectAll();
	const q = this.input && this.input.value || '';
	if (!this.data.original) return this;
	if (!q) this.data.filtered = Array.from(this.data.original);
	else {
		const hlfilter = this.highlightFilter(q);
		this.data.filtered = this.data.original
			.filter(this.filterFunction.bind(this, q))
			.map(hlfilter);
	}
	if (q && this.data.filtered.length) this.state.highlightedIndex = 0;
	return this;
};

//*** FILTERING ********************************************************************************






FileList.prototype.up = function () {
	if (this.state.highlightedIndex > 0) this.state.highlightedIndex--;
	return this.highlight();
};


FileList.prototype.down = function () {
	if (this.state.highlightedIndex < this.data.filtered.length - 1) this.state.highlightedIndex++;
	return this.highlight();
};


FileList.prototype.pageUp = function () {
	if (this.state.highlightedIndex > 0) this.state.highlightedIndex = 0;
	return this.highlight();
};


FileList.prototype.pageDown = function () {
	if (this.state.highlightedIndex < this.data.filtered.length - 1) {
		this.state.highlightedIndex = this.data.filtered.length - 1;
	}
	return this.highlight();
};


FileList.prototype.getElFromIdx = function (idx = this.state.highlightedIndex) {
	if (idx > -1) return this.list.querySelectorAll('.filelist-item')[idx];
};


FileList.prototype.selectItem = function () {
	if (this.state.mode !== 'nav') return this;
	const item = this.getHighlightedItem();
	const el = this.getElFromIdx();
	const selIdx = this.data.selected.indexOf(item);

	if (item.name === '..') return;
	if (selIdx > -1) {								// unselect
		this.data.selected.splice(selIdx, 1);
		el.classList.remove('selected');
	}
	else {											// select
		this.data.selected.push(item);
		el.classList.add('selected');
	}
	return this.down();
};


FileList.prototype.selectAll = function () {
	this.data.selected = Array.from(this.data.filtered);
	this.list.querySelectorAll('.filelist-item.selectable')
		.forEach(el => el.classList.add('selected'));
	return this.triggerEvent('change');
};

FileList.prototype.unselectAll = function () {
	if (!this.data.selected.length) return this;
	this.data.selected = [];
	this.list.querySelectorAll('.filelist-item.selected')
		.forEach(el => el.classList.remove('selected'));
	return this.triggerEvent('change');
};


FileList.prototype.removeHighlight = function () {
	this.list
		.querySelectorAll('.filelist-item')
		.forEach(i => { i.classList.remove('highlighted'); });
};


FileList.prototype.highlight = function (name) {
	let idx = this.state.highlightedIndex;
	if (name) idx = this.data.filtered.findIndex(item => item.name === name);
	if (idx === -1) idx = 0;
	this.state.highlightedIndex = idx;
	this.removeHighlight();
	const el = this.getElFromIdx(idx);
	if (el) {
		el.classList.add('highlighted');
		el.scrollIntoViewIfNeeded();
	}
	return this.triggerEvent('change');
};


FileList.prototype.getCurrentDir = function () {
	return this.state.currentDir;
};

FileList.prototype.getHighlightedIndex = function () {
	return this.state.highlightedIndex;
};

FileList.prototype.getHighlightedItem = function () {
	const item = this.data.filtered[this.state.highlightedIndex];
	if (item) item.el = this.getElFromIdx();
	return item;
};


FileList.prototype.getItems = function () {
	return this.data.original.filter(i => i.name !== '..');
};

FileList.prototype.getFilteredItems = function () {
	return this.data.filtered.filter(i => i.name !== '..');
};

FileList.prototype.getSelectedItems = function () {
	return this.data.selected;
};


FileList.prototype.getItemByIdx = function (idx) {
	if (idx >= this.data.filtered.length) idx = this.data.filtered.length - 1;
	if (idx < 0) idx = 0;
	return this.data.filtered[idx];
};


FileList.prototype.getMode = function () {
	return this.state.mode;
};

FileList.prototype.setMode = function (mode = 'nav') {
	this.state.mode = mode;
	if (mode !== 'nav') this.removeHighlight();
	else this.highlight();
};


FileList.prototype.getNextName = function (itemName = 'Folder') {
	const items = this.getItems().map(i => i.name);
	let i = 1, name = `New ${itemName}`;
	while (items.includes(name)) name = `New ${itemName} (${i++})`;
	return name;
};


FileList.prototype.injectEmptyRowAfter = function (name = 'new item') {
	const el = this.getElFromIdx();
	el.classList.remove('highlighted');
	el.insertAdjacentHTML('afterend', this.getItemHtml({name}));
	return el.nextElementSibling;
};


FileList.prototype.fileNameValidator = function (name) {
	if (name === '.' || name === '..') return 'Incorrect name';
	if (/^[0-9a-zA-Z. ()'"!@€£$#%^&*-]+$/.test(name) === false) return 'Incorrect name';
	if (this.getItems().map(i => i.name).includes(name)) return 'Name already exists';
	return true;
};


FileList.prototype.newItem = function (type = 'folder') {
	if (this.state.mode === 'name-edit') return this;
	const name = this.getNextName(type === 'folder' ? 'Folder' : 'File');
	const el = this.injectEmptyRowAfter(name);
	this.state.mode = 'name-edit';
	ListEdit(el, { value: name, validator: this.fileNameValidator.bind(this) })
		.on('save', newName => {
			this.state.mode = 'nav';
			this.triggerEvent('newItem', type, newName);
		})
		.on('done', () => {
			this.state.mode = 'nav';
			el.remove();
		});
};


FileList.prototype.rename = function () {
	if (this.state.mode === 'name-edit') return this;
	const item = this.getHighlightedItem();
	if (item.name === '..') return;
	this.state.mode = 'name-edit';
	ListEdit(item.el, { value: item.name, validator: this.fileNameValidator.bind(this) })
		.on('save', newName => {
			this.state.mode = 'nav';
			this.triggerEvent('rename', newName);
		})
		.on('done', () => {
			this.state.mode = 'nav';
		});
};



if (typeof module === 'object') module.exports = FileList;

