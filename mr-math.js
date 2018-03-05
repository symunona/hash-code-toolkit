/**
 * This little lib helps us with some recurring problems.
 */

const _ = require('underscore')
const seedrandom = require('seedrandom');

module.exports = {}

Array.prototype.swap = function (i, j) {
    return module.exports.swapElements(this, i, j)
}

module.exports.generateMatrixOrder = function (width, height) {
    let length = width * height;    
    let vector = [], i=0
    while(i<length) vector.push(i++);
    // This does not work with too many args.
    // Array.apply(null, { length }).map(Number.call, Number)
    return module.exports.matricizeVector(vector, width)
}


module.exports.swapElements = function (vector, i, j) {
    var tmp = vector[j]
    vector.splice(j, 1, vector[i])
    vector.splice(i, 1, tmp)
    return vector
}

module.exports.printMatrix = function (matrix, mapper) {
    return matrix.map((line) => line.map(mapper).join(' ')).join('\n')
}

module.exports.generateArrayOrder = function (length) {
    return Array.apply(null, { length }).map(Number.call, Number)
}


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

module.exports.topBottomOrder = function (matrix) {
    let newMatrix = []
    for (let line = 0; line < matrix.length; line++) {
        newMatrix.push(matrix[line].slice(0));
    }

    for (let line = 0; line < matrix.length / 2; line++) {
        if (line % 2) {
            newMatrix[line].reverse();
            newMatrix.swap(line, newMatrix.length - line)
        }
    }
    return newMatrix
}

module.exports.around = function (matrix) {
    let w = matrix[0].length;

    let resultVector = []

    while (matrix.length > 0 && matrix[0].length > 0) {
        let res = sliceOuterRect(matrix)
        matrix = res.smallMatrix
        resultVector = resultVector.concat(res.rect)
    }

    return module.exports.matricizeVector(resultVector, w)
}

module.exports.shuffleArray = function (array, rnd) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    rnd = rnd || seedrandom('batman')
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor((rnd()) * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

module.exports.randomOrder = function (matrix, seed) {
    let w = matrix[0].length;

    let rnd = seedrandom(seed || 'batman') // who would not?    

    let vector = module.exports.vectorizeMatrix(matrix)

    let resultVector = module.exports.shuffleArray(vector, rnd)

    return module.exports.matricizeVector(resultVector, w)
}

function sliceOuterRect(matrix) {
    let width = matrix[0].length
    let height = matrix.length
    let top = matrix[0]
    let right = matrix.map((line) => line[width - 1]).slice(1, height - 1)
    let left = matrix.map((line) => line[0]).slice(1, height - 1)
    let bottom = matrix[height - 1]

    let rect = _.uniq(top.concat(right).concat(bottom.reverse()).concat(left.reverse()))

    let smallMatrix = matrix.slice(1, height - 1).map((line) => line.slice(1, width - 1))
    return { rect, smallMatrix }
}



// testAround()

// function testAround(){

//     let matrix = module.exports.generateMatrixOrder(3, 5)
//     console.log(module.exports.printMatrix(matrix, (e)=>' '+String(e).length==1?'0'+e:String(e)));
//     let newMatrix = module.exports.around(matrix)
//     console.log('2222')
//     console.log(module.exports.printMatrix(newMatrix, (e)=>' '+String(e).length==1?'0'+e:String(e)));

// }
// tests()

// function tests(){
//     let matrix = module.exports.generateMatrixOrder(3, 5)
//     console.log(module.exports.printMatrix(matrix, (e)=>' '+String(e).length==1?'0'+e:String(e)));
//     module.exports.topBottomOrder(matrix)
//     console.log('2222')
//     console.log(module.exports.printMatrix(matrix, (e)=>' '+String(e).length==1?'0'+e:String(e)));

// }