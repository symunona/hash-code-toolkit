// Solve the problem within this file.

const _ = require('underscore')

const lib = require('../lib')

const mrMath = require('../../mr-math')

const loading = require('../../loading')

// Takes the car amount of first rides.

module.exports = function (d, magic) {

    let cars = lib.initCars(d.carCount)

    // get the first car number of rides

    let firstRlides = d.rides.slice(0, d.carCount)

    firstRides.map((ride, i)=>{
        lib.takeRide(cars[i], ride, d.rides, 0);        
    })

    cars = _.sortBy(cars, 'freeAt');

    currentTime = cars[0].freeAt;
    
    loading.start(d.maxSteps)

    while(d.rides.length && currentTime < d.maxSteps){

        let car = cars.shift(); 
        
        car.rides.push(car.currentRide);
        
        // Insert back the car
        currentTime = car.freeAt
        
        loading('_', currentTime)

        let reachableRides = lib.reachableRidesForCarAtTimeSlotOrderedByDistance(car, d.rides, currentTime)

        reachableRides = mrMath.shuffleArray(reachableRides);

        if (reachableRides.length){
            lib.takeRide(car, reachableRides[0], d.rides, currentTime);
        }
        else {
            car.freeAt = d.maxSteps
        }                

        let i = 0
        while(i<cars.length && cars[i].freeAt<car.freeAt) i++;
        cars.splice(i, 0, car);
    }


    cars.map((c)=>{
        delete c.currentlyHeadingTo;
        delete c.currentRide;
        c.rides.map((r)=>{
            delete r.currentlyHeadingCar;
            delete r.car;
            
        })
    });
    

    
    return { cars };
}
