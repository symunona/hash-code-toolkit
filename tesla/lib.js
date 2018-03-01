
module.exports = {}

module.exports.initCars = function(n){
    let cars = []
    // create initial cars
    for (let i = 0; i < n; i++) cars.push({ x: 0, y: 0, rides: [] })

    return cars
}


module.exports.getDistance = function(){

}