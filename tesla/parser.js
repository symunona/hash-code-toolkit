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
        n('rides', {length: 'rideCount', indicies: true}, 
            'fromY', 
            'fromX', 
            'toY', 
            'toX', 
            'start',
            'finish'
        )        
    ])

    return parser(rawData)
    
}