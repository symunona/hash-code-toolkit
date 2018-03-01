/**
 * Our little HashCodeToolkit is more like a framework, which 
 * sums up the generic tasks about the competition, and tries 
 * to simplify it so we have more time playing with algorithms.
 * 
 * We separated the process to these generic task specific steps:
 * - reading input files
 * - caching
 * - solving with solver
 * - scoring solution
 * - exporting solution
 * 
 * At each step, you may have things configured, but this is the general
 * pipeline. 
 * 
 * Oh, and we also have a nice GUI to compare the different algorithms,
 * their efficiency, and even drawing some cool graphs!
 * 
 */

 // The current task you are working on. It is used to identify the working folder where
 // the task specific files go into.
let currentTask = process.env.task
if (!currentTask) throw new Error('Please provide a task name! (env variables task, see launch.json)')

// Input files to be processed. If left empty, it will read all the .in files 
// withing the project's input_data_set folder
let input = process.env.input ? process.env.input.split(' ') : []

// Solvers to be ran on the data set. 
// If `all` is provided, it will run every of them.
// If none is provided, it will just run the imports and caches the files
let solvers = process.env.solvers ? process.env.solvers.split(' ') : []

// If it is a name of a solver, it will export the solver's solution.
const doOutput = process.env.output // default false

// If this is true, the file will not use cache, it will re-parse the original input
const force = process.env.force // Scotty!... oh wait, that's another one.

// EXPERIMENTAL If this is true, we fork processes instead of running them linearily.
// This can be good for two things: 
//  - heat your room in the winter
//  - finish the tasks faster
const paralell = process.env.paralell

// If this is true, the file will not use cache, it will re-parse the original input
const doExport = process.env.export // Default: do not export.

// Graphic interface and file server
const graph = process.env.graph // If true, starts a server with some goodies.

// If true, search for other magics too.
const allmagics = process.env.allmagics

// Generic stuff
const consts = require('./consts')
const fs = require('fs')
const os = require('os')

const solverRunner = require('./solver-runner')
const packer = require('./packer')

const cores = os.cpus().length

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

// If we have export set, do clean the output folder so we 
// do not have old compilations in place.
if (doExport) {
    packer.cleanOutputFolder(currentTask)
}

if (!paralell){
    // Iterate over the provided/found inputs.
    for (var i=0; i<input.length; i++) {
        solverRunner(currentTask, input[i], solvers, doOutput, force, allmagics)
    }
    // If we are done, and the output property is set, do ourself 
    // a favor, and pack the 
    if (doExport) {

        // Yeah, this does not really work just yet...
        // packer.packCode(currentTask)
        packer.packOutputFolder(currentTask)
    }

    // Start graphic frontend for debugging and nice algo version handling.
    if (graph) {
        const graphServer = require('./graph-toolkit/graph-server')
        graphServer(currentTask, solvers, input);
        console.log('Started GUI')
    }
    else {
        // process.exit(); // Writes do not finish by the time this runs.    
    }
    console.log('============================================')

}
else {
    for (let i in input) {

        solverRunner(currentTask, input[i], solvers, doOutput, force)
    }
}

// const { spawn } = require('child_process');


// function paralellFork(cb){
//     // forking 
//     child = spawn('');    
// }




