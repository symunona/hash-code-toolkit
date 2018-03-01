/**
 * For comparing algorithms, we might be better off with a way
 * to measure it's performance. We have to measure it specific
 * to the task, here we get the parsedValue of the input, and 
 * the output of the solver in place, to measure how well 
 * it performed.
 * 
 * This module is optional, but really nice to have.
 */

const _ = require('underscore')

module.exports = function score(algorithmOutput, parsedValue) {
    
    let score = 0

    algorithmOutput.cars.map((car)=>{
        car.rides.map((ride)=>{
            score += ride.length
            if (ride.start == ride.actualStart){
                score+= parsedValue.bonus
            }
        })
    })    

    return score;
}
