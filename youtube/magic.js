// Reads magic constants from the default magic constant file.

const fs = require('fs')
const consts = require('../consts')

module.exports = function(currentTask){
    let magic = '{}'
    try{
        magic = fs.readFileSync(`./${currentTask}/${consts.magicConstantFile}`, 'utf8')
    } catch(e){
        console.warn('No magic file is present')
    }    
    return JSON.parse(magic)
}