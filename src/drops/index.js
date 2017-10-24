const { $ } = require('../core');


function Drops (target, config = { valueField: 'name' }) {
	if (!(this instanceof Drops)) return new Drops(target, config);
	if (typeof target === 'string') target = document.querySelector(target);
	if (!target) throw new Error('Drops target does not exist!');

	this.target = target;
	this.input = null;
	this.list = null;
	this.config = config;
	this.filteredData = [];
	this.selectedItems = [];	// selected items
	this.dataSrc = config.dataSrc || (() => Promise.resolve([]));
	this.eventListeners = {
		keydown: [],
		dblclick: [],
		click: [],
	};
	this.state = {
		focused: false,
		rendered: false,
		selectedIndex: 0,
		selectedItem: null,		// highlighted item
	};

	let _data = config.data || [];
	Object.defineProperty(this, 'data', {
		enumerable: true,
		get: () => _data,
		set: data => {
			_data = data;
			this.filter().updateList();
		}
	});

	// this.load().then(this.filter);
	return this.render().initEvents();
}



Drops.prototype.load = function () {
	if (typeof this.dataSrc !== 'function') return Promise.reject('Data source missing!');
	const q = this.input && this.input.value || '';
	return this.dataSrc(q).then(data => {
		if (data) this.data = data;
	});
};

Drops.prototype.getItemHtml = function (i) {
	if (!i) return '';
	let name = i.name;
	let id = i[this.config.valueField] || '';
	let cls = ['drops-list-item'];
	cls.push(i.unselectable ? 'unselectable' : 'selectable');
	if (typeof this.config.itemRenderer === 'function') name = this.config.itemRenderer(i);
	return `<div class="${cls.join(' ')}" data-id="${id}">${name}</div>`;
};


Drops.prototype.getItemsHtml = function () {
	return this.filteredData.map(this.getItemHtml.bind(this)).join('');
};


Drops.prototype.getHtml = function () {
	return `<div class="drops"><div class="drops-list">${this.getItemsHtml()}</div></div>`;
};


Drops.prototype.render = function () {
	this.target.innerHTML = this.getHtml();
	this.input = document.querySelector('.search-input');
	this.list = this.target.querySelector('.drops-list');
	this.state.rendered = true;
	return this;
};


Drops.prototype.getItemHeight = function () {
	const item = this.list.querySelector('.drops-list-item');
	if (!item) return 0;
	const listDisplay = this.list.style.display;
	this.list.style.display = 'block';
	const itemH = item.getBoundingClientRect().height;
	this.list.style.display = listDisplay;
	return itemH;
};


Drops.prototype.updateList = function () {
	if (!this.list) return this;
	this.list.innerHTML = this.getItemsHtml();

	const itemH = this.getItemHeight();
	let maxH = this.config.maxHeight || 10;
	let datlen = this.filteredData.length;
	if (datlen && datlen < maxH) maxH = datlen;
	const h = itemH * maxH + 20;
	this.list.style.height = `${h}px`;

	return this.highlight();
};




// *** EVENTS **************************************************************************************
Drops.prototype.initEvents = function () {
	if (!this.input) return this;
	this.input.addEventListener('focus', this.onFocus.bind(this));
	this.input.addEventListener('blur', this.onBlur.bind(this));
	this.input.addEventListener('input', this.onInput.bind(this));
	this.target.addEventListener('click', this.onClick.bind(this));
	this.target.addEventListener('dblclick', e => this.triggerEvent(e));
	document.addEventListener('keydown', this.onKeydown.bind(this));
};


Drops.prototype.onKeydown = function (e) {
	const hasMeta = e.metaKey || e.altKey || e.ctrlKey || e.shiftKey;
	const navMode = !this.state.focused;
	let key = e.key.toLowerCase();

	if (key === ' ' && navMode) key = 'space';
	else if (key === 'backspace' && navMode && !hasMeta) key = 'backspace1';
	else if (key === 'enter' && !hasMeta) key = 'enter1';

	const fnmap = {
		escape     : () => this.onEsc(),
		space      : () => this.selectItem(),
		arrowdown  : () => this.down(),
		arrowup    : () => this.up(),
		arrowleft  : navMode ? () => this.pageUp() : null,
		arrowright : navMode ? () => this.pageDown(e) : null,
		backspace1 : () => this.triggerEvent(e),
		enter1     : () => this.triggerEvent(e),
	};

	if (typeof fnmap[key] === 'function') {
		e.preventDefault();
		if (!this.input.value) this.input.blur();
		return fnmap[key]();
	}

	if ($.isAlpha(e) && navMode) return this.input.focus();
};


Drops.prototype.onClick = function (e) {
	const target = e.target.closest('.drops-list-item');
	if (!target) return;
	this.state.selectedIndex = Array.from(target.parentNode.children).indexOf(target);
	return this.unselectAll().highlight();
};


Drops.prototype.onFocus = function () {
	this.input.select();
	this.state.focused = true;
	return this;
};

Drops.prototype.onBlur = function () {
	this.state.focused = false;
	return this;
};


Drops.prototype.onInput = function () {
	this.filter().updateList();
};


Drops.prototype.onEsc = function () {
	this.state.selectedIndex = 0;
	this.input.blur();
	return this.highlight().clear();
};



