// Solve the problem within this file.

const _ = require('underscore')

const lib = require('../lib')

const mrMath = require('../../mr-math')

// Takes the car amount of first rides.

module.exports = function (d, magic) {

    let cars = lib.initCars(d.carCount)

    // get the first car number of rides

    let firstRides = d.rides.slice(0, d.carCount)

    let clock = 0;

    while (clock < d.maxSteps){
        clock++;
        module.exports.moveCars(cars, clock, d.rides)        
    }
    
    return { cars };
}
