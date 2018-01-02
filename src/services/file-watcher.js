const PathWatcher = require('pathwatcher');


function FileWatcher (path) {
	if (!(this instanceof FileWatcher)) return new FileWatcher(path);
	this.eventListeners = { change: [] };
	this.path = path;
	return this.start();
}


FileWatcher.prototype.start = function () {
	this.watcher = PathWatcher.watch(this.path, this.pathChanged.bind(this));
	return this;
};


FileWatcher.prototype.pathChanged = function (ev, path) {
	if (this.pathChangedDebouncer) clearTimeout(this.pathChangedDebouncer);
	this.pathChangedDebouncer = setTimeout(this.triggerEvent.bind(this, 'change', ev, path), 200);
};


FileWatcher.prototype.stop = function () {
	if (this.watcher) this.watcher.close();
	return this;
};



FileWatcher.prototype.update = function (path) {
	if (this.updateDebouncer) clearTimeout(this.updateDebouncer);
	this.updateDebouncer = setTimeout(this._update.bind(this, path), 1000);
};

FileWatcher.prototype._update = function (path) {
	this.path = path;
	return this.stop().start();
};



FileWatcher.prototype.on = function (event, cb) {
	if (!this.eventListeners[event]) throw new Error(`Event doesnt exist: ${event}`);
	this.eventListeners[event].push(cb);
	return this;
};

FileWatcher.prototype.triggerEvent = function (event, ...params) {
	if (this.eventListeners[event]) {
		this.eventListeners[event].forEach(cb => { cb.apply(cb, params); });
	}
	return this;
};



module.exports = FileWatcher;
