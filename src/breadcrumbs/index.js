const { $, EVENT } = require('../core');

let el;


function onDirChanged (path) {
	el.html(path);
}


function init () {
	el = $('.breadcrumbs');
	$.on(EVENT.dir.changed, onDirChanged);

}

module.exports = {
	init,
};
