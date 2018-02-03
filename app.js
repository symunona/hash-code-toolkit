// Input: 
const input = [
    'test',
    'me_at_the_zoo',
    // 'kittens',
    // ''
]
const force = false; // Scotty!... oh wait, that's another one.

const inputExtension = '.in', outputExtension = '.out';
const inputFolder = './input-data-set/', outputFolder = './output/';

// -----------------------------------------------------------------

const fs = require('fs')

const processData = require('./process')

const parser = require('./parser')

const bostich = require('bostich')

const graphServer = require('./ghash-toolkit/graph-server')

let graph
try{
    graph = require('./graph')    
} catch(e){
    console.error(e)
    console.log('No visualisations for you today :(')}

// Input the grading kit.
let measure;
try{
    measure = require('./measure')
} catch(e){ console.log('No grading is in place') }


for (let i in input) {
    let inputFileName = inputFolder + input[i] + inputExtension
    let inputParsedFileName = inputFolder + input[i] + '.cache.json'
    let outputFileName = outputFolder + input[i] + outputExtension
    console.log('<o>--------------------------------------<o>')
    console.log(`Loading data for ${inputFileName}...`)    
    
    parsedData = bostich(inputFileName, parser, force)

    console.log('Processing...')
    let processingStart = new Date()
    let results = processData(parsedData)
    
    console.log('Processed in', (new Date()-processingStart)/1000)

    console.log(`Writing out to ${outputFileName}...`)
    fs.writeFileSync(outputFileName, results);

    if (graph){
        graphServer(inputParsedFileName);
    }

    if (measure){
        console.log(`Measuring how cool it is...`)        
        let stats = measure(results)
        if (stats){
            console.log(`Score: ${stats}`)        
        }
        else{
            console.log(`No luck with this...`)        
        }
        
    }
    console.log('</>--------------------------------------</>')
}

// process.exit();
