const tingodb = require('tingodb')().Db;
const {helper} = require('../core');

function getCollection (name) {
	name = name.replace(/\.json$/, '') + '.json';
	const db = new tingodb(helper.getUserDataFolder(), {});
	return db.collection(name);
}


module.exports = class DB {

	constructor (colName, index) {
		this.collection = getCollection(colName);
		if (index) {
			const idx = {};
			idx[index] = 1;
			this.collection.ensureIndex(idx, { unique: true });
		}
	}

	add (item) {
		return new Promise ((resolve, reject) => {
			this.collection.insert(item, (err, res) => {
				if (err) return reject(err);
				resolve(res);
			});
		});
	}


	addOrUpdate (where, item) {
		return new Promise ((resolve, reject) => {
			this.collection.update(where, item, { upsert: true, w: 1 }, (err, res) => {
				if (err) return reject(err);
				resolve(res);
			});
		});
	}


	find (sort = {id: 1}, where = {}, lim = 0) {
		return new Promise ((resolve, reject) => {
			let cur = this.collection
				.find(where, {})
				.sort(sort);

			if (lim) cur = cur.limit(lim);

			cur.toArray((err, items) => {
				if (err) return reject(err);
				resolve(items || []);
			});
		});
	}

	findOne (item) {
		return new Promise ((resolve, reject) => {
			this.collection.findOne(item, {}, (err, res) => {
				if (err) return reject(err);
				resolve(res);
			});
		});
	}

	update (where, item) {
		return new Promise ((resolve, reject) => {
			this.collection.update(where, {$set: item}, (err, res) => {
				if (err) return reject(err);
				resolve(res);
			});
		});
	}

	del (item) {
		return new Promise ((resolve, reject) => {
			this.collection.remove(item, (err, res) => {
				if (err) return reject(err);
				resolve(res);
			});
		});
	}

};
