/**
 * We get a JS object from the solver with a specific format.
 * Stringify that data to google's required format.
 */

var output;

module.exports = function(o){
    
    start();
    
    line(o.slices.length);

    o.slices.map((slice)=>{
        line(slice.x, slice.y, slice.x+slice.w, slice.y+slice.h)
    });
    // Example: 

    // line(o.cacheServers.length);
    // o.cacheServers.map((c, i)=>{
    //     if (c.videos.length){            
    //         line(i, c.videos.join(' '))
    //     }    
    // })

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