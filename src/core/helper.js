const electron = require('electron');
const {clipboard, nativeImage, ipcRenderer } = electron;
const {shell, app, getCurrentWindow} = electron.remote || electron;
const {exec} = require('child_process');
const config = require('./config');
const isDev = require('./isDev');
const _get = require('lodash.get');
const Path = require('path');

const appVersion = app.getVersion();
const homeDir = app.getPath('home');
const pathSep = Path.sep;

let win, pckg = null;

const appId = getPackage('name');
const appName = getPackage('productName', app.getName());
const appRepoUrl = parseGitUrl(getPackage('repository.url'));


const getOpenBrowserCmd = (browser, url) => ({
	darwin: `open -a "${browser}" "${url}"`,
	win32: `"${browser}" "${url}"`,
	linux: `"${browser}" "${url}"`
}[process.platform]);

function openInBrowser (url) {
	const browser = config.get('browser');
	if (!browser) return shell.openExternal(url);
	exec(getOpenBrowserCmd(browser, url), (err, stdout, stderr) => {
		if ((err || stderr) && isDev) console.log(err || stderr);
	});
}


function openInTerminal (dir) {
	exec(`open -a Terminal ${dir}`, (err, stdout, stderr) => {
		if ((err || stderr) && isDev) console.log(err || stderr);
	});
}


function getPackage (key, dflt = '') {
	if (!pckg) {
		// hack to suppres webpack warning
		const path = Path.join('..', '..', 'package.json');
		try { pckg = require(`${path}`); }
		catch (e) { pckg = null; }
	}
	if (key) return _get(pckg || {}, key, dflt);
	return pckg || {};
}

function parseGitUrl (url) {
	url = url.toString().trim().replace(/\.git$/, '');
	// reformat git-url of type: git@github.com:org/name to https://github.com/org/name
	if (url.indexOf('git@') === 0) url = url.replace(':', '/').replace(/^git@/, 'https://');
	return url;
}

const getUserDataFolder = () => app.getPath('userData');
const copyToClipboard = (txt) => clipboard.writeText(txt);
const openFolder = (path) => shell.openExternal(`file://${path}`);
const openFile = (path) => shell.openItem(path);

const openSettingsFolder = () => openFolder(getUserDataFolder());
const openChangelog = ver => {
	openInBrowser(`${appRepoUrl}/releases/${ver ? `tag/v${ver}` : 'latest'}`);
};

function quicklook (path, name) {
	getWin().previewFile(path, name);
}

function setBadge (text = 0) {
	text = parseInt(text, 10);
	if (process.platform !== 'win32') app.setBadgeCount(text);
	else {														// yep, this is for windows...
		if (text === 0) return getWin().setOverlayIcon(null, '');
		const canvas = document.createElement('canvas');
		canvas.height = 140;
		canvas.width = 140;
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = 'red';
		ctx.beginPath();
		ctx.ellipse(70, 70, 70, 70, 0, 0, 2 * Math.PI);
		ctx.fill();
		ctx.textAlign = 'center';
		ctx.fillStyle = 'white';
		if (text > 99) {
			ctx.font = '75px sans-serif';
			ctx.fillText(text, 70, 98);
		}
		else if (text.length > 9) {
			ctx.font = '100px sans-serif';
			ctx.fillText(text, 70, 105);
		}
		else {
			ctx.font = '125px sans-serif';
			ctx.fillText(text, 70, 112);
		}
		let img = nativeImage.createFromDataURL(canvas.toDataURL());
		getWin().setOverlayIcon(img, text);
	}
}

function setDockProgress (percent = -1) {
	getWin().setProgressBar(percent > 0 ? percent / 100 : percent);
}


function getWin () {
	if (!win) win = getCurrentWindow();
	return win;
}

function init (components, path = '../') {
	document.title = appName;
	components.forEach(c => {
		const m = require(path + c);
		if (m && m.init) m.init();
	});

	ipcRenderer.on('window', (ev, name) => {
		if (name === 'blur') document.body.classList.add('inactive');
		else if (name === 'focus') document.body.classList.remove('inactive');
	});

	window.focus();
}


module.exports = {
	appId,
	appName,
	appVersion,
	appRepoUrl,
	openInBrowser,
	openInTerminal,
	copyToClipboard,
	openFolder,
	openFile,
	openSettingsFolder,
	getUserDataFolder,
	setBadge,
	setDockProgress,
	openChangelog,
	parseGitUrl,
	quicklook,
	homeDir,
	pathSep,
	init
};