Drops.prototype.triggerEvent = function (event, params) {
	if (!params) {
		this.state.selectedItem = this.filteredData[this.state.selectedIndex];
		params = [this.state.selectedItem];
	}
	params = [event].concat(params);
	if (this.eventListeners[event.type]) {
		this.eventListeners[event.type].forEach(cb => { cb.apply(cb, params); });
	}
	return this;
};








//*** FILTERING ********************************************************************************
Drops.prototype.clear = function () {
	this.input.value = '';
	return this.filter().updateList();
};


Drops.prototype.filterFunction = function (q, i) {
	if (!this.config.searchInFields || !this.config.searchInFields.length) return false;
	const reg = new RegExp(q.replace(/\s/g, '.*'), 'ig');
	for (let f of this.config.searchInFields) {
		if (reg.test(i[f])) return true;
	}
	return false;
};


// 'item number one'.replace(/(it)(.*)(nu)(.*)(one)/ig, '<b>$1</b>$2 <b>$3</b>$4 <b>$5</b>')
Drops.prototype.highlightFilter = function (q) {
	const qs = '(' + q.trim().replace(/\s/g, ')(.*)(') + ')';
	const reg = new RegExp(qs, 'ig');

	let n = 1, len = qs.split(')(').length + 1, repl = '';
	for (; n < len; n++) repl += n % 2 ? `<b>$${n}</b>` : `$${n}`;

	return i => {
		const newI = Object.assign({ highlighted: {} }, i);
		if (this.config.searchInFields) {
			this.config.searchInFields.forEach(f => {
				if (!newI[f]) return;
				newI.highlighted[f] = newI[f].replace(reg, repl);
			});
		}
		return newI;
	};
};


Drops.prototype.filter = function () {
	const q = this.input && this.input.value || '';
	if (!this.data) return this;
	if (!q) this.filteredData = Array.from(this.data);
	else {
		const hlfilter = this.highlightFilter(q);
		this.filteredData = this.data
			.filter(this.filterFunction.bind(this, q))
			.map(hlfilter);
	}
	if (q && this.filteredData.length) this.state.selectedIndex = 0;
	return this;
};
//*** FILTERING ********************************************************************************




Drops.prototype.up = function () {
	if (this.state.selectedIndex > 0) this.state.selectedIndex--;
	return this.highlight();
};


Drops.prototype.down = function () {
	if (this.state.selectedIndex < this.filteredData.length - 1) this.state.selectedIndex++;
	return this.highlight();
};


Drops.prototype.pageUp = function () {
	if (this.state.selectedIndex > 0) this.state.selectedIndex = 0;
	return this.highlight();
};


Drops.prototype.pageDown = function () {
	if (this.state.selectedIndex < this.filteredData.length - 1) {
		this.state.selectedIndex = this.filteredData.length - 1;
	}
	return this.highlight();
};




Drops.prototype.getSelectedItems = function () {
	return this.selectedItems;
};

Drops.prototype.getElFromIdx = function (idx) {
	if (idx > -1) return this.list.querySelector(`.drops-list-item:nth-child(${idx + 1})`);
};


Drops.prototype.selectItem = function () {
	if (this.state.focused) return;

	const item = this.filteredData[this.state.selectedIndex];
	this.state.selectedItem = item;
	const el = this.getElFromIdx(this.state.selectedIndex);
	const selIdx = this.selectedItems.indexOf(item);

	if (item.unselectable) return;
	if (selIdx > -1) {								// unselect
		this.selectedItems.splice(selIdx, 1);
		el.classList.remove('selected');
	}
	else {											// select
		this.selectedItems.push(item);
		el.classList.add('selected');
	}
	return this.down();
};


Drops.prototype.selectAll = function () {
	this.selectedItems = Array.from(this.filteredData);
	this.list.querySelectorAll('.drops-list-item.selectable')
		.forEach(el => el.classList.add('selected'));
	return this;
};

Drops.prototype.unselectAll = function () {
	this.selectedItems = [];
	this.list.querySelectorAll('.drops-list-item.selected')
		.forEach(el => el.classList.remove('selected'));
	return this;
};


Drops.prototype.toggleSelectAll = function (e) {
	if (!e.metaKey) return;
	if (e.shiftKey) return this.unselectAll();
	return this.selectAll();
};



Drops.prototype.on = function (eventName, cb) {
	if (!this.eventListeners[eventName]) throw new Error(`Event doesnt exist: ${eventName}`);
	this.eventListeners[eventName].push(cb);
	return this;
};


Drops.prototype.reload = function () {
	this.unselectAll();
	this.state.selectedIndex = 0;
	this.input.value = '';
	this.input.blur();
	return this.load();
};


Drops.prototype.highlight = function (name) {
	if (name) {
		this.state.selectedIndex = this.filteredData.findIndex(item => item.name === name);
	}

	const idx = this.state.selectedIndex;
	this.list
		.querySelectorAll('.drops-list-item')
		.forEach(i => { i.classList.remove('highlighted'); });
	let selected = this.getElFromIdx(idx);
	if (selected) {
		selected.classList.add('highlighted');
		selected.scrollIntoViewIfNeeded();
	}
	return this;
};



if (typeof module === 'object') module.exports = Drops;

