function FilelistEdit (target, config = {}) {
	if (!(this instanceof FilelistEdit)) return new FilelistEdit(target, config);
	if (typeof target === 'string') target = document.querySelector(target);
	if (!target) throw new Error('Target does not exist!');

	this.target = target;
	this.input = null;
	this.config = config;
	this.value = this.config.value || this.target.innerText;
	this.state = {
		rendered: false
	};
	this.eventListeners = {
		cancel: [],
		save: [],
		done: []
	};
	return this.render();
}


FilelistEdit.prototype.matchSize = function () {
	const targetSize = this.target.getBoundingClientRect();
	this.input.className = this.config.cls || 'filelist-edit-input';
	this.input.style.position = 'absolute';
	this.input.style.width = targetSize.width + 'px';
	this.input.style.height = targetSize.height + 'px';
	this.input.style.top = targetSize.top + 'px';
	this.input.style.left = targetSize.left + 'px';
};


FilelistEdit.prototype.initEvents = function () {
	this.input.addEventListener('keydown', this.onKeyDown.bind(this));
	this.input.addEventListener('blur', this.save.bind(this));
};


FilelistEdit.prototype.render = function () {
	this.input = document.createElement('input');
	this.input.value = this.value;
	this.matchSize();
	this.initEvents();
	document.body.appendChild(this.input);
	this.state.rendered = true;
	this.input.select();
};


FilelistEdit.prototype.destroy = function () {
	this.input.remove();
	this.state.rendered = false;
	this.triggerEvent('done');
	return this;
};


FilelistEdit.prototype.cancel = function () {
	if (!this.state.rendered) return this;
	this.state.rendered = false;		// chrome triggers blur and keydown in the same time
	this.triggerEvent('cancel');
	return this.destroy();
};

FilelistEdit.prototype.save = function () {
	if (!this.state.rendered) return this;
	let name = this.input.value.trim();
	if (typeof this.config.validator === 'function') {
		if (this.config.validator(name) !== true && name !== this.value) {
			this.input.select();
			return this;
		}
	}
	this.state.rendered = false;		// chrome triggers blur and keydown in the same time
	this.triggerEvent('save', name);
	return this.destroy();
};



// fake cut, copy & paste
FilelistEdit.prototype.fakeEvent = function (name) {
	try { document.execCommand(name); }
	catch (e) { console.log('Error with ' + name); }
};


FilelistEdit.prototype.onKeyDown = function (e) {
	e.stopPropagation();

	if (e.metaKey) {
		if (e.key === 'c') this.fakeEvent('copy');
		else if (e.key === 'v') this.fakeEvent('paste');
		else if (e.key === 'x') this.fakeEvent('cut');
	}

	if (e.key === 'Escape') {
		e.preventDefault();
		return this.cancel();
	}
	else if (e.key === 'Enter') {
		e.preventDefault();
		return this.save();
	}
};


FilelistEdit.prototype.triggerEvent = function (eventName, ...params) {
	if (!this.eventListeners[eventName]) return this;
	this.eventListeners[eventName].forEach(cb => { cb.apply(cb, params); });
	return this;
};


FilelistEdit.prototype.on = function (eventName, cb) {
	if (!this.eventListeners[eventName]) throw new Error(`Event doesnt exist: ${eventName}`);
	this.eventListeners[eventName].push(cb);
	return this;
};



if (typeof module === 'object') module.exports = FilelistEdit;
