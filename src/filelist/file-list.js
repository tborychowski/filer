const isAlpha = e => (e.keyCode >= 65 && e.keyCode <= 90 && !e.ctrlKey && !e.metaKey);


function FileList (config = {}) {
	if (!(this instanceof FileList)) return new FileList(config);
	const defaults = {
		pathSeparator: '/',
		homeDir: './',
		list: '.filelist',
		input: '.filelist-input',
		searchInFields: ['name'],
		valueField: 'path'
	};
	this.config = Object.assign({}, defaults, config);

	if (!this.config.list) throw new Error('FileList target does not exist!');
	if (typeof this.config.dataSrc !== 'function') throw new Error('Data source missing!');


	this.data = {
		original: [],
		filtered: [],
		selected: [],
	};
	this.dataSrc = this.config.dataSrc;
	this.eventListeners = {
		openFile: [],
		loaded: [],
	};
	this.state = {
		currentDir: this.config.homeDir,
		previousDir: '',
		mode: 'nav',				// nav || filter
		highlightedIndex: 0,
	};

	return this.render().initEvents().load();
}


FileList.prototype.render = function () {
	const c = this.config;
	this.list = (typeof c.list === 'string') ? document.querySelector(c.list) : c.list;
	this.input = (typeof c.input === 'string') ? document.querySelector(c.input) : c.input;
	this.state.rendered = true;
	return this;
};


FileList.prototype.updateList = function () {
	this.list.innerHTML = this.getItemsHtml();
	return this.highlight();
};


FileList.prototype.getItemsHtml = function () {
	return this.data.filtered.map(this.getItemHtml.bind(this)).join('');
};

FileList.prototype.getItemHtml = function (i) {
	if (!i) return '';
	let id = i[this.config.valueField] || '';
	let cls = ['filelist-item'];
	cls.push(i.name === '..' ? 'unselectable' : 'selectable');
	const name = `<i class="file-icon ${i.cls}"></i>
		<span class="file-name">${i.highlighted ? i.highlighted.name : i.name}</span>`;
	return `<div class="${cls.join(' ')}" data-id="${id}">${name}</div>`;
};




// *** EVENTS **************************************************************************************

FileList.prototype.initEvents = function () {
	if (this.input) {
		this.input.addEventListener('focus', this.onFocus.bind(this));
		this.input.addEventListener('blur', this.onBlur.bind(this));
		this.input.addEventListener('input', this.onInput.bind(this));
	}
	this.list.addEventListener('click', this.onClick.bind(this));
	this.list.addEventListener('dblclick', this.openItem.bind(this));
	document.addEventListener('keydown', this.onKeydown.bind(this));
	return this;
};


FileList.prototype.on = function (eventName, cb) {
	if (!this.eventListeners[eventName]) throw new Error(`Event doesnt exist: ${eventName}`);
	this.eventListeners[eventName].push(cb);
	return this;
};


FileList.prototype.triggerEvent = function (event) {
	if (this.eventListeners[event]) {
		const params = [this.getHighlightedItem(), this];
		this.eventListeners[event].forEach(cb => { cb.apply(cb, params); });
	}
	return this;
};



FileList.prototype.getHighlightedItem = function () {
	const item = this.data.filtered[this.state.highlightedIndex];
	item.el = this.getElFromIdx();
	return item;
};


FileList.prototype.gotoDir = function (dir = this.config.homeDir) {
	if (dir === this.state.currentDir) return;
	this.state.currentDir = dir;
	return this.load();
};


FileList.prototype.goUp = function () {
	const ar = this.state.currentDir.split(this.config.pathSeparator);
	this.state.previousDir = ar.pop();
	const newDir = ar.join(this.config.pathSeparator);
	return this.gotoDir(newDir);
};

