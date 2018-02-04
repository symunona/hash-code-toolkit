// Reads magic constants from the default magic constant file.

const fs = require('fs')
const consts = require('./consts')
const os = require('os')

module.exports = function (currentTask) {
    let magic = '{}'
    try {
        magic = fs.readFileSync(getMagicFileNameForTask(currentTask), 'utf8')
    } catch (e) {
        console.warn('No magic file is present')
    }
    return JSON.parse(magic)
}

module.exports.save = function (currentTask, magic) {
    fs.writeFileSync(getMagicFileNameForTask(currentTask), JSON.stringify(magic));
}

function getMagicFileNameForTask (currentTask) {
    return `./${currentTask}/${os.hostname()}.${consts.magicConstantFile}`
}