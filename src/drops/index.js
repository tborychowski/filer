
function Drops (target, config = { valueField: 'name' }) {
	if (!(this instanceof Drops)) return new Drops(target, config);
	if (typeof target === 'string') target = document.querySelector(target);
	if (!target) throw new Error('Drops target does not exist!');

	this.target = target;
	this.input = null;
	this.list = null;
	this.config = config;
	this.filteredData = [];
	this.dataSrc = config.dataSrc || (() => Promise.resolve([]));
	this.eventListeners = {
		select: [],
		search: [],
	};
	this.state = {
		rendered: false,
		focused: false,
		selectedIndex: 0,
		selectedItem: null,
		oldValue: ''
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



Drops.prototype.load = function () {
	if (typeof this.dataSrc !== 'function') return Promise.reject('Data source missing!');
	const q = this.input && this.input.value || '';
	return this.dataSrc(q).then(data => {
		if (data) this.data = data;
	});
};

Drops.prototype.getItemHtml = function (i) {
	if (!i) return '';
	let name = i.name, id = i[this.config.valueField] || '';
	if (typeof this.config.itemRenderer === 'function') name = this.config.itemRenderer(i);
	return `<div class="drops-list-item" data-id="${id}">${name}</div>`;
};


Drops.prototype.getItemsHtml = function () {
	return this.filteredData.map(this.getItemHtml.bind(this)).join('');
};


Drops.prototype.getHtml = function () {
	return `<div class="drops">
		<input type="text" class="drops-input" value="${this.value || ''}" tabindex="1">
		<div class="drops-list">${this.getItemsHtml()}</div>
	</div>`;
};


Drops.prototype.render = function () {
	this.target.innerHTML = this.getHtml();
	this.input = this.target.querySelector('.drops-input');
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



Drops.prototype.initEvents = function () {
	if (!this.input) return this;
	this.input.addEventListener('focus', this.onFocus.bind(this));
	this.input.addEventListener('input', this.onInput.bind(this));
	this.input.addEventListener('keydown', this.onKeydown.bind(this));
	this.input.addEventListener('keypress', this.onKeypress.bind(this));
	this.target.addEventListener('click', this.onClick.bind(this));
};


Drops.prototype.onClick = function (e) {
	const target = e.target.closest('.drops-list-item');
	if (!target) return;
	this.state.selectedIndex = Array.from(target.parentNode.children).indexOf(target);
	return this.selectItem();
};

Drops.prototype.onFocus = function () {
	this.input.select();
	this.state.oldValue = this.input.value;
	this.state.focused = true;
	return this;
};


Drops.prototype.onInput = function () {
	this.load().then(() => {
		return this.filter().updateList();
	});
};


Drops.prototype.onEsc = function () {
	if (this.state.selectedIndex > -1) {
		this.state.selectedIndex = 0;
		return this.highlight();
	}
	return this.clear();
};


Drops.prototype.onKeydown = function (e) {
	let key = e.key;
	if (key === 'Tab' && e.shiftKey) key = 'ShiftTab';
	const fnmap = {
		Tab: this.down.bind(this),
		ShiftTab: this.up.bind(this),
		ArrowDown: this.down.bind(this),
		ArrowUp: this.up.bind(this),
		Escape: this.onEsc.bind(this),
	};
	const fn = fnmap[key];
	if (typeof fn === 'function') {
		e.preventDefault();
		fn();
	}
};


Drops.prototype.onKeypress = function (e) {
	if (e.key === 'Enter') {
		e.preventDefault();
		this.selectItem.call(this);
	}
};


Drops.prototype.triggerEvent = function (eventName, params) {
	this.eventListeners[eventName].forEach(cb => { cb.apply(cb, params); });
	return this;
};




//*** FILTERING ********************************************************************************
Drops.prototype.clear = function () {
	if (this.input.value === this.state.oldValue || this.state.oldValue === null) return this;
	this.input.value = this.state.oldValue || '';
	this.input.select();
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


Drops.prototype.highlight = function () {
	const idx = this.state.selectedIndex;
	this.list
		.querySelectorAll('.drops-list-item')
		.forEach(i => { i.classList.remove('selected'); });
	let selected;
	if (idx > -1) selected = this.list.querySelector(`.drops-list-item:nth-child(${idx + 1})`);
	if (selected) {
		selected.classList.add('selected');
		selected.scrollIntoViewIfNeeded();
	}

	if (idx > -1) this.input.value = this.filteredData[idx][this.config.valueField];

	return this;
};


Drops.prototype.selectItem = function (item) {
	if (item) {
		const idx = this.filteredData.indexOf(item);
		if (idx > -1) this.state.selectedIndex = idx;
	}
	if (this.state.selectedIndex > -1) {
		this.state.selectedItem = this.filteredData[this.state.selectedIndex];
		const val = this.filteredData[this.state.selectedIndex][this.config.valueField];
		this.input.value = val;
		// if (val) this.filter().updateList();
		this.triggerEvent('select', [ this.state.selectedItem ]);
		this.highlight();
	}
	else {
		this.triggerEvent('search', [ this.input.value ]);
	}
	return this;
};



//*** API ******************************************************************************************

Object.defineProperties(Drops.prototype, {

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
			this.state.oldValue = val;
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




if (typeof module === 'object') module.exports = Drops;

