/**
 * Parse the incoming text file into a Javasript object, 
 * with the use of Jolicitron. Thanks man!
 */

const jolicitron = require("jolicitron")


module.exports = function parse(rawData){


    let parser = jolicitron((save, n) =>[
        'cityHeight',
        'cityWidth',
        'carCount',
        save('rideCount'),
        'bonus',
        'maxSteps',                
        n('rides', {length: 'rideCount', indices: true}, 
            'fromY', 
            'fromX', 
            'toY', 
            'toX', 
            'start',
            'finish'
        )        
    ])

    let data = parser(rawData)
    data.parsedValue.rides.map((ride)=>{
        ride.length = Math.abs(ride.fromX-ride.toX)+Math.abs(ride.fromY-ride.toY)
    })

    return data
    
}