// Solve the problem within this file.

const _ = require('underscore')

const lib = require('../lib')

const mrMath = require('../../mr-math')

const loading = require('../../loading')

// Takes the car amount of first rides.

module.exports = function (d, magic) {

    let cars = lib.initCars(d.carCount)

    // get the first car number of rides

    let firstRides = d.rides.slice(0, d.carCount)

    let clock = 0;

    console.log('start')
    loading.start(d.maxSteps/10)

    let freeCars = []
    cars.map((c)=>freeCars.push)

    while (clock < d.maxSteps && d.rides.length){
        if (!(clock%10)) loading();
        clock++;
        lib.moveCars(cars, clock, d.rides, freeCars)        
    }

    console.log('end!', clock)
    
    cars.map((c)=>{
        delete c.currentlyHeadingTo;
        c.rides.map((r)=>{
            delete r.currentlyHeadingCar;
            delete r.car;
        })
    });
    
    return { cars };
}
