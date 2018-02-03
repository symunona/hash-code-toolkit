const jolicitron = require("jolicitron")


module.exports = function process(jsonData){

    return JSON.stringify(jsonData, null, 2)
}
