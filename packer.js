/**
 * Collection of functions to generate the output data and 
 * compressed folders for the generated output
 */

module.exports = {}

module.exports.outputSolutionDirectly = outputSolutionForOneDataSet

module.exports.outputSolutionVersion = outputSolutionVersion


const getSolutionFileName = require('./solution-cache-name-resolver').getSolutionFileName,
    archiver = require('./export-archiver'),
    fs = require('fs')

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

function outputSolutionVersion(currentTask) {

}

function cleanAndBackUpOutputFolder() {

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

