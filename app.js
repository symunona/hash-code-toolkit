// Configuration

const currentTask = 'youtube'
const input = [
    'test',
//    'me_at_the_zoo',
    // 'kittens',
    // ''
]
const solvers = [
    'solver1',
    // 'solver2'
]

const output = false //'solver1'

// If this is true, the file will not use cache, it will re-parse the input. 
const force = false; // Scotty!... oh wait, that's another one.

// Graphic interface
const graph = true; // If true, starts a server, which has some goodies in it.

// Task specific stuff

const parser = require(`./${currentTask}/parser`)
const solverAlgorithms = solvers.map((name)=>require(`./${currentTask}/${name}`))
const score = require(`./${currentTask}/score`)


// Generic stuff

const consts = require('./consts')
const fs = require('fs')
const bostich = require('bostich')
const graphServer = require('./graph-toolkit/graph-server')

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
        console.log(`Solved in ${(new Date()-startTime)/1000}`)
        scores[algorithmName] = score(solutions[algorithmName], parsedData.parsedValue) 
        console.warn('Score:', scores[algorithmName])
    }

    if (output && solutions[output]){
        console.log(`Writing out the result of algorihm ${output} to ${outputFileName}`)
        let fileData = outputConverter(solutions[output])
        fs.writeFileSync(outputFileName, fileData);    
    }
    else{
        console.warn('No output is provided, not writing out anything.')
    }


    // Start graphic frontend for debugging the problem
    if (graph){        
        graphServer(currentTask, solvers, input);
        console.log('Started GUI')
    }
    else{
        process.exit();
    }
    console.log('</>--------------------------------------</>')
    
}
