const { $ } = require('../core');

let el;


function set (path) {
	el.html(path);
}


function init () {
	el = $('.breadcrumbs');

}

module.exports = {
	init,
	set
};
