const {helper} = require('../core');
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
			resolve(result);
		});
	});
}



function getRepoUrl(dir) {
	const gitUrlCmd = 'remote=$(git config --get branch.master.remote);git config --get remote.$remote.url';
	let url;
	try { url = execSync(gitUrlCmd, {cwd: dir}); }
	catch (e) { url = ''; }
	return helper.parseGitUrl(url);
}


module.exports = {
	status,
	getRepoUrl
};
