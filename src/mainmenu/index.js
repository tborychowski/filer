const { Menu } = require('electron').remote;
const { $, EVENT, helper } = require('../core');

const option = (label, accelerator, event) => {
	return { label, accelerator, click: () => $.trigger(event) };
};

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
			{ role: 'undo' },
			{ role: 'redo' },
			{ type: 'separator' },

			option('Cut', 'CmdOrCtrl+X', EVENT.filelist.cut),
			option('Copy', 'CmdOrCtrl+C', EVENT.filelist.copy),
			option('Paste', 'CmdOrCtrl+V', EVENT.filelist.paste),
			option('Delete', 'CmdOrCtrl+Backspace', EVENT.filelist.delete),
			{ type: 'separator' },

			option('Rename', 'CmdOrCtrl+Enter', EVENT.filelist.rename),
			{ type: 'separator' },

			option('Select', 'Space', EVENT.filelist.select),
			option('Select All', 'CmdOrCtrl+A', EVENT.filelist.selectall),
			option('Deselect All', 'CmdOrCtrl+Shift+A', EVENT.filelist.unselectall),
			{ type: 'separator' },
			option('Find', 'CmdOrCtrl+F', EVENT.search.start),
		]
	},
	{
		label: 'View',
		submenu: [
			{ role: 'reload' },
			{ type: 'separator' },
			{ role: 'togglefullscreen' }
		]
	},
	{
		role: 'window',
		submenu: [
			{ role: 'minimize' },
			{ role: 'close' }
		]
	},
	{
		label: 'Dev',
		submenu: [
			{ role: 'toggledevtools' },
			{ type: 'separator' },
			option('Purge Settings & Caches', 'CmdOrCtrl+Shift+Backspace', EVENT.settings.purge),
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



function init () {
	const menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);
}


module.exports = {
	init
};
