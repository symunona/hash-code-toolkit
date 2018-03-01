/**
 * We get a JS object from the solver with a specific format.
 * Stringify that data to google's required format.
 */

var output;

module.exports = function(o){
    
    start();

    o.cars.map((car)=>{
        line(car.rides.length, _.pluck(car.rides,'index').join(' '))        
    })

    return output;
}



// Helper functions

/**
 * Resets the writer.
 */
function start(){
    output = '';
}

/**
 * Writes a line, with any number of arguments, joined by a space.
 * @param {String} str 
 */
function line(str){
    if (arguments.length>1){
        str = Array.prototype.join.call(arguments, ' ')
    }
    output += str + '\n';
}