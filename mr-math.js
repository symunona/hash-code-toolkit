/**
 * This little lib helps us with some recurring problems.
 */


module.exports = {}

/**
 * FlattenMatrix
 * @param {Array[][]} matrix
 * @returns {Array} vector 
 */
module.exports.vectorizeMatrix = function (matrix) {
    return matrix.reduce((prev, cur) => prev.concat(cur), [])
}

module.exports.matricizeVector = function (vector, width) {    
    let matrix = []
    for (let i = 0, j = vector.length; i < j; i += width) {
        matrix.push(vector.slice(i, i + width))        
    }
    return matrix
}

module.exports.topBottomOrder = function(matrix){

    // for(let line)
}

module.exports.swapElements = function(vector, i, j){
    var tmp = vector[j]
    vector.splice(j, 1, vector[i])
    vector.splice(i, 1, tmp)
    return vector
}

// Array.prototype.swap = module.expr