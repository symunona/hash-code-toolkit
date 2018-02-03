// Stringify the data to google's required format

var output;

module.exports = function output(o){
    
    start();
    
    line(o.cacheServers.length);
    o.cacheServers.map((c)=>{
        line()
    })

    return output;
}

function start(){
    output = '';
}

function line(str){
    output += str + '\n';
}