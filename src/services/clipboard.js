const { $, EVENT } = require('../core');

let clip = {};


function get () {
	return clip;
}

function save (data = {}) {
	clip = data;
	$.trigger(EVENT.clipboard.changed, clip);
}


module.exports = {
	get,
	save,
	clear: () => save(),
};
