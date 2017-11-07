const { $, EVENT } = require('../core');
const C = require('nodobjc');
const Plist = require('plist');

let clip = [], prevCount, pasteboard;


function copyFilesToClipboard(paths) {
	pasteboard('clearContents');
	const filesToCopy = C.NSMutableArray('alloc')('init');
	paths.forEach(path => {
		const string = C.NSString('stringWithUTF8String', path);
		filesToCopy('addObject', C.NSURL('alloc')('initFileURLWithPath', string));
	});
	pasteboard('writeObjects', filesToCopy);
}


function fetch (type) {
	const dt = pasteboard('dataForType', type);
	const str = C.NSString('alloc')('initWithData', dt, 'encoding', C.NSUTF8StringEncoding);
	const plist = str.toString();
	return plist ? Plist.parse(plist) : [];
}


function check () {
	if (pasteboard('changeCount') === prevCount) return;
	prevCount = pasteboard('changeCount');
	// console.log(pb('types'));
	const paths = fetch(C.NSFilenamesPboardType);
	if (paths.length) clipboardFull(paths);
}

function clipboardFull (data) {
	clip = data;
	$.trigger(EVENT.clipboard.changed, clip);					// realistically - to reflect the actual state
	$.trigger(EVENT.clipboard[data.length ? 'full' : 'empty']);	// for visual changes in mainmenu
}





function get () {
	return clip;
}

function save (data = []) {
	data = data.map(i => i.path);
	$.trigger(EVENT.clipboard.changed, data);					// early - to avoid visual delay in footer
	if (data.length) copyFilesToClipboard(data);
}


function init () {
	// hacking because https://github.com/electron/electron/issues/2244
	C.framework('Foundation');
	C.framework('AppKit');
	pasteboard = C.NSPasteboard('generalPasteboard');
	C.NSAutoreleasePool('alloc')('init');
	setInterval(check, 1000);
}



module.exports = {
	init,
	get,
	save,
	clear: () => save(),
};
