// Solve the problem within this file.

const _ = require('underscore')

const mrMath = require('../../mr-math')

const loading = require('../../loading')

const rnd = require('seedrandom')('batman')

const graphServer = require('../../graph-toolkit/graph-server-async')

// Takes the car amount of first rides.

let magic;
let finishedCars = [];

module.exports = function (d, _magic) {

    return new Promise((resolve, reject) => {

        magic = _magic;

        d.ridesLength = d.rides.length

        let cars = initCars(d.carCount)

        console.log(`Start: carCount: ${d.carCount} rides: ${d.rides.length}`)

        // graphServer.data(cars)
        loading.start(d.maxSteps / 10)

        let freeCars = []
        cars.map((c) => freeCars.push(c))

        // let firstRides = _.sortBy(d.rides, ).slice(0, d.carCount)

        // firstRides.map((ride, i) => {
        //     takeRide(cars[i], ride, d.rides, 0, freeCars);
        // })

        // cars = _.sortBy(cars, 'freeAt');

        let clock = 0; //cars[0].freeAt;


        mainLoop()

        function mainLoop() {
            while (clock < d.maxSteps && d.rides.length && finishedCars.length < cars.length) {
                
                moveCars(cars, clock, d.rides, freeCars)

                clock++;

                if (!(clock % 10)) {
                    loading();
                    let filteredCars = []
                    for (var i = 0; i < cars.length; i++) filteredCars.push({
                        x: cars[i].x,
                        y: cars[i].y,
                        id: i
                    });                    
                    graphServer.send(filteredCars)
                    // let the loop go
                    setTimeout(mainLoop, 10)
                    return;
                }
            }

            console.log('end!', clock)

            cars.map((c) => {
                delete c.currentRide;
                delete c.currentlyHeadingTo;
                c.rides.map((r) => {
                    delete r.currentlyHeadingCar;
                    delete r.car;
                })
            });
            resolve({ cars })

        }

        // return {cars}
    });
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

function moveCarTowardsNextClosestRide(car, ridesLeft, time, depth, rides) {
    depth = depth || 0
    if (depth > magic.depth) {
        if (rides && rides.length) {
            moveOneTowardsNextRide(car, rides[0])
            return rides[0];
        }
        else {
            console.warn(`${car.id} does not know what to do now...`)
            return;
        }
    }
    rides = rides ||
        reachableRidesForCarAtTimeSlotOrderedByDistance(car, ridesLeft, time)
            .sort(dSorter)
    if (rides.length) {
        let ride = rides[0]
        let someoneIsAlreadyHeadingThere = ride.currentlyHeadingCar;
        if (someoneIsAlreadyHeadingThere === car) {
            moveOneTowardsNextRide(car, ride)
        }
        else
            if (!someoneIsAlreadyHeadingThere) {
                car.currentlyHeadingTo = ride;
                ride.currentlyHeadingCar = car;
                console.warn(`Assigning ${car.id} to ${ride.index} d = ${ride.d}`)
            }
            else {
                let myDistance = carRideDistance(car, ride)
                let otherDistance = carRideDistance(someoneIsAlreadyHeadingThere, ride)
                if (myDistance < otherDistance) {
                    // Hit on that car
                    console.warn(`Switching now from ${someoneIsAlreadyHeadingThere.id} to ${car.id} is heading to ${ride.index}`)
                    car.currentlyHeadingTo = ride;
                    ride.currentlyHeadingCar = car;
                }
                else {
                    // lookForAnotherRide if there is another one                
                    return moveCarTowardsNextClosestRide(car, ridesLeft, time, depth + 1, rides.slice(1))
                }
            }


        return ride;
    } else {
        car.finished = true
        console.warn(`Car ${car.id} has finished forever`);
        finishedCars.push(car)
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

    let dir = { x: 0, y: 0 }

    if (car.y > pos.y) {
        dir.y = -1
    }
    if (car.y < pos.y) {
        dir.y = 1
    }
    if (car.x > pos.x) {
        dir.x = -1
    }
    if (car.x < pos.x) {
        dir.x = 1
    }
    // random routing
    if (dir.x != 0 && dir.y != 0) {
        if (rnd() > 0.5) {
            car.x += dir.x
        }
        else {
            car.y += dir.y
        }
    }
    else {
        // Only one will be not zero.
        car.x += dir.x;
        car.y += dir.y
    }

    if (dir.x == 0 && dir.y == 0) {
        console.log(`Car ${car.id} has arrived at `, pos)
    } else {
        // console.log(`Moving car ${car.id} towards `, car, pos)
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
    })
}

function moveCars(cars, time, ridesLeft, freeCars) {

    getRidingCars(cars).map((car) => {
        if (time == car.freeAt) {
            car.rides.push(car.currentRide)
            car.currentRide = false;
            freeCars.push(car);
            console.log(`${car.id} has arrived at destination`, { x: car.x, y: car.y }, ` at ${time}. \n`);
        }
    })

    freeCars.map((car) => {
        let closestRide = moveCarTowardsNextClosestRide(car, ridesLeft, time)
        if (closestRide && canTakeRideNow(car, closestRide)) {
            console.log(`${car.id} is taking ${closestRide.index} to`, { x: closestRide.toX, y: closestRide.toY }, `at ${time} expected arrival: ${time + closestRide.length}`);
            takeRide(car, closestRide, ridesLeft, time, freeCars)
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


function filterNonViableRides(rides) {
    return rides.filter((ride) => {
        return ride.length > ride.finish - ride.start
    })
}




function rideValue(ride) {
    return ride.d + (ride.bonus ? bonus : 0)
}


function dSorter(a, b) {
    let av = rideValue(a), bv = rideValue(b)
    if (av < bv) return 1;
    if (av > bv) return -1;
    if (a.length < b.length) return 1;
    if (a.length > b.length) return -1;
    return 0;
}


