// Configuration

let currentTask = process.env.task
if (!currentTask) throw new Error('Please provide a task name! (env variables task, see launch.json)')

let input = process.env.input?process.env.input.split(' '):[]
let solvers = process.env.solvers?process.env.solvers.split(' '):[]
let writeSolutionsOut = !process.env.doNotCacheSolutions

const output = process.env.output // default false

// If this is true, the file will not use cache, it will re-parse the original input
const force = process.env.force // Scotty!... oh wait, that's another one.

// Graphic interface and file server
const graph = process.env.graph // If true, starts a server with some goodies.

// Generic stuff
const consts = require('./consts')
const fs = require('fs')
const os = require('os')
const bostich = require('bostich')
const graphServer = require('./graph-toolkit/graph-server')

// If no input files are provided, search for all the input files in the input dir.
if (!input.length){
    input = fs.readdirSync(`./${currentTask}/${consts.inputFolder}/`)
        .filter((fn)=>fn.endsWith(consts.inputExtension))
        .map((fileName)=>fileName.substr(0, fileName.length-consts.inputExtension.length))
    console.log('No input given, read files:', input.join(', '))
}

// If no solver files are given, genericly we just run the converter.
// If all is given as the only param for the solver, we will load all the solvers from the 
// solver dir. (specified in constst).
if (solvers.length === 1 && solvers[0] === 'all'){
    solvers = fs.readdirSync(`./${currentTask}/${consts.solversFolderName}/`)
        .filter((fn)=>fn.endsWith('.js'))
        // We are storing past versions of algorithms beginning with underscore.
        .filter((fn)=>!fn.startsWith('_'))
        .map((fileName)=>fileName.substr(0, fileName.length-3))
    console.log('All solvers are loaded:', solvers.join(', '))
}
// Load the actual solvers for 
const solverAlgorithms = solvers.map((name)=>require(`./${currentTask}/${consts.solversFolderName}/${name}`))

// Other task specific stuff

const parser = require(`./${currentTask}/parser`)
const score = require(`./${currentTask}/score`)
const outputConverter = require(`./${currentTask}/output`)


for (let i in input) {
    let inputFileName = `./${currentTask}/${consts.inputFolder}/${input[i]}${consts.inputExtension}`
    let inputParsedFileName = `./${currentTask}/${consts.inputFolder}/${input[i]}.cache.json`
    let outputFileName = `./${currentTask}/${consts.outputFolder}/${input[i]}${consts.outputExtension}`
    
    console.log('<o>--------------------------------------<o>')
    console.log(`Loading data for ${inputFileName}...`)    
    
    // Parse the file if not parsed already, if it is, load if from cache, unless force is true.
    parsedData = bostich(inputFileName, parser, force)

    if (parsedData.remaining){
        console.error('The parser is most likely faulity: there are still data to be processed!')
    }
    
    let solutions = {}
    let scores = {}

    for(let s in solverAlgorithms){
        let algorithm = solverAlgorithms[s];
        let algorithmName = solvers[s];
        console.log(`Solving with ${algorithmName}...`)
        let startTime = new Date()
        solutions[algorithmName] = algorithm(parsedData.parsedValue)
        let solveTime = (new Date()-startTime)/1000;
        console.log(`Solved in ${solveTime}`)
        scores[algorithmName] = score(solutions[algorithmName], parsedData.parsedValue) 
        console.warn('Score:', scores[algorithmName])
        console.log('Backing up algorithm version...')        
        backUpSolverIfNecessary(algorithmName, input[i], scores[algorithmName], solveTime)
    }

    if (output && solutions[output]){
        console.log(`Writing out the result of algorihm ${output} to ${outputFileName}`)
        let fileData = outputConverter(solutions[output])
        fs.writeFileSync(outputFileName, fileData);    
    }
    else{
        console.warn('No output is provided, not writing out anything.')
    }
    console.log('</>--------------------------------------</>')
}

// Start graphic frontend for debugging the problem
if (graph){        
    graphServer(currentTask, solvers, input);
    console.log('Started GUI')
}
else{
    process.exit();
}

function backUpSolverIfNecessary(name, input, score, timeFinished){
    let stats = {}
    let statFileName = `./${currentTask}/${os.hostname()}.${consts.statFileName}`
    try{
        let statFile = fs.readFileSync(statFileName, 'utf8')
        stats = JSON.parse(statFile)
    } catch(e){} // File does not exists yet, ignore.
    
    let now = new Date()
    let dateString = `${padString(now.getMonth()+1)}${padString(now.getDate())}-${padString(now.getHours())}${padString(now.getMinutes())}${padString(now.getSeconds())}`
    let solverBackupFileName = `_${dateString}.${os.hostname()}.${name}.backup.js`
    let currentSolver = fs.readFileSync(`./${currentTask}/${consts.solversFolderName}/${name}.js`, 'utf8')

    // Check if the last one is the same as the current. If so, do not save it again.
    let cachedFiles = fs.readdirSync(`./${currentTask}/${consts.solversFolderName}/`)
        .filter((fn)=>fn.startsWith('_'))
        .filter((fn)=>fn.includes(`${name}.backup.js`))
        .sort()
    let cachedFileName = cachedFiles.length?cachedFiles[cachedFiles.length-1]:false;
    
    if (cachedFileName){        
        let cachedFile = fs.readFileSync(`./${currentTask}/${consts.solversFolderName}/${cachedFileName}`, 'utf8')
        // Compare the two files without the spaces, if they are the same, do not back up.
        if (compareTwoFilesWithoutSpaces(currentSolver, cachedFile)){
            // Make it the same, so we get consistent stats.
            solverBackupFileName = cachedFileName;
        }
    }    

    stats[name] = stats[name] || {}
    stats[name][solverBackupFileName] = stats[name][solverBackupFileName] || {}
    stats[name][solverBackupFileName][input] = {
        score: score,
        time: timeFinished
    }
    fs.writeFileSync(statFileName, JSON.stringify(stats, null, 2));

    // Only copy, it we did not conclude that it is the same.
    if (solverBackupFileName !== cachedFileName){
        fs.writeFileSync(`./${currentTask}/${consts.solversFolderName}/${solverBackupFileName}`, currentSolver)
    }
    
}

function compareTwoFilesWithoutSpaces(file1, file2){
    const whitespaceReplacer = /\s/g
    return file1.replace(whitespaceReplacer, '') === file2.replace(whitespaceReplacer, '')
}

function padString(number, length, character){
    length = length || 2
    character = character?String(character):'0'
    number = String(number)
    return number.length<length?character.repeat(length-number.length)+number:number;
}