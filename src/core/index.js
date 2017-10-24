const config = require('./config');
const EVENT = require('./events');
const helper = require('./helper');
const dialog = require('./dialog');
const isDev = require('./isDev');
const $ = require('./util');

module.exports = {
	$,
	helper,
	config,
	EVENT,
	dialog,
	history,
	isDev,
};
