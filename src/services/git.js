const git = require('git-state');
const execSync = require('child_process').execSync;


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



function getRepoUrl(dir) {
	const gitUrlCmd = 'remote=$(git config --get branch.master.remote);git config --get remote.$remote.url';
	let url;
	try { url = execSync(gitUrlCmd, {cwd: dir}); }
	catch (e) { url = ''; }
	url = url.toString().trim().replace(/\.git$/, '');

	// reformat git-url of type: git@github.com:org/name to https://github.com/org/name
	if (url.indexOf('git@') === 0) url = url.replace(':', '/').replace(/^git@/, 'https://');
	return url;
}


module.exports = {
	status,
	getRepoUrl
};
