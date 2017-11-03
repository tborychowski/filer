const {app, BrowserWindow} = require('electron');
const windowStateKeeper = require('electron-window-state');
const helper = require('./app/core/helper');

let win;
function createWindow () {
	const mainWindowState = windowStateKeeper({ defaultWidth: 1000, defaultHeight: 800 });
	win = new BrowserWindow({
		title: helper.appName,
		icon: __dirname + '/assets/icon.png',
		show: false,
		// titleBarStyle: 'hidden-inset',
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: mainWindowState.width,
		height: mainWindowState.height,
		titleBarStyle: 'hidden',
	});
	win.on('closed', () => win = null);
	win.webContents.on('crashed', () => { win.destroy(); createWindow(); });

	mainWindowState.manage(win);

	win.loadURL(`file://${__dirname}/app/index.html`);
	win.show();
	// win.webContents.openDevTools();
}

app.on('window-all-closed', app.quit);
app.on('ready', createWindow);
