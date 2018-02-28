/**
 * This file runs the solvers, backs data & solutions and provides direct export
 * if given.
 */

const bostich = require('bostich'),
    magicLoader = require('./magic'),
    consts = require('./consts'),
    packer = require('./packer'),
    solutionCacher = require('./solution-cacher'),
    reload = require('require-reload')(require)
    

/**
 * Reads the data, runs a solver(s), exports if necessary.
 * @param {String} currentTask 
 * @param {String} inputName 
 * @param {String} solverName 
 * @param {String} doOutput 
 */
module.exports = function (currentTask, inputName, solverNames, doOutput, forceReParsing, moreMagic) {
    let inputFileName = `./${currentTask}/${consts.inputFolder}/${inputName}${consts.inputExtension}`

    console.log('<o>--------------------------------------<o>')
    console.log(`Loading data for ${inputFileName}...`)

    // Other task specific stuff
    const parser = require(`./${currentTask}/parser`)

    // Parse the file if not parsed already, if it is, load if from cache, unless force is true.
    parsedData = bostich(inputFileName, parser, forceReParsing)

    // If the parser returns with a "remaining" not empty string, we probably messed something up
    // within the parser, bail.
    if (parsedData.remaining) {
        console.error('The parser is most likely faulity: there are still data to be processed!')
        process.exit(1)
    }

    let solutions = {}
    for (let s in solverNames) {
        solutions[solverNames[s]] = runSolver(currentTask, solverNames[s], inputName, parsedData, moreMagic)
    }
    // Do direct export of the file, output is set.
    if (doOutput && solutions[doOutput]) {
        packer.outputSolutionForOneDataSet(currentTask, inputName, solutions[doOutput])
    }
    else {
        console.warn('No output is provided.')
    }
    console.log('</>--------------------------------------</>')

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
function runSolver(currentTask, solverName, inputDataSetName, parsedValue, moreMagic) {
    
    // Reading magics 
    if (moreMagic){
        let magics = magicLoader.more(currentTask, solverName);
        console.log(`More Magics: are present: ${JSON.stringify(magics, null, 2)}`)
        return magics.map((m)=>runSolverWithSpecificMagic(currentTask, solverName, inputDataSetName, parsedValue, m))
    }
    let magic = magicLoader(currentTask, solverName);

    if (Object.keys(magic).length) {
        console.log('Magic () parameters:', Object.keys(magic).map((mkey) => `${mkey}: ${magic[mkey]}`).join(', '))                
    }
    else {
        console.log('No magic is present')
    }
    return runSolverWithSpecificMagic(currentTask, solverName, inputDataSetName, parsedValue, magic)
}

function runSolverWithSpecificMagic(currentTask, solverName, inputDataSetName, parsedValue, magic){
    console.log(`Solving with ${solverName}...`)
    let algorithm = reLoadSolver(currentTask, solverName);
    let startTime = new Date()
    
    if (Object.keys(magic).length) console.log('Magic parameters:', Object.keys(magic).map((mkey) => `${mkey}: ${magic[mkey]}`).join(', '))
    let solution = algorithm(parsedData.parsedValue, magic)
    let solveTime = (new Date() - startTime) / 1000;
    console.log(`Solved in ${solveTime}`)
    let solutionScore = 0
    try {
        // Do not bail, if there is no score calculator is present.
        solutionScore = require(`./${currentTask}/score`)(solution, parsedData.parsedValue)
        console.warn('Score:', solutionScore)
    } catch (e) { 
        console.warn('No scoring is in place, could not tell you the score.')

    }
        
    solutionCacher(currentTask, solverName, inputDataSetName, solution, solutionScore, solveTime, magic)
    console.log('>-----------------')
    return solution
}
/**
 * Live reloads the solver module from the hard drive.
 * @param {String} solverName 
 * @returns {Function} solver module function.
 */
function reLoadSolver(currentTask, solverName) {
    return reload(`./${currentTask}/${consts.solversFolderName}/${solverName}`)
}
