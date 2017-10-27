const { dialog, getCurrentWindow } = require('electron').remote;

function win () {
	const w = getCurrentWindow();
	w.setSheetOffset(38);	// header height
	return w;
}

function error (message = '') {
	dialog.showErrorBox('Error', message);
}


function info ({ title = '', message = '', detail = '' }) {
	dialog.showMessageBox(win(), {
		type: 'info',
		title,
		message,
		detail,
		buttons: [ 'OK' ],
		defaultId: 0,
	});
}


function question ({ title = 'Question', message, detail, buttons = ['Yes', 'No']}) {
	return new Promise(resolve => {
		dialog.showMessageBox(win(), {
			type: 'question',
			title,
			message,
			detail,
			buttons,
			defaultId: 1,
		}, res => resolve(res));
	});
}



module.exports = {
	info,
	error,
	question
};
