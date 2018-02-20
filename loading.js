/**
 * This simple loading indicator gets the estimated time and tries to figure out
 * how much time is remaining.
 * In vscode it works with "console": "integratedTerminal" in launch.json
 */

const log = require('single-line-log').stdout;

module.exports = function(){
    module.exports._i++
    // Recalculate ETA every logarithmic tick.    
    if (module.exports._i % (module.exports._etaCheckInterval)){
        eta = module.exports._eta    // Just return the cached value
    } else{          
        eta = module.exports._eta = ((module.exports._total/module.exports._i)*(new Date()-module.exports._startTime)/1000) // recalculate
    }
    let remaining = module.exports._eta - (new Date() - module.exports._startTime)/1000
    if (remaining<0){
        log(`${module.exports._i}/${module.exports._total} Calculating ETA...`)
    } else if (remaining<60){
        log(`${module.exports._i}/${module.exports._total} ETA: ${Math.round(remaining)} seconds`)
    } else if (remaining < 3600){
        log(`${module.exports._i}/${module.exports._total} ETA: ${Math.floor(remaining/60)} minutes`)
    }
    else{
        let hours = Math.floor(remaining/3600)
        let minutes = remaining % 3600
        log(`${module.exports._i}/${module.exports._total} ETA: ${hours} hours and ${minutes} minutes`)
    }
    
}

module.exports.start = function(total){
    module.exports._total = total 
    module.exports._startTime = new Date()
    module.exports._i = 0
    module.exports._etaCheckInterval = 10
    module.exports._eta = -1
}
