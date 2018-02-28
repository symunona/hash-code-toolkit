// Solve the problem within this file.

const _ = require('underscore')
const loading = require('../../loading')

let pizza, min, max, h, w

module.exports = function (p) {

    pizza = p.bitmap
    min = p.min
    max = p.max
    h = p.rows
    w = p.cols

    let pos = { x: 0, y: 0 }

    let allSlices = findAllPossibleSlices()

    let pizzaType = verticalOrHorizontalPizzaItIs(allSlices)

    sortPossibleSlicesWithAlignmentPreference(allSlices, pizzaType)
    
    let slices = selectNonConflictingSlices(allSlices);

    return { slices, map: generateColorMap(allSlices) }
}

function generateColorMap(allSlices) {
    let map = []
    for (let y = 0; y < h; y++) {
        map[y] = []
        for (let x = 0; x < w; x++) {
            map[y][x] = allSlices[y][x].taken ? allSlices[y][x].taken.color : 0
        }
    }
    return map;
}


function selectNonConflictingSlices(allSlices) {
    
    console.log('Picking slices...')
    loading.start(h*w)

    let slices = []
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            loading()
            for (let i = 0; i < allSlices[y][x].length; i++) {
                let slice = allSlices[y][x][i]
                
                // if (x==3 && y ==0) debugger
                if (canPutinSlice(allSlices, { x, y }, slice)) {
                    _.extend(slice, { x, y })
                    putinSlice(allSlices, { x, y }, slice);
                    slices.push(slice)
                    // console.log(slice)
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
function canPutinSlice(allSlices, pos, slice) {

    for (var y = 0; y < slice.h; y++) {
        for (var x = 0; x < slice.w; x++) {
        
            if (allSlices[pos.y + y][pos.x + x].taken) {
                return false
            }
        }
    }
    return true
}

function putinSlice(allSlices, pos, slice) {

    for (var y = 0; y < slice.h; y++) {
        for (var x = 0; x < slice.w; x++) {        
            allSlices[pos.y + y][pos.x + x].taken = slice
        }
    }
}


function sortPossibleSlicesWithAlignmentPreference(allSlices, pizzaType) {
    let axisPref = pizzaType.vertical > pizzaType.horizontal ? 'h' : 'w'

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {        
            allSlices[y][x] = allSlices[y][x].sort(sortByDimensionPreference.bind(this, axisPref)).reverse()
        }
    }
}


function sortByDimensionPreference(mainAxis, a, b) {
    
    let secAxis = mainAxis == 'y' ? 'w' : 'h';
    if (a[mainAxis] > b[mainAxis]) return 1;
    if (a[mainAxis] < b[mainAxis]) return -1;
    if (a[mainAxis] == b[mainAxis]) return a[secAxis] < b[secAxis] ?
        1 : a[secAxis] < b[secAxis] ? -1 : 0;

}


function verticalOrHorizontalPizzaItIs(allSlices) {

    let vertical = 0; horizontal = 0; square = 0

    for (let x = 0; x < w; x++) {        
        for (let y = 0; y < h; y++) {
            allSlices[y][x].map((piece) => {
                if (piece.w > piece.h) horizontal++
                if (piece.w < piece.h) vertical++
                if (piece.w == piece.h) square++
            })
        }
    }

    console.log(`vertical: ${vertical}, horizontal: ${horizontal}, square: ${square}`)

    return { vertical, horizontal, square }
}

function findAllPossibleSlices() {

    console.log('Finding slices...')
    loading.start(h*w)

    let allSlices = []
    for (let y = 0; y < h; y++) {
        allSlices[y] = []
        for (let x = 0; x < w; x++) {
            loading()
            allSlices[y][x] = possibleSlicesAtPos({ x, y })
        }
    }
    return allSlices
}

function whatsOnTheSlice(pos, size) {
    let ret = { t: 0, m: 0 }
    for (let y = pos.y; y < h && y < pos.y + size.h; y++) {
        let line = pizza[y].substr(pos.x, size.w)
        ret.t += line.replace(/M/g, '').length
        ret.m += line.replace(/T/g, '').length
    }
    return ret
}

function possibleSlicesAtPos(pos) {
    let results = []
    for (let i = 1; i < max; i++) {
        for (let j = 1; j < max; j++) {
            // if slice is smaller than max size
            if (i * j > 1 && i * j <= max && pos.x + i < w && pos.y + j < h) {
                // if slice have enough stuff on it
                let size = { h: i, w: j }
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
    return slice.t >= min && slice.m >= min
}

function randomColor() {
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
}