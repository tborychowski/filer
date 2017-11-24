const { $, EVENT } = require('../core');

const TOASTH = '-56px';


function getWrapper () {
	let el = $('.toast-wrapper');
	if (!el.length) el = $('<div class="toast-wrapper"></div>').appendTo(document.body);
	return el;
}


function Toast (msg = '', type = 'info') {
	this.toast = $(`<div class="toast toast-${type}">${msg}</div>`)
		.appendTo(getWrapper())
		.on('click', () => this.hide(0));
	return this.show();
}


Toast.prototype.show = function () {
	this.toast
		.animate(
			{opacity: 0, marginBottom: TOASTH, transform: 'scale(0.6)'},
			{opacity: 1, marginBottom: 0, transform: 'scale(1)'}
		)
		.then(() => this.hide());
	return this;
};

Toast.prototype._hide = function () {
	this.toast
		.animate(
			{opacity: 1, marginBottom: 0, transform: 'scale(1)'},
			{opacity: 0, marginBottom: TOASTH, transform: 'scale(0.6)'}
		)
		.then(() => this.toast.remove());
};


Toast.prototype.hide = function (delay = 2000) {
	if (this.timer) clearTimeout(this.timer);
	this.timer = setTimeout(this._hide.bind(this), delay);
	return this;
};



function init () {
	$.on(EVENT.toast.info, msg => new Toast(msg, 'info'));
	$.on(EVENT.toast.warning, msg => new Toast(msg, 'warning'));
	$.on(EVENT.toast.error, msg => new Toast(msg, 'error'));

}


module.exports = {
	init,
};
