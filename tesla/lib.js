
const _ = require('underscore')

module.exports = {}

module.exports.initCars = function (n) {
    let cars = []
    // create initial cars
    for (let i = 0; i < n; i++) cars.push({ id: i, x: 0, y: 0, rides: [] })

    return cars
}

module.exports.getAvailableCars = function (cars) {
    return cars.filter((car) => !car.currentRide)
}

module.exports.getRidingCars = function (cars) {
    return cars.filter((car) => car.currentRide)
}


module.exports.takeRide = function (car, ride, rides, time) {    
    car.currentRide = ride;
    ride.car = car
    car.freeAt = time + ride.length
    car.x = ride.toX
    car.y = ride.toY
    rides.splice(rides.indexOf(ride), 1);
}

module.exports.moveOneTowardsNextRide = function (car, ride) {
    // console.log(`moving car ${car.id} from`, {x: car.x, y: car.y}, 'towards', {x: ride.fromX, y:ride.fromY})
    return module.exports.moveCarTowards(car, { x: ride.fromX, y: ride.fromY });
}

module.exports.moveCarTowardsNextClosestRide = function(car, ridesLeft, time, depth, rides){    
    depth = depth || 0
    if (depth > 1) return;
    rides = rides || module.exports.reachableRidesForCarAtTimeSlotOrderedByDistance(car, time, ridesLeft)    
    if (rides.length){
        let ride = rides[0]
        let someoneIsAlreadyHeadingThere = ride.currentlyHeadingCar;
        if (!someoneIsAlreadyHeadingThere){
            car.currentlyHeadingTo = ride;
            ride.currentlyHeadingCar = car;
        }
        else {
            let myDistance = module.exports.carRideDistance(car, ride)
            let otherDistance = module.exports.carRideDistance(someoneIsAlreadyHeadingThere, ride)
            if (myDistance < otherDistance){
                // Hit on that car
                car.currentlyHeadingTo = ride;
                ride.currentlyHeadingCar = car;
            }    
            else{
                // lookForAnotherRide if there is another one                
                return module.exports.moveCarTowardsNextClosestRide(car, ridesLeft, time, depth+1, rides.slice(1))
            }
        }
        module.exports.moveOneTowardsNextRide(car, ride)
        return ride;
    }
    return
}

module.exports.moveOneTowardsRideFinish = function (car) {
    return module.exports.moveCarTowards(car, { x: car.currentRide.toX, y: car.currentRide.toY });
}

module.exports.isAtDestination = function (car, ride) {
    return car.x == ride.toX && car.y == ride.toY;
}

module.exports.canTakeRideNow = function (car, ride) {
    return car.x == ride.fromX && car.y == ride.fromY
}

// This shall be random.
module.exports.moveCarTowards = function (car, pos) {
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

// module.exports.freeCars = function (cars, time) {
//     cars.filter((car)=>car.currentRide).map((car)=>{        
//         if (module.exports.isAtDestination(car, car.currentRide)){
//             cars.rides.push(car.currentRide)
//             car.currentRide = false;
//         }
//     });
//     cars.filter((car)=>car.currentRide).map((car)=>{        
//         if (module.exports.isAtDestination(car, car.currentRide)){
//             car.currentRide = false;
//         }
//     });    
// }

module.exports.reachableRidesForCarAtTimeSlotOrderedByDistance = function (car, ridesLeft, time) {

    return ridesLeft.filter((ride) => {
        ride.d = module.exports.carRideDistance(car, ride)
        ride.bonus = ride.d<ride.start
        // The latest time
        return ride.d < ride.finish - ride.length
    })
}


module.exports.moveCars = function(cars, time, ridesLeft, freeCars){
    freeCars.map((car)=>{        
        let closestRide = module.exports.moveCarTowardsNextClosestRide(car, time, ridesLeft)
        if (closestRide && module.exports.canTakeRideNow(car, closestRide)){
            // console.log(`${car.id} is taking ${closestRide.id}`);
            module.exports.takeRide(car, closestRide, ridesLeft)
        }        
    })

    module.exports.getRidingCars(cars).map((car)=>{
        if (time == car.freeAt){
            car.rides.push(car.currentRide)
            car.currentRide = false;
        }    
    })   
}

module.exports.getCurrentDistanceDistance = function (car, ride) {
    return Math.abs(ride.fromX - car.x) + Math.abs(ride.fromY - car.y)
}

module.exports.distance = function (x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

module.exports.carRideDistance = function (car, ride) {
    return module.exports.distance(car.x, car.y, ride.fromX, ride.fromY)
}


module.exports.filterNonViableRides = function (rides) {
    return rides.filter((ride) => {
        return ride.length > ride.finish - ride.start
    })
}
