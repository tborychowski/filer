const { $, EVENT, helper } = require('../core');
const { Git } = require('../services');

const home = helper.homeDir;
let el, gitEl, titleEl, hlItem;



// { branch: 'master', ahead: 0, dirty: 9, untracked: 1, stashes: 0 }
function updateGitStatus (dir) {
	Git.status(dir).then(status => {
		let cls = '', branch = '';
		if (status) {
			cls = (status.ahead || status.dirty || status.untracked) ? 'dirty' : 'clean';
			branch = `(${status.branch})`;
		}
		gitEl.removeClass('dirty clean');
		gitEl.html(branch);
		if (cls) gitEl.addClass(cls);
	});
}



function onListChanged (flist) {
	if (!flist || !flist.getItems().length) return;
	const item = flist.getHighlightedItem();
	hlItem.text(`${item.name}`);
}



function onDirChanged (dir) {
	updateGitStatus(dir);
	titleEl.html(dir.replace(home, '~'));
}



function init () {
	el = $('footer');
	titleEl = el.find('.title');
	gitEl = el.find('.git-status');
	hlItem = el.find('.highlighted-item');


	$.on(EVENT.dir.changed, onDirChanged);					// update git status
	$.on(EVENT.filelist.changed, onListChanged);
}


module.exports = {
	init
};
