const Table = require('./DBTable');
const db = new Table('foldercache', [
	'path TEXT NOT NULL PRIMARY KEY',
	'contents TEXT NOT NULL', // stringified folder contents array
	'timesVisited INTEGER NOT NULL',
	'lastVisitDate INTEGER NOT NULL',
]);


const store = (path, items) => {
	getByPath(path).then((oldRecord = {}) => {
		const contents = JSON.stringify(items);
		const lastVisitDate = +new Date();
		const timesVisited = (oldRecord.timesVisited || 0) + 1;
		return db.add({ path, contents, timesVisited, lastVisitDate });
	});
};


function getByPath(path) {
	return db.getBy('path', path).then(rec => {
		if (rec) rec.contents = JSON.parse(rec.contents);
		return rec;
	});
}

const get = () => db.select();


module.exports = {
	store,
	getByPath,
	get,
};
