const { $ } = require('../core');

const el = $('.breadcrumbs');


function set (path) {
	el.html(path);
}


module.exports = {
	set
};
