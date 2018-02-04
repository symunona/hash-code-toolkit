// Configuration

let currentTask = process.env.task
if (!currentTask) throw new Error('Please provide a task name! (env variables task, see launch.json)')

let input = process.env.input ? process.env.input.split(' ') : []
let solvers = process.env.solvers ? process.env.solvers.split(' ') : []
let writeSolutionsOut = !process.env.doNotCacheSolutions

const doOutput = process.env.output // default false

// If this is true, the file will not use cache, it will re-parse the original input
const force = process.env.force // Scotty!... oh wait, that's another one.

// Graphic interface and file server
const graph = process.env.graph // If true, starts a server with some goodies.

// Generic stuff
const consts = require('./consts')
const fs = require('fs')
const os = require('os')
const bostich = require('bostich')

// If no input files are provided, search for all the input files in the input dir.
if (!input.length) {
    input = fs.readdirSync(`./${currentTask}/${consts.inputFolder}/`)
        .filter((fn) => fn.endsWith(consts.inputExtension))
        .map((fileName) => fileName.substr(0, fileName.length - consts.inputExtension.length))
    console.log('No input given, read files:', input.join(', '))
}

// If no solver files are given, genericly we just run the converter.
// If all is given as the only param for the solver, we will load all the solvers from the 
// solver dir. (specified in constst).
if (solvers.length === 1 && solvers[0] === 'all') {
    solvers = fs.readdirSync(`./${currentTask}/${consts.solversFolderName}/`)
        .filter((fn) => fn.endsWith('.js'))
        // We are storing past versions of algorithms beginning with underscore.
        .filter((fn) => !fn.startsWith('_'))
        .map((fileName) => fileName.substr(0, fileName.length - 3))
    console.log('All solvers are loaded:', solvers.join(', '))
}
// Load the actual solvers for 
const solverAlgorithms = solvers.map((name) => require(`./${currentTask}/${consts.solversFolderName}/${name}`))

// Other task specific stuff

const parser = require(`./${currentTask}/parser`)
let score;
try {
    score = require(`./${currentTask}/score`)
} catch (e) {
    console.warn('No score calculator is in place yet, skiping.')
}

const outputConverter = require(`./${currentTask}/output`)


for (let i in input) {
    let inputFileName = `./${currentTask}/${consts.inputFolder}/${input[i]}${consts.inputExtension}`
    let inputParsedFileName = `./${currentTask}/${consts.inputFolder}/${input[i]}.cache.json`


    console.log('<o>--------------------------------------<o>')
    console.log(`Loading data for ${inputFileName}...`)

    // Parse the file if not parsed already, if it is, load if from cache, unless force is true.
    parsedData = bostich(inputFileName, parser, force)

    if (parsedData.remaining) {
        console.error('The parser is most likely faulity: there are still data to be processed!')
    }

    let solutions = {}

    for (let s in solvers) {
        solutions[solvers[s]] = runSolver(solvers[s], input[i], parsedData)
    }

    if (doOutput && solutions[doOutput]) {
        output(input[i], solutions[doOutput])
    }
    else {
        console.warn('No output is provided, not writing out anything.')
    }
    console.log('</>--------------------------------------</>')
}

const toolkit = {
    runSolver,
    output,
    packOutputFolder,
    packCode
}

// Start graphic frontend for debugging the problem
if (graph) {
    const graphServer = require('./graph-toolkit/graph-server')
    graphServer(currentTask, solvers, input, toolkit);
    console.log('Started GUI')
}
else {
    process.exit();
}


/**
 * Packs the relevan code to an output zip, so it can be easily uploaded with a magic button.
 */
function packCode() {
    // Export the currently ran code to a zip
    let fileList = [
        'app.js',
        'consts.js',
        `${currentTask}/output.js`,
        `${currentTask}/parser.js`,
        `${currentTask}/.js`,
    ]
    // Pack all the solvers to it
    solvers = fs.readdirSync(`./${currentTask}/${consts.solversFolderName}/`)
        .filter((fn) => fn.endsWith('.js'))
        // We are storing past versions of algorithms beginning with underscore, ignore those
        .filter((fn) => !fn.startsWith('_'))
        .map((solverFileName)=>fileList.push(`${currentTask}/${consts.solversFolderName}/${solverFileName}`))

    // TODO: pack the file list into the ZIP.
    
}


/**
 * Takes the .out files in the output folder and packs them into a zip, so it can be exported easily.
 */
function packOutputFolder() {
    let inputFiles = fs.readdirSync(`./${currentTask}/${consts.inputFolder}/`)
        .filter((fn) => fn.endsWith(consts.inputExtension))
        .map((fileName) => fileName.substr(0, fileName.length - consts.inputExtension.length))

    let outputFiles = fs.readdirSync(`./${currentTask}/${consts.outputFolder}/`)
        .filter((fn) => fn.endsWith(consts.outputExtension))
    inputFiles.map((inputFileName) => {
        let outputFileName = inputFileName + consts.outputExtension;
        if (!outputFiles.includes(outputFileName)) {
            console.warn(`Missing file in the output folder: ${outputFileName}! You sure you ran all the conversions?`)
        }
    })
    // TODO: pack files in output folder to an output.zip file. tar params magic reference to XKCD
}



