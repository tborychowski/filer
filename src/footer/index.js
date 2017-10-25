const { $, EVENT } = require('../core');
const { Git } = require('../services');
const _isEqual = require('lodash.isequal');


let el, elFiles, elSelected, elGit, state;

function getItemsHtml () {
	let items = state.items.all;
	if (state.items.filtered < state.items.all) {
		items = `${state.items.filtered} of ${state.items.all}`;
	}
	return `Items: ${items}`;
}

function getSelectedItemsHtml () {
	if (state.items.selected) return `Selected: ${state.items.selected}`;
	return '';
}


function updateFilesSection () {
	elFiles.html(getItemsHtml());
	elSelected.html(getSelectedItemsHtml());
}


// { branch: 'master', ahead: 0, dirty: 9, untracked: 1, stashes: 0 }
function setGitStatus (status) {
	if (!status) return;
	const cls = (status.ahead || status.dirty || status.untracked) ? 'dirty' : 'clean';
	elGit
		.removeClass('dirty clean')
		.addClass(cls)
		.html(`<i class="fa fa-code-fork"></i>${status.branch}`);
}

function updateGitSection () {
	elGit.html('');
	Git.status(state.dir).then(setGitStatus);
}


function updateState (updates) {
	const newState = Object.assign({}, state, updates);
	if (!_isEqual(state, newState)) state = newState;
	if (updates.items) updateFilesSection();
	if (updates.dir) updateGitSection();
}

function onListChanged (drops) {
	if (!drops || !drops.getItems().length) return;
	const items = {
		all: drops.getItems().length,
		filtered: drops.getFilteredItems().length,
		selected: drops.getSelectedItems().length,
	};
	updateState({ items });
}

function onDirChanged (dir) {
	updateState({ dir });
}

function init () {
	el = $('.statusbar');
	elFiles = el.find('.sbi-files');
	elSelected = el.find('.sbi-selected');
	elGit = el.find('.sbi-git');

	$.on(EVENT.filelist.changed, onListChanged);
	$.on(EVENT.dir.changed, onDirChanged);
}

module.exports = {
	init
};
