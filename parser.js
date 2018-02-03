const jolicitron = require("jolicitron")


module.exports = function parse(rawData){

    let parser = jolicitron((save, n) =>[
        save('videoCount'),
        save('endpointCount'),
        save('requestDescriptionCount'),
            'cacheServerCount',
            'cacheServerSize',
        n('videoSizes', {length: 'videoCount', indicies: true}),
        n('endpoints', {length: 'endpointCount'},
            'toDataServerLatency',
            save('connectedCacheServerCount'),
            n('cacheServerLatencies', {length: 'connectedCacheServerCount'}, 
            'cacheServerId', 
            'latency')            
        ),        
        n('requests', {length: 'requestDescriptionCount'}, 
            'videoId', 
            'endpointId', 
            'requestCount')
    ])

    return parser(rawData)
    
}