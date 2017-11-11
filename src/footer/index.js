const { $, EVENT } = require('../core');
const { Git } = require('../services');
const _isEqual = require('lodash.isequal');


const separator = '<div class="footer-filler"></div>';
let el;
let state = {
	items: null,
	git: null,
	clip: null
};

function getAllHtml () {
	const items = state.items && state.items.all || 0;
	return `<div class="footer-stats-item" title="All items">
		<i class="fa fa-file-o"></i>${items}</div>`;
}


function getFilteredHtml () {
	const items = state.items && state.items.filtered || 0;
	const all =  state.items && state.items.all || 0;
	if (items >= all) return '';
	return `<div class="footer-stats-item" title="Filtered items">
		<i class="fa fa-filter"></i>${items}</div>`;
}

function getSelectedHtml () {
	const items = state.items && state.items.selected || 0;
	if (!items) return '';
	return `<div class="footer-stats-item" title="Selected items">
		<i class="fa fa-check-square-o"></i>${items}</div>`;
}

function getCopiedHtml () {
	const len = state.clip && state.clip.length;
	if (!len) return '';
	return `<div class="footer-stats-item" title="Remembered items">
		<i class="fa fa-files-o"></i>${len}</div>`;
}



// { branch: 'master', ahead: 0, dirty: 9, untracked: 1, stashes: 0 }
function getGitHtml () {
	const status = state.git;
	if (!status) return '';
	const cls = (status.ahead || status.dirty || status.untracked) ? 'dirty' : 'clean';
	return `<div class="footer-stats-item git-${cls}" title="Git status">
		<i class="fa fa-code-fork"></i>${status.branch}</div>`;
}


function render () {
	el.html(getAllHtml() +
		getFilteredHtml() +
		getSelectedHtml() +
		getCopiedHtml() +
		separator +
		getGitHtml());
}



function updateGitStatus () {
	state.gitStatus = null;
	Git.status(state.dir).then(status => {
		state.git = status;
		render();
	});
}


function updateState (updates) {
	const newState = Object.assign({}, state, updates);
	if (!_isEqual(state, newState)) state = newState;
	if (updates.dir) updateGitStatus();
	else render();
}



function onListChanged (flist) {
	if (!flist || !flist.getItems().length) return;
	const items = {
		all: flist.getItems().length,
		filtered: flist.getFilteredItems().length,
		selected: flist.getSelectedItems().length,
	};
	updateState({ items });
}

function onDirChanged (dir) {
	updateState({ dir });
}

function onClipboardChanged (clip) {
	state.clip = clip;
	updateState({ clip });
}

function init () {
	el = $('.footer-stats');

	$.on(EVENT.filelist.changed, onListChanged);
	$.on(EVENT.dir.changed, onDirChanged);					// update git status
	$.on(EVENT.clipboard.changed, onClipboardChanged);
}

module.exports = {
	init
};
