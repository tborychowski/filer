const {app, BrowserWindow} = require('electron');

let win;
app.on('window-all-closed', app.quit);
app.on('ready', () => {
	win = new BrowserWindow({
		title: 'Filer',
		icon: 'assets/icon.png',
		show: true
	});

	win.loadURL(`file://${__dirname}/index.html`);
	win.show();

	win.webContents.openDevTools();

	win.on('closed', () => (win = null));
});
