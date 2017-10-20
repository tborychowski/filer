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
		keydown: [],
		dblclick: [],
		click: [],
	};
	this.state = {
		focused: false,
		rendered: false,
		selectedIndex: 0,
		selectedItem: null,
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
	const metaKeys = ['Meta', 'Alt', 'Control', 'Shift'];
	let key = e.key;

	if (metaKeys.includes(key)) return;
	if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return this.triggerEvent(e);

	if (key === ' ' && !this.state.focused) key = 'Space';
	else if (key === 'Backspace' && !this.state.focused) key = 'Backspace1';

	const fnmap = {
		Escape     : () => this.onEsc(),
		ArrowDown  : () => this.down(),
		ArrowUp    : () => this.up(),
		Space      : () => this.selectItem(),
		ArrowLeft  : () => this.triggerEvent(e),
		ArrowRight : () => this.triggerEvent(e),
		Backspace1 : () => this.triggerEvent(e),
		Enter      : () => this.triggerEvent(e),

	};

	if (typeof fnmap[key] === 'function') {
		e.preventDefault();
		if (!this.input.value) this.input.blur();
		return fnmap[key]();
	}
	this.input.focus();
};


Drops.prototype.onClick = function (e) {
	const target = e.target.closest('.drops-list-item');
	if (!target) return;
	this.state.selectedIndex = Array.from(target.parentNode.children).indexOf(target);
	return this.highlight();
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

	return this;
};


Drops.prototype.selectItem = function () {
	// add to selectedItems array
	// add "selected" class
	// if selected - unselect
	// add API to getSelectedItems
};


// *** API *****************************************************************************************
Object.defineProperties(Drops.prototype, {
	on: {
		enumerable: true,
		value (eventName, cb) {
			if (!this.eventListeners[eventName]) throw new Error(`Event doesnt exist: ${eventName}`);
			this.eventListeners[eventName].push(cb);
			return this;
		}
	},
	reload: {
		value () {
			this.state.selectedIndex = 0;
			this.input.value = '';
			this.input.blur();
			return this.load();
		}
	},
	select: {
		value (name) {
			this.state.selectedIndex = this.filteredData.findIndex(item => item.name === name);
			return this.highlight();
		}
	}
});



if (typeof module === 'object') module.exports = Drops;

