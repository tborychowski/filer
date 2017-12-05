const className = 'command-palette';

function CommandPalette (config) {
	if (!(this instanceof CommandPalette)) return new CommandPalette(config);

	const defaults = { valueField: 'name' };

	this.input = null;
	this.list = null;
	this.config = Object.assign({}, defaults, config);
	this.filteredData = [];
	this.dataSrc = config.dataSrc || (() => Promise.resolve([]));
	this.eventListeners = {
		action: [],
		show: [],
		hide: [],
	};
	this.state = {
		rendered: false,
		open: false,
		focused: false,
		selectedIndex: -1,
		selectedItem: null
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
	this.load().then(this.filter);
	return this.render().initEvents();
}



CommandPalette.prototype.load = function () {
	if (typeof this.dataSrc !== 'function') return Promise.reject('Data source missing!');
	const q = this.input && this.input.value || '';
	return this.dataSrc(q).then(data => {
		if (data) this.data = data;
	});
};


CommandPalette.prototype.getItemHtml = function (i) {
	if (!i) return '';
	let name = i.name, id = i[this.config.valueField] || '';
	if (typeof this.config.itemRenderer === 'function') name = this.config.itemRenderer(i);
	return `<div class="${className}-list-item" data-id="${id}">${name}</div>`;
};


CommandPalette.prototype.getItemsHtml = function () {
	return this.filteredData.map(this.getItemHtml.bind(this)).join('');
};


CommandPalette.prototype.getHtml = function () {
	return `<div class="${className} hidden">
		<input type="text" class="${className}-input" value="${this.value || ''}" tabindex="1">
		<div class="${className}-list">${this.getItemsHtml()}</div>
	</div>`;
};


CommandPalette.prototype.render = function () {
	document.body.insertAdjacentHTML('beforeend', this.getHtml());
	this.el = document.querySelector(`.${className}`);
	this.input = this.el.querySelector(`.${className}-input`);
	this.list = this.el.querySelector(`.${className}-list`);
	this.state.rendered = true;
	return this;
};


CommandPalette.prototype.getItemHeight = function () {
	const item = this.list.querySelector(`.${className}-list-item`);
	if (!item) return 0;
	const listDisplay = this.list.style.display;

	const prevDisplay = this.list.style.display;
	this.el.style.display = 'block';
	const itemH = item.getBoundingClientRect().height;
	this.el.style.display = prevDisplay;

	this.list.style.display = listDisplay;
	return itemH;
};


CommandPalette.prototype.updateList = function () {
	if (!this.list) return this;
	this.list.innerHTML = this.getItemsHtml();

	let h = 0;
	const datlen = this.filteredData.length;
	if (datlen) {
		const itemH = this.getItemHeight();
		let maxItems = this.config.maxItems || 10;
		if (datlen && datlen < maxItems) maxItems = datlen;
		h = itemH * maxItems + 20;
	}
	this.list.style.height = `${h}px`;

	return this.highlight();
};



CommandPalette.prototype.initEvents = function () {
	if (!this.input) return this;
	this.input.addEventListener('focus', this.onFocus.bind(this));
	this.input.addEventListener('input', this.onInput.bind(this));
	this.input.addEventListener('keydown', this.onKeydown.bind(this));
	this.input.addEventListener('keypress', this.onKeypress.bind(this));
	this.el.addEventListener('click', this.onClick.bind(this));
	document.addEventListener('mousedown', this.onDocumentClick.bind(this));
	document.addEventListener('keydown', this.onDocumentKeyDown.bind(this));
};


CommandPalette.prototype.onDocumentKeyDown = function (e) {
	if (e.key === 'p' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
		this.open();
		e.preventDefault();
	}
};

CommandPalette.prototype.onDocumentClick = function (e) {
	if (e.target.closest(`.${className}`)) return;
	this.state.focused = false;
	if (this.state.open) this.close();
};


CommandPalette.prototype.onClick = function (e) {
	const target = e.target.closest(`.${className}-list-item`);
	if (!target) return;
	e.stopPropagation();
	const items = target.parentNode.querySelectorAll(`.${className}-list-item`);
	const idx = Array.from(items).indexOf(target);
	const item = this.filteredData[idx];
	return this.selectItem(item);
};

CommandPalette.prototype.onFocus = function () {
	this.input.select();
	this.state.focused = true;
	return this;
};


CommandPalette.prototype.onInput = function () {
	this.load().then(() => {
		return this.filter().updateList();
	});
};


CommandPalette.prototype.onEsc = function () {
	if (this.input.value) return this.clear();
	if (this.state.open) return this.close();
};


CommandPalette.prototype.onKeydown = function (e) {
	let key = e.key;
	if (key === 'Tab' && e.shiftKey) key = 'ShiftTab';
	const fnmap = {
		Tab: this.state.open ? this.down.bind(this) : null,
		ShiftTab: this.state.open ? this.up.bind(this) : null,
		ArrowDown: this.down.bind(this),
		ArrowUp: this.up.bind(this),
		Escape: this.onEsc.bind(this),
	};
	const fn = fnmap[key];
	if (typeof fn === 'function') {
		e.preventDefault();
		e.stopPropagation();
		fn();
	}
};


CommandPalette.prototype.onKeypress = function (e) {
	if (e.key === 'Enter') {
		e.preventDefault();
		e.stopPropagation();
		this.selectItem.call(this);
	}
};


CommandPalette.prototype.triggerEvent = function (eventName, params) {
	this.eventListeners[eventName].forEach(cb => { cb.apply(cb, params); });
	return this;
};




//*** FILTERING ********************************************************************************
CommandPalette.prototype.clear = function () {
	this.input.value = '';
	this.input.select();
	return this.filter().updateList();
};


CommandPalette.prototype.filterFunction = function (q, i) {
	if (!this.config.searchInFields || !this.config.searchInFields.length) return false;
	const reg = new RegExp(q.replace(/\s/g, '.*'), 'ig');
	for (let f of this.config.searchInFields) {
		if (reg.test(i[f])) return true;
	}
	return false;
};


// 'item number one'.replace(/(it)(.*)(nu)(.*)(one)/ig, '<b>$1</b>$2 <b>$3</b>$4 <b>$5</b>')
CommandPalette.prototype.highlightFilter = function (q) {
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


CommandPalette.prototype.filter = function () {
	const q = this.input && this.input.value || '';
	if (!this.data) return this;
	if (!q) this.filteredData = Array.from(this.data);
	else {
		const hlfilter = this.highlightFilter(q);
		this.filteredData = this.data
			.filter(this.filterFunction.bind(this, q))
			.map(hlfilter);
	}
	this.state.selectedIndex = (q && this.filteredData.length) ? 0 : -1;
	return this;
};
//*** FILTERING ********************************************************************************




CommandPalette.prototype.up = function () {
	this.open();
	if (this.state.selectedIndex > 0) this.state.selectedIndex--;
	return this.highlight();
};


CommandPalette.prototype.down = function () {
	this.open();
	if (this.state.selectedIndex < this.filteredData.length - 1) this.state.selectedIndex++;
	return this.highlight();
};


CommandPalette.prototype.highlight = function () {
	const idx = this.state.selectedIndex;
	this.list
		.querySelectorAll(`.${className}-list-item`)
		.forEach(i => { i.classList.remove('selected'); });
	let selected;
	if (idx > -1) selected = this.list.querySelector(`.${className}-list-item:nth-child(${idx + 1})`);
	if (selected) {
		selected.classList.add('selected');
		selected.scrollIntoViewIfNeeded();
	}

	return this;
};


CommandPalette.prototype.selectItem = function (item) {
	if (item) {
		const idx = this.filteredData.indexOf(item);
		if (idx > -1) this.state.selectedIndex = idx;
	}
	if (this.state.selectedIndex > -1) {
		this.state.selectedItem = this.filteredData[this.state.selectedIndex];
		const val = this.filteredData[this.state.selectedIndex][this.config.valueField];
		this.input.value = val;
		if (val) this.filter().updateList();
		this.triggerEvent('action', [ this.state.selectedItem ]);
	}
	return this.close();
};


CommandPalette.prototype.open = function () {
	if (!this.filteredData.length || this.state.open) return this;
	this.el.classList.remove('hidden');
	this.state.open = true;
	this.input.select();
	this.triggerEvent('show');
	return this;
};


CommandPalette.prototype.close = function () {
	if (!this.state.open) return this;
	this.clear();
	this.state.open = false;
	this.state.selectedIndex = -1;
	this.el.classList.add('hidden');
	this.triggerEvent('hide');
	return this;
};



//*** API ******************************************************************************************

Object.defineProperties(CommandPalette.prototype, {

	selectedItem: {
		enumerable: true,
		get () {
			return this.state.selectedItem;
		}
	},

	blur: {
		value () {
			this.state.focused = false;
		}
	},

	value: {
		enumerable: true,
		get () {
			return this.input ? this.input.value : null;
		},
		set (val) {
			if (!this.input) return this;
			this.input.value = val;
			this.close();
			if (this.state.focused) this.input.select();
			return this.filter().updateList();
		}
	},

	on: {
		enumerable: true,
		value (eventName, cb) {
			if (!this.eventListeners[eventName]) throw new Error(`Event doesnt exist: ${eventName}`);
			this.eventListeners[eventName].push(cb);
			return this;
		}
	},

	focus: {
		enumerable: true,
		value () {
			this.input.focus();
		}
	},

	select: {
		enumerable: true,
		value () {
			if (this.input) this.input.select();
		}
	},

});
//*** API ******************************************************************************************




if (typeof module === 'object') module.exports = CommandPalette;