/**
 * Converts and writes out the solution to the output folder.
 * @param {String} inputDataSetName - to generate output file name
 * @param {Object} solution - to be converted
 */
function output(inputDataSetName, solution) {
    let outputFileName = `./${currentTask}/${consts.outputFolder}/${inputDataSetName}${consts.outputExtension}`
    console.log(`Writing out solution ${outputFileName}`)
    let fileData = outputConverter(solution)
    fs.writeFileSync(outputFileName, fileData);
}

/**
 * Runs the solver with the given name, then scores the output and saves the stats 
 * and backs up the current algorithm version to the hard drive.
 * Also saves the output JSON file, so it can be visualized and played with.
 * @param {String} solverName - to be run.
 */
function runSolver(solverName, inputDataSetName, parsedValue) {
    let algorithm = loadSolver(solverName);
    console.log(`Solving with ${solverName}...`)
    let startTime = new Date()
    let solution = algorithm(parsedData.parsedValue)
    let solveTime = (new Date() - startTime) / 1000;
    console.log(`Solved in ${solveTime}`)
    let solutionScore = 0
    try {
        let solutionScore = score(solution, parsedData.parsedValue)
    } catch (e) { }    // ignore if no scoring is in place.
    console.warn('Score:', solutionScore)
    console.log('Backing up algorithm version...')
    let backupFileName = backUpSolverIfNecessary(solverName, inputDataSetName, solutionScore, solveTime)
    console.log('Saving the output JSON')
    let solutionObjectFileName = `${backupFileName.substr(0, backupFileName.length - '.backup.js'.length)}.${inputDataSetName}.output.json`

    // We save it next to the input folder, so that the output folder is kept clean.
    fs.writeFileSync(`./${currentTask}/${consts.inputFolder}/${solutionObjectFileName}`, JSON.stringify(solution, null, 2))
    return solution
}

/**
 * Live reloads the solver module from the hard drive.
 * TODO: live reload!
 * @param {String} solverName 
 * @returns {Function} solver.
 */
function loadSolver(solverName) {
    return require(`./${currentTask}/${consts.solversFolderName}/${solverName}`)
}

/**
 * Checks the last backed up file to date, if it's content has changed, backs it up again, 
 * and saves the data and it's name to the cache file with it's success and time data.
 * Writes [currentTaskFolder]/[hostname].stats.json file for stats.
 * @param {String} solverName - which has been used
 * @param {String} inputDataSetName - the input dataset's name
 * @param {Number} score - how well this algorithm performed
 * @param {Number} timeFinished - in seconds for the stats
 */
function backUpSolverIfNecessary(solverName, inputDataSetName, score, timeFinished) {
    let stats = {}
    let statFileName = `./${currentTask}/${os.hostname()}.${consts.statFileName}`
    try {
        let statFile = fs.readFileSync(statFileName, 'utf8')
        stats = JSON.parse(statFile)
    } catch (e) { } // File does not exists yet, ignore.

    let now = new Date()
    let dateString = `${padString(now.getMonth() + 1)}${padString(now.getDate())}-${padString(now.getHours())}${padString(now.getMinutes())}${padString(now.getSeconds())}`
    let solverBackupFileName = `_${dateString}.${os.hostname()}.${solverName}.backup.js`
    let currentSolver = fs.readFileSync(`./${currentTask}/${consts.solversFolderName}/${solverName}.js`, 'utf8')

    // Check if the last one is the same as the current. If so, do not save it again.
    let cachedFiles = fs.readdirSync(`./${currentTask}/${consts.solversFolderName}/`)
        .filter((fn) => fn.startsWith('_'))
        .filter((fn) => fn.includes(`${solverName}.backup.js`))
        .sort()
    let cachedFileName = cachedFiles.length ? cachedFiles[cachedFiles.length - 1] : false;

    if (cachedFileName) {
        let cachedFile = fs.readFileSync(`./${currentTask}/${consts.solversFolderName}/${cachedFileName}`, 'utf8')
        // Compare the two files without the spaces, if they are the same, do not back up.
        if (compareTwoFilesWithoutSpaces(currentSolver, cachedFile)) {
            // Make it the same, so we get consistent stats.
            solverBackupFileName = cachedFileName;
        }
    }

    // Write the stats to the stats file.
    stats[solverName] = stats[solverName] || {}
    stats[solverName][solverBackupFileName] = stats[solverName][solverBackupFileName] || {}
    stats[solverName][solverBackupFileName][inputDataSetName] = {
        score: score,
        time: timeFinished
    }
    fs.writeFileSync(statFileName, JSON.stringify(stats, null, 2));

    // Only copy, it we did not conclude that it is the same.
    if (solverBackupFileName !== cachedFileName) {
        fs.writeFileSync(`./${currentTask}/${consts.solversFolderName}/${solverBackupFileName}`, currentSolver)
    }
    return solverBackupFileName;
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