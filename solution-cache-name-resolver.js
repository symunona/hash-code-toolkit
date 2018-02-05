// UMD simple... he-he-he :|
exp = typeof window !== 'undefined' ? window : module.exports = {};

/**
 * Returns the generated cache file name with it's location
 * @param {String} task 
 * @param {String} solutionCacheFolder 
 * @param {String} solverName 
 * @param {String} ver 
 * @param {String} dataset 
 * @param {String} magicKey 
 * @returns {String}
 */
exp.getSolutionFileName = function (task, solutionCacheFolder, solverName, ver, dataset, magicKey) {

    return `${task}/${solutionCacheFolder}/${solverName}/${ver}/${dataset}/${magicKey||'default'}.json`

}   