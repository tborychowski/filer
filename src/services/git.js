const git = require('git-state');


/**
 * Get git status
 * @param  {string} path
 * @return {object}      { branch: 'master', ahead: 0, dirty: 9, untracked: 1, stashes: 0 }
 */
function status (path) {
	if (!path) return Promise.resolve();
	return new Promise (resolve => {
		git.check(path, (err, result) => {
			if (err) resolve();
			resolve(result);
		});
	});
}

module.exports = {
	status
};
