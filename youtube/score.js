const _ = require('underscore')

let servers, endpoints

module.exports = function score(algorithmOutput, parsedValue) {

    servers = algorithmOutput.cacheServers
    endpoints = parsedValue.endpoints

    let savedTimesPerRequest = parsedValue.requests.map((r) => {

        let dataServerLatency = parsedValue.endpoints[r.endpointId].toDataServerLatency
        // Look for the shortest route to the video
        let serversHavingTheVideo = getCacheServersForEndpointWithTheVideo(r.endpointId, r.videoId)
        if (serversHavingTheVideo.length){
            let shortestTimeToVideo = _.sortBy(serversHavingTheVideo, 'latency').reverse()[0].latency
            // Is it faster through the data server?
            shortestTimeToVideo = _.min([shortestTimeToVideo, dataServerLatency])    
            return (dataServerLatency - shortestTimeToVideo) * r.requestCount
        }
        return 0
        
    })

    console.warn(savedTimesPerRequest, savedTimesPerRequest.length)

    return _.reduce(savedTimesPerRequest, (r, l)=>r+l, 0)/savedTimesPerRequest.length
}

function getCacheServersForEndpointWithTheVideo(endpointId, videoId) {    
    return endpoints[endpointId].cacheServerLatencies
            .filter((cacheServerEdge) => servers[cacheServerEdge.cacheServerId].videos.includes(videoId))
}