// Stringify the data to google's required format

var output;

module.exports = function(o){
    
    start();
    
    line(o.cacheServers.length);
    o.cacheServers.map((c, i)=>{
        if (c.videos.length){            
            line(i, c.videos.join(' '))
        }    
    })

    return output;
}

function start(){
    output = '';
}

function line(str){
    if (arguments.length>1){
        str = Array.prototype.join.call(arguments, ' ')
    }
    output += str + '\n';
}