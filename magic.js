// Reads magic constants from the default magic constant file.

const fs = require('fs')
const consts = require('./consts')
const os = require('os')

module.exports = function (currentTask, solverName) {
    let magic = '{}'
    try {
        magic = fs.readFileSync(getMagicFileNameForTask(currentTask, solverName), 'utf8')
    } catch (e) {} // Do not fail, we do not have a magic file for this solver.
    return JSON.parse(magic)
}

module.exports.save = function (currentTask, solverName, magic) {
    fs.writeFileSync(getMagicFileNameForTask(currentTask, solverName), JSON.stringify(magic));
}

function getMagicFileNameForTask (currentTask, solverName) {
    return `./${currentTask}/${consts.solversFolderName}/${solverName}.${consts.magicConstantFile}`
}