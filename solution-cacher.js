/**
 * This file is a version tracker for our solvers and their outputs.
 * It backs up the solver versions if is a new one with the solution generated.
 * It also keeps track of the versions already generated in the system specific stat file.
 */

const getSolutionFileName = require('./solution-cache-name-resolver').getSolutionFileName,
    consts = require('./consts'),
    mkdirr = require('mkdir-recursive'),
    os = require('os'),
    fs = require('fs')

module.exports = backUpSolverIfNecessaryAndExportStats
module.exports.loadStatFile = loadStatFile
module.exports.generateMagicKey = generateMagicKey

/**
 * Checks the last backed up solver version, if it's content has changed, backs it up again, 
 * and saves the data and it's name to the cache file with it's success and time data.
 * Writes [taskFolder]/[hostname].stats.json file for stats.
 * @param {String} task - that we are in.
 * @param {String} solverName - which has been used
 * @param {String} inputDataSetName - the input dataset's name
 * @param {Object} solution - te solution to be written out
 * @param {Number} score - how well this algorithm performed
 * @param {Number} timeFinished - in seconds for the stats
 * @param {Object} [magic] - variables used in this run
 */
function backUpSolverIfNecessaryAndExportStats(task, solverName, inputDataSetName, solution, score, timeFinished, magic) {

    let version = getSolverVersionAndBackItUp(task, solverName)

    let solutionFileName = getSolutionFileName(task, consts.solutionCacheFolderName, solverName, version, inputDataSetName, generateMagicKey(magic))
    let dir = './' + solutionFileName.substr(0, solutionFileName.lastIndexOf('/') + 1)

    mkdirr.mkdirSync(dir);

    // Back up the solution, so we can access it from the frontend.
    fs.writeFileSync(solutionFileName, JSON.stringify(solution, null, 2))
    let size = fs.statSync(solutionFileName).size;

    exportStats(task, solverName, version, inputDataSetName, score, timeFinished, magic, size)

    return version;
}

/**
 * Returns the already existing solver version array (filenames, with extension, .js)
 * sorted by their name reversed, so the latest added will be the first.
 * @param {String} task - current task
 * @param {String} solverName - current solver what we are looking at versions
 */
function getCachedSolvers(task, solverName) {
    let solverBackupDir = `./${task}/${consts.solutionCacheFolderName}/${solverName}/`;
    // Do not fail, if there are no backups!    
    try {
        return fs.readdirSync(solverBackupDir)
            .filter((fn) => fn.endsWith('.js'))
            .sort().reverse()   // so that it is starting with the most likely one.
    } catch (e) {
        return []
    }
}

/**
 * Looks for all the cached solvers, and compare with the current version just ran.
 * If there is a match, return it, so we do not duplicate it every run.
 * @param {String} task 
 * @param {String} solverName 
 */
function getMatchingCachedSolver(task, solverName) {
    let currentSolver = fs.readFileSync(`./${task}/${consts.solversFolderName}/${solverName}.js`, 'utf8')
    return getCachedSolvers(task, solverName).find((cachedSolver) => {
        return compareTwoFilesWithoutSpaces(
            fs.readFileSync(`./${task}/${consts.solutionCacheFolderName}/${solverName}/${cachedSolver}`, 'utf8'),
            currentSolver)
    })
}

/**
 * Iterates over the old solvers, and if the current solver matches one, it returns that,
 * if not, it creates a new version of that.
 * @param {String} task 
 * @param {String} solverName 
 */
function getSolverVersionAndBackItUp(task, solverName) {
    let lastSolverMatching = getMatchingCachedSolver(task, solverName);
    // If it matches a former one, return that (but cut it's extension)
    if (lastSolverMatching) {
        return lastSolverMatching.substr(0, lastSolverMatching.length - '.js'.length)
    }
    // if not, generate a new from the current date, 
    let now = new Date()
    let ver = `${padString(now.getMonth() + 1)}${padString(now.getDate())}-${padString(now.getHours())}${padString(now.getMinutes())}${padString(now.getSeconds())}`
    // And back it up, so next time we find it.
    let solver = fs.readFileSync(`./${task}/${consts.solversFolderName}/${solverName}.js`, 'utf8')
    let dir = `./${task}/${consts.solutionCacheFolderName}/${solverName}/`
    mkdirr.mkdirSync(dir);
    fs.writeFileSync(`${dir}${ver}.js`, solver)
    return ver
}

