const { $ } = require('../core');

const el = $('.breadcrumbs');


// TODO: make it nicer and clickable

function set (path) {
	el.html(path);
}


module.exports = {
	set
};
