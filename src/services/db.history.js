const DB = require('./class.db');
const db = new DB('history', 'path');


async function add (item = {}) {
	if (!item) return Promise.resolve();

	const oldItem = await db.findOne({ name: item.name, path: item.path });
	item.visited = (oldItem && oldItem.visited || 0) + 1;

	return db.addOrUpdate({path: item.path}, item);
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
