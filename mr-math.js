/**
 * This little lib helps us with some recurring problems.
 */

const _ = require('underscore')

module.exports = {}

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
    for(let line = 0; line < matrix.length/2; line++){
        if (line % 2){
            matrix[line].reverse();
            matrix.swap(line, matrix.length-line)            
        }
    }
}
module.exports.around = function(matrix){
    let w = matrix[0].length;
    let h = matrix.length
    let all = w*h;
    let dir = 'r'
    let pos = {x: 0, y: 0}

    let resultVector = []
    
    while (matrix.length>0 && matrix[0].length>0){
        let res = sliceOuterRect(matrix)
        matrix = res.smallMatrix
        resultVector = resultVector.concat(res.rect)
    }

    return module.exports.matricizeVector(resultVector, w)
}

function sliceOuterRect(matrix){
    let width = matrix[0].length
    let height = matrix.length
    let top = matrix[0]
    let right = matrix.map((line)=>line[width-1]).slice(1,height-1)
    let left = matrix.map((line)=>line[0]).slice(1,height-1)
    let bottom = matrix[height-1]

    let rect = _.uniq(top.concat(right).concat(bottom.reverse()).concat(left.reverse()))

    let smallMatrix = matrix.slice(1,height-1).map((line)=>line.slice(1,width-1))
    return {rect, smallMatrix}
}


module.exports.generateMatrixOrder = function(width, height){
    let length = width*height;
    let vector = Array.apply(null, {length}).map(Number.call, Number)
    return module.exports.matricizeVector(vector, width)
}


module.exports.swapElements = function(vector, i, j){
    var tmp = vector[j]
    vector.splice(j, 1, vector[i])
    vector.splice(i, 1, tmp)
    return vector
}

Array.prototype.swap = function(i,j){
    return module.exports.swapElements(this, i, j)
}

module.exports.printMatrix = function(matrix, mapper){
    return matrix.map((line)=>line.map(mapper).join(' ')).join('\n')
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