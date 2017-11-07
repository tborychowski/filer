const { Menu } = require('electron').remote;
const { $, EVENT, helper } = require('../core');
const Keyboard = require('mousetrap');		// what a ridiculous name!


const option = (label, accelerator, event) => {
	return { label, accelerator, click: () => $.trigger(event) };
};

let menu;



const menuTemplate = [
	{
		label: helper.appName,
		submenu: [
			{ role: 'about' },
			{ type: 'separator' },
			// { label: 'Check for Updates...', click: () => $.trigger(EVENT.updater.check) },
			// { label: 'Changelog', click: () => helper.openChangelog(helper.appVersion) },
			// { type: 'separator' },

			option('Preferences...', 'CmdOrCtrl+,', EVENT.settings.show),
			{ type: 'separator' },

			{ role: 'services', submenu: [] },
			{ type: 'separator' },

			{ role: 'hide' },
			{ role: 'hideothers' },
			{ role: 'unhide' },
			{ type: 'separator' },

			{ role: 'quit' }
		]
	},
	{
		label: 'Edit',
		submenu: [
			option('Undo', 'CmdOrCtrl+Z', EVENT.filelist.undo),
			option('Redo', 'CmdOrCtrl+Shift+Z', EVENT.filelist.redo),
			{ type: 'separator' },

			{ role: 'cut' },	// these 3 need to stay native so they work in textfields
			{ role: 'copy' },
			{ role: 'paste' },
			option('Move', 'Shift+CmdOrCtrl+V', EVENT.filelist.move),
			{ type: 'separator' },

			option('Delete', 'CmdOrCtrl+Backspace', EVENT.filelist.delete),
			option('Rename', 'CmdOrCtrl+Enter', EVENT.filelist.rename),
			{ type: 'separator' },

			option('New File', 'CmdOrCtrl+M', EVENT.filelist.newfile),
			option('New Folder', 'CmdOrCtrl+N', EVENT.filelist.newfolder),
			{ type: 'separator' },

			option('Select', 'CmdOrCtrl+S', EVENT.filelist.select),
			option('Select All', 'CmdOrCtrl+A', EVENT.filelist.selectall),
			option('Unselect All', 'CmdOrCtrl+Shift+A', EVENT.filelist.unselectall),
			{ type: 'separator' },

			option('Find', 'CmdOrCtrl+F', EVENT.search.start),
		]
	},
	{
		label: 'View',
		submenu: [
			{ role: 'reload' },
			{ type: 'separator' },

			option('Toggle Hidden', 'CmdOrCtrl+.', EVENT.filelist.togglehidden),
			{ type: 'separator' },

			option('Quick Look', 'Space', EVENT.filelist.quicklook),
			{ type: 'separator' },

			{ role: 'togglefullscreen' }
		]
	},
	{
		role: 'windowMenu'
	},
	{
		label: 'Dev',
		submenu: [
			{ role: 'toggledevtools' },
			// { type: 'separator' },
			// option('Purge Settings & Caches', 'CmdOrCtrl+Shift+Backspace', EVENT.settings.purge),
		]
	},
	{
		role: 'help',
		submenu: [
			{
				label: 'Github Repository',
				click: () => helper.openInBrowser(helper.appRepoUrl)
			}
		]
	}
];


// function onClipboardFull () {
// 	menu.getMenuItemById('copyBtn').enabled = true;
// 	menu.getMenuItemById('moveBtn').enabled = true;
// }

// function onClipboardEmpty () {
// 	menu.getMenuItemById('copyBtn').enabled = false;
// 	menu.getMenuItemById('moveBtn').enabled = false;
// }


function initOtherShortcuts () {
	Keyboard
		.bind('meta+c', e => $.trigger(EVENT.filelist.copy, e))
		.bind('meta+v', e => $.trigger(EVENT.filelist.paste, e));
}

function init () {
	menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);
	initOtherShortcuts();

	// $.on(EVENT.clipboard.full, onClipboardFull);
	// $.on(EVENT.clipboard.empty, onClipboardEmpty);
}


module.exports = {
	init
};
