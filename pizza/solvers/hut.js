// Solve the problem within this file.

const _ = require('underscore')

let pizza, min, max, h, w

module.exports = function (p) {

    pizza = p.bitmap
    min = p.min
    max = p.max
    h = p.rows
    w = p.cols

    let pos = { x: 0, y: 0 }

    let allSlices = findAllPossibleSlices()

    // let pizzaType = verticalOrHorizontalPizzaItIs(allSlices)

    // if (pizzaType.vertical > pizzaType.horizontal) {
    //     sortPossibleSlicesWithAlignmentPreference(allSlices, pizzaType)
    // }

    let slices = selectNonConflictingSlices(allSlices);

    return {slices, map: generateColorMap(allSlices)}
}

function generateColorMap(allSlices){
    let map = []
    for (let x = 0; x < w; x++) {
        map[x] = []
        for (let y = 0; y < h; y++) {
            map[x][y] = allSlices[x][y].color || 0
        }
    }
    return map;
}


function selectNonConflictingSlices(allSlices) {
    let slices = []
    for (let x = 0; x < w; x++) {        
        for (let y = 0; y < h; y++) {
            for (let i=0; i<allSlices[x][y].length; i++ ){
                if (canPutinSlice(allSlices, {x,y}, allSlices[x][y][i])){
                    putinSlice(allSlices, {x,y}, allSlices[x][y][i]);
                    slices.push(allSlices[x][y][i])
                }                
            }
        }
    }
    return slices
}

/**
 * Note: Putin is everywhere. Not only in Ukraine...
 * @param {*} allSlices 
 * @param {*} pos 
 * @param {*} slice 
 */
function canPutinSlice(allSlices, pos, slice){

    for(var x=0; x< slice.x; x++){
        for(var y=0; y< slice.y; y++){
            if (allSlices[pos.x+x][pos.y+y].taken){
                return false
            }
        }
    }
    return true
}

function putinSlice(allSlices, pos, slice){

    for(var x=0; x< slice.x; x++){
        for(var y=0; y< slice.y; y++){
            allSlices[pos.x+x][pos.y+y].taken = slice
        }
    }    
}


function sortPossibleSlicesWithAlignmentPreference(allSlices) {
    let axisPref = pizzaType.vertical > pizzaType.horizontal ? 'y' : 'x'

    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            allSlices[x][y] = allSlices[x][y].sort(sortByDimensionPreference.bind(this, axisPref))
        }
    }
}


function sortByDimensionPreference(mainAxis, a, b) {

    let secAxis = mainAxis == 'y' ? 'x' : 'y';
    if (a[mainAxis] > b[mainAxis]) return 1;
    if (a[mainAxis] < b[mainAxis]) return -1;
    if (a[mainAxis] == b[mainAxis]) return a[secAxis] < b[secAxis] ?
        1 : a[secAxis] < b[secAxis] ? -1 : 0;

}


function verticalOrHorizontalPizzaItIs(allSlices) {

    let vertical = 0; horizontal = 0; square = 0

    for (let x = 0; x < w; x++) {
        allSlices[x] = []
        for (let y = 0; y < h; y++) {
            allSlices[x][y].map((piece) => {
                if (piece.x > piece.y) horizontal++
                if (piece.x < piece.y) vertical++
                if (piece.x == piece.y) square++
            })
        }
    }

    console.log(`vertical: ${vertical}, horizontal: ${horizontal}, square: ${square}`)

    return { vertical, horizontal, square }
}

function findAllPossibleSlices() {    
    let allSlices = []
    for (let x = 0; x < w; x++) {
        allSlices[x] = []
        for (let y = 0; y < h; y++) {
            allSlices[x][y] = possibleSlicesAtPos({ x, y })
        }
    }
    return allSlices
}

function whatsOnTheSlice(pos, size) {
    let ret = { t: 0, m: 0 }
    for (let y = pos.y; y < pos.y + size.y; y++) {
        let line = pizza[y].substr(pos.x, size.x)
        ret.t += line.replace(/M/g, '').length
        ret.m += line.replace(/T/g, '').length
    }
    return ret
}

function possibleSlicesAtPos(pos) {
    let results = []
    for (let i = 0; i < max; i++) {
        for (let j = 0; j < max; j++) {
            // if slice is smaller than max size
            if (i + j < max && pos.x+i<w && pos.y+j<h) {
                // if slice have enough stuff on it
                let size = { x: i, y: j }
                if (isSliceGood(whatsOnTheSlice(pos, size))) {
                    size.color = randomColor()
                    results.push(size)
                }
            }
        }
    }
    return results;
}

function isSliceGood(slice) {
    return slice.t > min && slice.m > min
}

function randomColor(){
    return '#'+(Math.random()*0xFFFFFF<<0).toString(16);
}