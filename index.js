const {app, BrowserWindow} = require('electron');
const windowStateKeeper = require('electron-window-state');
const title = require('./package.json').productName;

let win;
const send = (name, val) => win.webContents.send(name, val);

function createWindow () {
	const mainWindowState = windowStateKeeper({ defaultWidth: 1000, defaultHeight: 800 });
	win = new BrowserWindow({
		title,
		icon: __dirname + '/assets/icon.png',
		show: true,
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: mainWindowState.width,
		height: mainWindowState.height,
		titleBarStyle: 'hidden-inset',
		scrollBounce: true,
		webPreferences: {
			experimentalFeatures: true,
			blinkFeatures: 'CSSBackdropFilter'
		}
	});

	console.log('create window');
	win.on('closed', () => win = null);
	win.webContents.on('crashed', () => {
		win.destroy();
		createWindow();
	});

	mainWindowState.manage(win);

	win.loadURL(`file://${__dirname}/app/index.html`);

	// win.webContents.openDevTools();

	win.once('ready-to-show', () => win.show());
	win.on('blur', () => send('window', 'blur'));
	win.on('focus', () => send('window', 'focus'));
}

app.on('window-all-closed', app.quit);
app.on('ready', createWindow);


global.appArgs = process.argv;			// opening URL from CLI
