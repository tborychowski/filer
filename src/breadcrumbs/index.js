const { $, EVENT, helper } = require('../core');

const home = helper.homeDir;
let el;


function onDirChanged (path) {
	path = path.replace(home, '~');
	el.html(path);
}


function init () {
	el = $('.breadcrumbs');
	$.on(EVENT.dir.changed, onDirChanged);

}

module.exports = {
	init,
};
