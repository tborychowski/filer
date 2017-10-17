const { $ } = require('../core');
const Files = require('./files');
const Icons = require('./icons');

const appEl = $('#app');


function getFileHtml (file) {
	return Icons.get(file)
		.then(img => {
			return `<li class="file-item">
					<img class="file-icon" src="${img}">
					<span class="file-name">${file.name}</span>
				</li>`;
		});
}


function getHtml (files) {
	const filesHtml = files.map(getFileHtml);
	return Promise.all(filesHtml).then(html => html.join(''));
}



function init () {
	Files
		.readDir()
		.then(getHtml)
		.then(html => {
			appEl.html(`<ul class="list">${html}</ul>`);
		});
}


module.exports = {
	init
};
