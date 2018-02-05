// Configuration

let currentTask = process.env.task
if (!currentTask) throw new Error('Please provide a task name! (env variables task, see launch.json)')

let input = process.env.input ? process.env.input.split(' ') : []
let solvers = process.env.solvers ? process.env.solvers.split(' ') : []
let writeSolutionsOut = !process.env.doNotCacheSolutions

const doOutput = process.env.output // default false

// If this is true, the file will not use cache, it will re-parse the original input
const force = process.env.force // Scotty!... oh wait, that's another one.

// If this is true, the file will not use cache, it will re-parse the original input
const doExport = process.env.export // Default: do not export.

// Graphic interface and file server
const graph = process.env.graph // If true, starts a server with some goodies.

// Generic stuff
const consts = require('./consts')
const fs = require('fs')
const os = require('os')
const bostich = require('bostich')
const magicLoader = require('./magic')
const archiver = require('./export-archiver')
const reload = require('require-reload')(require)
const solutionCacher = require('./solution-cacher')


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

if (doExport) {
    packCode();
    packOutputFolder();
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
    // process.exit();
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
        `${currentTask}/parser.js`
    ]
    // Pack all the solvers to it
    solvers = fs.readdirSync(`./${currentTask}/${consts.solversFolderName}/`)
        .filter((fn) => fn.endsWith('.js'))
        // We are storing past versions of algorithms beginning with underscore, ignore those
        .filter((fn) => !fn.startsWith('_'))
        .map((solverFileName) => fileList.push(`${currentTask}/${consts.solversFolderName}/${solverFileName}`))

    archiver(`./${currentTask}/${consts.outputFolder}/output-code.zip`, fileList, (res) => {
        console.log(`Exported code to ${consts.outputFolder}/output-code.zip ${res}`)
    })
}


/**
 * Takes the .out files in the output folder and packs them into a zip, 
 * so it can be exported quickly.
 * It displays warnings, if not all the input data has been converted.
 * I am always so lost with packing. https://xkcd.com/1168/
 */
function packOutputFolder() {
    let inputFiles = fs.readdirSync(`./${currentTask}/${consts.inputFolder}/`)
        .filter((fn) => fn.endsWith(consts.inputExtension))
        .map((fileName) => fileName.substr(0, fileName.length - consts.inputExtension.length))

    let outputFiles = fs.readdirSync(`./${currentTask}/${consts.outputFolder}/`)
        .filter((fn) => fn.endsWith(consts.outputExtension))
    inputFiles = inputFiles.map((inputFileName) => {
        let outputFileName = inputFileName + consts.outputExtension;
        if (!outputFiles.includes(outputFileName)) {
            console.warn(`Missing file in the output folder: ${outputFileName}! You sure you ran all the conversions?`)
            return false;
        }
        return `./${currentTask}/${consts.outputFolder}/${outputFileName}`;
    }).filter((f) => f)
    // TODO: pack files in output folder to an output.zip file. tar params magic reference to XKCD
    archiver(`./${currentTask}/${consts.outputFolder}/output-data.zip`, inputFiles, (res) => {
        console.log(`Exported data to ${consts.outputFolder}/output-data.zip ${res}`)
    }, true)
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
 * @param {String} inputDataSetName - the name of the input file used to identify and export file names.
 * @param {Object} parsedValue - the parsedValue parameter of jolicitron's output
 * @param {Object} [magic] - a set of magic constants provided to the algorithm
 * @returns {Object} the solution JS Object
 */
function runSolver(solverName, inputDataSetName, parsedValue) {
    console.log(`Solving with ${solverName}...`)
    let algorithm = reLoadSolver(solverName);    
    let startTime = new Date()
    let magic = magicLoader(currentTask, solverName);
    if (Object.keys(magic).length) console.log('Magic parameters:', Object.keys(magic).map((mkey)=>`${mkey}: ${magic[mkey]}`).join(', '))
    let solution = algorithm(parsedData.parsedValue, magic)
    let solveTime = (new Date() - startTime) / 1000;
    console.log(`Solved in ${solveTime}`)
    let solutionScore = 0
    try {
        solutionScore = score(solution, parsedData.parsedValue)
    } catch (e) { }    // ignore if no scoring is in place.
    console.warn('Score:', solutionScore)
    // console.log('Backing up algorithm version...')    
    solutionCacher(currentTask, solverName, inputDataSetName, solution, solutionScore, solveTime, magic)
    console.log('>-----------------')    
    return solution
}


/**
 * Live reloads the solver module from the hard drive.
 * @param {String} solverName 
 * @returns {Function} solver module function.
 */
function reLoadSolver(solverName) {
    return reload(`./${currentTask}/${consts.solversFolderName}/${solverName}`)
}
