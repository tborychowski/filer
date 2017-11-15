const {helper}= require('../core');
const sqlite = require('better-sqlite3');



class Table {

	constructor (table, fields) {
		const filePath = `${helper.getUserDataFolder()}/${helper.appId}.db`;
		// console.log(filePath);
		this.db = new sqlite(filePath, {});
		this.table = table;

		if (fields) this.run(`CREATE TABLE IF NOT EXISTS ${table} (${fields.join(',')})`); // ensure table
	}


	run (sql, vals, fn = 'run') {
		return new Promise(resolve => {
			const st = this.db.prepare(sql);
			const res = vals ? st[fn](vals) : st[fn]();
			resolve(res);
		}).catch(e => console.error(e));
	}


	get (sql, vals) {
		return this.run(sql, vals, 'get');
	}


	all (sql, vals) {
		return this.run(sql, vals, 'all');
	}


	del (item, param) {
		return this.run(`DELETE FROM ${this.table} WHERE ${param}=?`, item[param]);
	}


	getById (id) {
		return this.get(`SELECT * FROM ${this.table} WHERE id=?`, id);
	}

	getBy (field, value) {
		return this.get(`SELECT * FROM ${this.table} WHERE ${field}=?`, value);
	}


	add (item) {
		const fields = Object.keys(item).join(',');
		const vals = '@' + Object.keys(item).join(',@');
		return this.run(`INSERT OR REPLACE INTO ${this.table} (${fields}) VALUES (${vals})`, item);
	}


	select ({where, order, fn = 'all'} = {}) {
		where = where ? ` WHERE ${where} ` : '';
		order = order ? ` ORDER BY ${order} ` : '';
		return this[fn](`SELECT * FROM ${this.table}${where}${order}`);
	}


}


module.exports = Table;
