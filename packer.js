/**
 * Collection of functions to generate the output data and 
 * compressed folders for the generated output
 */

module.exports = {}

module.exports.outputSolutionForOneDataSet = outputSolutionForOneDataSet

module.exports.outputSolutionVersion = outputSolutionVersion

module.exports.exportSolutionsForSolver = exportSolutionsForSolver

module.exports.packCode = packCode

module.exports.packOutputFolder = packOutputFolder

module.exports.cleanOutputFolder = cleanOutputFolder


const getSolutionFileName = require('./solution-cache-name-resolver').getSolutionFileName,
    archiver = require('./export-archiver'),
    solutionCacher = require('./solution-cacher')
    fs = require('fs'),
    os = require('os'),
    consts = require('./consts'),
    del = require('node-delete')

/**
 * Converts and writes out the solution to the output folder.
 * @param {String} currentTask
 * @param {String} inputDataSetName - to generate output file name
 * @param {Object} solution - to be converted
 */
function outputSolutionForOneDataSet(currentTask, inputDataSetName, solution) {
    let outputFileName = `./${currentTask}/${consts.outputFolder}/${inputDataSetName}${consts.outputExtension}`
    console.log(`Writing out solution ${outputFileName}`)
    let fileData = require(`./${currentTask}/output`)(solution)    
    fs.writeFileSync(outputFileName, fileData);
}

function outputSolutionVersion(currentTask, inputDataSetName, solverName, version, magic) {
        
    let fileName = getSolutionFileName(currentTask, consts.solutionCacheFolderName, solverName, version, inputDataSetName, solutionCacher.generateMagicKey(magic))
    try{
        let solution = JSON.parse(fs.readFileSync('./'+fileName, 'utf8'))
        outputSolutionForOneDataSet(currentTask, inputDataSetName, solution)
        return true
    }
    catch(e){
        console.error(e)
        console.error(`Error reading cached solution file ${fileName}. Have the converter ran for it?`)
        return `Error reading cached solution file ${fileName}.`
    }
    
}

function cleanOutputFolder(task){
    return del.sync(`./${task}/${consts.outputFolder}/*`)
}


function exportSolutionsForSolver(task, solverName, version, magic) {

    cleanOutputFolder(task)

    let stats = solutionCacher.loadStatFile(task)
    let inputs = Object.keys(stats[solverName][version])
    
    let failures = inputs
        .map((inputDataSetName)=>outputSolutionVersion(task, inputDataSetName, solverName, version, magic))
        .filter((ret)=>ret!==true?ret:false)

    packOutputFolder(task)

    // This is magic: if we have errors, we return the error messages
    // if we have successes, we return true.
    return failures.length?failures.join(' '):true;
}

/**
 * Packs the relevan code to an output zip, so it can be easily uploaded with a magic button.
 */
function packCode(currentTask) {
    // Export the currently ran code to a zip
    let fileList = [
        '*.js',        
        `${currentTask}/output.js`,
        `${currentTask}/parser.js`,
        `./${currentTask}/${consts.solversFolderName}/*.js`
    ]
    // Pack all the solvers to it
    
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
function packOutputFolder(currentTask) {
    let inputFiles = fs.readdirSync(`./${currentTask}/${consts.inputFolder}/`)
        .filter((fn) => fn.endsWith(consts.inputExtension))
        .map((fileName) => fileName.substr(0, fileName.length - consts.inputExtension.length))

    let outputFiles = fs.readdirSync(`./${currentTask}/${consts.outputFolder}/`)
        .filter((fn) => fn.endsWith(consts.outputExtension))
        console.log('Found files in the output folder: ', outputFiles.join(', '))        
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

