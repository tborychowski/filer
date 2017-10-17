const config = require('./config');
const EVENT = require('./events');
const app = require('./apphelper');
const dialog = require('./dialog');
const isDev = require('./isDev');
const $ = require('./util');

module.exports = {
	$,
	app,
	config,
	EVENT,
	dialog,
	history,
	isDev,
};
