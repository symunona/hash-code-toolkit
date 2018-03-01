/**
 * Parse the incoming text file into a Javasript object, 
 * with the use of Jolicitron. Thanks man!
 */

const jolicitron = require("jolicitron")


module.exports = function parse(rawData){

    // This is an example parser for the Youtube example.

    // 1.- Describe the file
    // 2.- Parse it
    // The rest will be taken care of by bostich

    // Note: if you made a mistake, the "remaining" field
    // of the output will not be an empty string.

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