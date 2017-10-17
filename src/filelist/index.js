const { $ } = require('../core');
const Files = require('./files');
const Icons = require('./icons');

const appEl = $('#app');


async function getFileHtml (file) {
	const img = Icons.get(file.path)
	return `<li class="file-item">
			<img class="file-icon" src="${img}">
			<span class="file-name">${file.name}</span>
		</li>`;
}


function printFiles (files) {
	const filesHtml = files.map(getFileHtml);
	return Promise.all(filesHtml).then(html => html.join(''));
}



function init () {
	Files
		.readDir()
		.then(printFiles)
		.then(html => {
			appEl.innerHTML = `<ul class="list">${html}</ul>`;
		});
}


module.exports = {
	init
};
