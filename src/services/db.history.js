const DB = require('./class.db');
const db = new DB('history', 'path');


function add (item = {}) {
	if (!item) return Promise.resolve();
	item.touched_at = +new Date();
	item.visited = (item.visited || 0) + 1;
	return db.addOrUpdate(item);
}


function get () {
	return db.find({ id: 1, name: 1, path: 1 });
}


function getByName (name) {
	if (!name) return Promise.resolve();
	return db.findOne({ name });
}

function getByPath (path) {
	if (!path) return Promise.resolve();
	return db.findOne({ path });
}




// function setUnreadByUrl (url, unread) {
// 	const updated_at = +new Date();
// 	return db.update({ url }, { unread, updated_at });
// }




module.exports = {
	add,
	get,
	getByName,
	getByPath,
};