FileList.prototype.openItem = function () {
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


FileList.prototype.onClick = function (e) {
	const target = e.target.closest('.filelist-item');
	if (!target) return;

	// TODO: if clicked on the highlighted item - trigger rename

	this.state.highlightedIndex = Array.from(target.parentNode.children).indexOf(target);
	return this.unselectAll().highlight();
};


FileList.prototype.onKeydown = function (e) {
	const hasMeta = e.metaKey || e.altKey || e.ctrlKey || e.shiftKey;
	const isNav = this.state.mode === 'nav';
	let key = e.key.toLowerCase();

	if (key === 'escape') {
		this.state.highlightedIndex = 0;
		this.input.blur();
		return this.highlight().clear();
	}
	if (key === 'enter' && !hasMeta) {
		this.input.blur();
		return this.openItem();
	}
	if (key === 'arrowdown') {
		this.input.blur();
		return this.down();
	}
	if (key === 'arrowup') {
		this.input.blur();
		return this.up();
	}

	if (this.state.mode === 'nav') {
		if (key === ' ') return this.selectItem();
		if (key === 'backspace' && !hasMeta) return this.goUp();
		if (key === 'arrowleft') return this.pageUp();
		if (key === 'arrowright') return this.pageDown();
		if (isAlpha(e) && !isNav) return this.input.focus();
	}
};



FileList.prototype.load = function () {
	this.unselectAll();
	this.input.value = '';
	this.input.blur();
	let highlightDir = '..';
	if (this.state.previousDir) highlightDir = this.state.previousDir;
	if (!highlightDir && this.data.filtered.length && this.state.highlightedIndex > 0) {
		highlightDir = this.getItemByIdx(this.state.highlightedIndex).name;
	}
	return this.dataSrc(this.state.currentDir)
		.then(data => {
			this.data.original = data;
			this.data.filtered = Array.from(data);
			return this.updateList().highlight(highlightDir);
		});
};



//*** FILTERING ********************************************************************************
FileList.prototype.clear = function () {
	this.input.value = '';
	return this.filter().updateList();
};


FileList.prototype.filterFunction = function (q, item) {
	if (!this.config.searchInFields || !this.config.searchInFields.length) return false;
	const reg = new RegExp(q.replace(/\s/g, '.*'), 'ig');
	for (let field of this.config.searchInFields) {
		if (reg.test(item[field])) return true;
	}
	return false;
};


// 'item number one'.replace(/(it)(.*)(nu)(.*)(one)/ig, '<b>$1</b>$2 <b>$3</b>$4 <b>$5</b>')
FileList.prototype.highlightFilter = function (q) {
	const qs = '(' + q.trim().replace(/\s/g, ')(.*)(') + ')';
	const reg = new RegExp(qs, 'ig');

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
		this.data.filtered = this.data
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
	return this.triggerEvent('change').down();
};


FileList.prototype.selectAll = function () {
	this.selectedItems = Array.from(this.data.filtered);
	this.list.querySelectorAll('.filelist-item.selectable')
		.forEach(el => el.classList.add('selected'));
	return this.triggerEvent('change');
};

FileList.prototype.unselectAll = function () {
	this.data.selected = [];
	this.list.querySelectorAll('.filelist-item.selected')
		.forEach(el => el.classList.remove('selected'));
	return this.triggerEvent('change');
};

FileList.prototype.highlight = function (name) {
	let idx = this.state.highlightedIndex;
	if (name) idx = this.data.filtered.findIndex(item => item.name === name);
	if (idx === -1) idx = 0;
	this.state.highlightedIndex = idx;
	this.list
		.querySelectorAll('.filelist-item')
		.forEach(i => { i.classList.remove('highlighted'); });
	const el = this.getElFromIdx(idx);
	if (el) {
		el.classList.add('highlighted');
		el.scrollIntoViewIfNeeded();
	}
	return this;
};


FileList.prototype.getItems = function () {
	return this.data.original.filter(i => i.name !== '..');
};

FileList.prototype.getFilteredItems = function () {
	return this.data.filtered.filter(i => i.name !== '..');
};


FileList.prototype.getItemByIdx = function (idx) {
	if (idx >= this.data.filtered.length) idx = this.data.filtered.length - 1;
	if (idx < 0) idx = 0;
	return this.data.filtered[idx];
};


FileList.prototype.injectEmptyRowAfter = function (name = 'new item') {
	const el = this.getElFromIdx();
	el.classList.remove('highlighted');
	el.insertAdjacentHTML('afterend', this.getItemHtml({name}));
	return el.nextElementSibling;
};


if (typeof module === 'object') module.exports = FileList;

