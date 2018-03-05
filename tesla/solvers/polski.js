// Solve the problem within this file.

const _ = require('underscore')

const mrMath = require('../../mr-math')

const loading = require('../../loading')

// Takes the car amount of first rides.

module.exports = function (d, magic) {

    let cars = initCars(d.carCount)

    // get the first car number of rides

    let firstRides = d.rides.slice(0, d.carCount)

    let clock = 0;

    console.log('start')
    loading.start(d.maxSteps/10)

    let freeCars = []
    cars.map((c)=>freeCars.push(c))

    let firstRides = d.rides.slice(0, d.carCount)

    firstRides.map((ride, i)=>{
        cars[i].rides.push(ride)                
    })

    

    while (clock < d.maxSteps && d.rides.length){
        if (!(clock%10)) loading();
        clock++;
        moveCars(cars, clock, d.rides, freeCars)        
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


function initCars(n) {
    let cars = []
    // create initial cars
    for (let i = 0; i < n; i++) cars.push({ id: i, x: 0, y: 0, rides: [] })

    return cars
}

 function getAvailableCars(cars) {
    return cars.filter((car) => !car.currentRide)
}

function getRidingCars(cars) {
    return cars.filter((car) => car.currentRide)
}


 function takeRide(car, ride, rides, time, freeCars) {    
    car.currentRide = ride;
    ride.car = car
    car.freeAt = time + ride.length
    car.x = ride.toX
    car.y = ride.toY
    rides.splice(rides.indexOf(ride), 1);
    freeCars.splice(freeCars.indexOf(car), 1);
}

function moveOneTowardsNextRide(car, ride) {
    // console.log(`moving car ${car.id} from`, {x: car.x, y: car.y}, 'towards', {x: ride.fromX, y:ride.fromY})
    return moveCarTowards(car, { x: ride.fromX, y: ride.fromY });
}

function moveCarTowardsNextClosestRide(car, ridesLeft, time, depth, rides){    
    depth = depth || 0
    if (depth > 1) return;
    rides = rides || reachableRidesForCarAtTimeSlotOrderedByDistance(car, time, ridesLeft)    
    if (rides.length){
        let ride = rides[0]
        let someoneIsAlreadyHeadingThere = ride.currentlyHeadingCar;
        if (!someoneIsAlreadyHeadingThere){
            car.currentlyHeadingTo = ride;
            ride.currentlyHeadingCar = car;
        }
        else {
            let myDistance = carRideDistance(car, ride)
            let otherDistance = carRideDistance(someoneIsAlreadyHeadingThere, ride)
            if (myDistance < otherDistance){
                // Hit on that car
                car.currentlyHeadingTo = ride;
                ride.currentlyHeadingCar = car;
            }    
            else{
                // lookForAnotherRide if there is another one                
                return moveCarTowardsNextClosestRide(car, ridesLeft, time, depth+1, rides.slice(1))
            }
        }
        moveOneTowardsNextRide(car, ride)
        return ride;
    }
    return
}

 function moveOneTowardsRideFinish(car) {
    return moveCarTowards(car, { x: car.currentRide.toX, y: car.currentRide.toY });
}

 function isAtDestination(car, ride) {
    return car.x == ride.toX && car.y == ride.toY;
}

function canTakeRideNow(car, ride) {
    return car.x == ride.fromX && car.y == ride.fromY
}

// This shall be random.
function moveCarTowards(car, pos) {
    if (car.y > pos.y) {
        return car.y--
    }
    if (car.y < pos.y) {
        return car.y++
    }
    if (car.x > pos.x) {
        return car.x--
    }
    if (car.x < pos.x) {
        return car.x++
    }
    return 0
}

// freeCars = function (cars, time) {
//     cars.filter((car)=>car.currentRide).map((car)=>{        
//         if (isAtDestination(car, car.currentRide)){
//             cars.rides.push(car.currentRide)
//             car.currentRide = false;
//         }
//     });
//     cars.filter((car)=>car.currentRide).map((car)=>{        
//         if (isAtDestination(car, car.currentRide)){
//             car.currentRide = false;
//         }
//     });    
// }


function reachableRidesForCarAtTimeSlotOrderedByDistance(car, ridesLeft, time) {

    return ridesLeft.filter((ride) => {
        ride.d = carRideDistance(car, ride)
        // The latest time
        return ride.d < ride.finish - ride.length
    }).sort(function (a, b) {
        if (a.d < b.d) return 1;
        if (a.d > b.d) return -1;
        if (a.length < b.length) return 1;
        if (a.length > b.length) return -1;
        return 0;
    })
}

function moveCars(cars, time, ridesLeft, freeCars){
    freeCars.map((car)=>{        
        let closestRide = moveCarTowardsNextClosestRide(car, time, ridesLeft)
        if (closestRide && canTakeRideNow(car, closestRide)){
            // console.log(`${car.id} is taking ${closestRide.index}`);
            takeRide(car, closestRide, ridesLeft, time, freeCars)
        }        
    })

    getRidingCars(cars).map((car)=>{
        if (time == car.freeAt){
            car.rides.push(car.currentRide)
            car.currentRide = false;
        }    
    })   
}

function getCurrentDistanceDistance(car, ride) {
    return Math.abs(ride.fromX - car.x) + Math.abs(ride.fromY - car.y)
}

function distance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function carRideDistance(car, ride) {
    return distance(car.x, car.y, ride.fromX, ride.fromY)
}


function filterNonViableRides (rides) {
    return rides.filter((ride) => {
        return ride.length > ride.finish - ride.start
    })
}