/**
 * Exports the stats to the stat file.
 * Deals with magic.
 * @param {String} task - that we are in.
 * @param {String} solverName 
 * @param {String} version 
 * @param {String} inputDataSetName 
 * @param {Number} score 
 * @param {Number} timeFinished 
 * @param {Object} magic 
 */
function exportStats(task, solverName, version, inputDataSetName, score, timeFinished, magic, fileSize) {
    let stats = loadStatFile(task)

    // Write the stats to the stats file.
    stats[solverName] = stats[solverName] || {}
    stats[solverName][version] = stats[solverName][version] || {}
    stats[solverName][version][inputDataSetName] = stats[solverName][version][inputDataSetName] || {}


    // If we used magic variables for the algorithm, back them up, that is a distinctive 
    // stat there..
    if (magic && Object.keys(magic).length) {

        stats[solverName][version][inputDataSetName] =
            stats[solverName][version][inputDataSetName] || { score: 0 }

        let isThisRunBetter = stats[solverName][version][inputDataSetName].score === undefined ||
            stats[solverName][version][inputDataSetName].score < score

        // If the output is better with other magic numbers, mark which one is the data set, 
        // and update the main.
        if (isThisRunBetter) {
            stats[solverName][version][inputDataSetName].score = score;
            stats[solverName][version][inputDataSetName].time = timeFinished
            stats[solverName][version][inputDataSetName].size = fileSize
            stats[solverName][version][inputDataSetName].magic = magic
        }
        
        // Save it as "nice try"
        let magicKey = generateMagicKey(magic)
        stats[solverName][version][inputDataSetName].magicVersions =
            stats[solverName][version][inputDataSetName].magicVersions || {}
        stats[solverName][version][inputDataSetName].magicVersions[magicKey] =
            stats[solverName][version][inputDataSetName].magicVersions[magicKey] || {}

        stats[solverName][version][inputDataSetName].magicVersions[magicKey].score = score;
        stats[solverName][version][inputDataSetName].magicVersions[magicKey].time = timeFinished
        stats[solverName][version][inputDataSetName].magicVersions[magicKey].magic = magic
        stats[solverName][version][inputDataSetName].magicVersions[magicKey].size = fileSize
    
    } else {
        stats[solverName][version][inputDataSetName].score = score;
        stats[solverName][version][inputDataSetName].time = timeFinished
        stats[solverName][version][inputDataSetName].size = fileSize
    }

    fs.writeFileSync(getStatFileName(task), JSON.stringify(stats, null, 2));
}

/**
 * Loads stat file if exists
 * @param {String} task 
 * @returns {Object}
 */
function loadStatFile(task){
    let stats = {}    
    try {
        let statFile = fs.readFileSync(getStatFileName(task), 'utf8')
        stats = JSON.parse(statFile)
    } catch (e) { } // File does not exists yet, ignore.
    return stats;
}

function getStatFileName(task){
    return `./${task}/${os.hostname()}.${consts.statFileName}`
}

/**
 * Generates a simple "magic-hash" string from an object to 
 * serve as an identifier of the magic versions.
 * @param {Object} magic 
 */
function generateMagicKey(magic) {
    if (magic) {
        return Object.keys(magic).map((k) => magic[k]).join('-');
    }
    return ''
}

/**
 * Returns true if the two files are identical witout their spaces.
 * @param {String} file1 
 * @param {String} file2 
 */
function compareTwoFilesWithoutSpaces(file1, file2) {
    const whitespaceReplacer = /\s/g
    return file1.replace(whitespaceReplacer, '') === file2.replace(whitespaceReplacer, '')
}

/**
 * Pads a number to a certain length, so if there are less characters in it, it will fill it up with 
 * the characters given.
 * Example with default length and character: 1 -> 01, 5 -> 05, 11 -> 11
 * @param {Number} number 
 * @param {Number} [length] - to be filled. Default: 2
 * @param {String} [character] - to be filled with. Default: '`0'
 */
function padString(number, length, character) {
    length = length || 2
    character = character ? String(character) : '0'
    number = String(number)
    return number.length < length ? character.repeat(length - number.length) + number : number;
}