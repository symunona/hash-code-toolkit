
const _ = require('underscore')

module.exports = {}

module.exports.initCars = function (n) {
    let cars = []
    // create initial cars
    for (let i = 0; i < n; i++) cars.push({ id: i, x: 0, y: 0, rides: [] })

    return cars
}

module.exports.getAvailableCars = function (cars) {
    return cars.filter((car) => car.currentRide)
}

module.exports.getRidingCars = function (cars) {
    return cars.filter((car) => !car.currentRide)
}


module.exports.takeRide = function (car, ride, rides) {    
    car.currentRide = ride;
    ride.car = car
    rides.splice(rides.indexOf(ride), 1);
}

module.exports.moveOneTowardsNextRide = function (car, ride) {
    return module.exports.moveCarTowards(car, { x: ride.fromX, y: ride.fromY });
}

module.exports.moveCarTowardsNextClosestRide = function(car, ridesLeft, time){
    let rides = module.exports.reachableRidesForCarAtTimeSlotOrderedByDistance(car, ridesLeft, time)
    let ride = rides[0]
    return ride = module.exports.moveOneTowardsNextClosestRide(car, ride)
}

module.exports.moveOneTowardsRideFinish = function (car, ride) {
    return module.exports.moveCarTowards(car, { x: ride.toX, y: ride.toY });
}

module.exports.isAtDestination = function (car, ride) {
    return car.x == ride.toX && car.y == ride.toY;
}

module.exports.canTakeRideNow = function (car, ride) {
    return car.x == ride.fromX && car.y == ride.fromY
}

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
        ride.d = carRideDistance(car, ride)
        // The latest time
        return distance < ride.finish - ride.length
    }).sort(function (a, b) {
        if (a.d < b.d) return 1;
        if (a.d > b.d) return -1;
        if (a.length < b.length) return 1;
        if (a.length > b.length) return -1;
        return 0;
    })
}

module.exports.moveCars = function(cars, time, ridesLeft){
    module.exports.getAvailableCars(cars).map((car)=>{        
        let closestRide = module.exports.moveCarTowardsNextClosestRide(car, time, ridesLeft)
        if (module.exports.canTakeRideNow(car, closestRide)){
            module.exports.takeRide(car, ride, ridesLeft)
        }        
    })
    module.exports.getRidingCars(cars).map((car)=>{
        if (module.exports.isAtDestination(car, car.currentRide)){
            cars.rides.push(car.currentRide)
            car.currentRide = false;
        } else{
            module.exports.moveOneTowardsRideFinish(car)
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


module.exports.canTakeRide = function (car, ride, time) {

}

