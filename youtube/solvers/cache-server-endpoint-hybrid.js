/**
 * This one is combining the endpoint perspective and the 
 * cache server perspectives. The cache server was going through the 
 * cache servers linearily, now we try to go from the most valuable ones to
 * the least valuable ones.
 */
const _ = require('underscore'), Progress = require('progress');
const loading = require('../../loading')

let servers, serverSize, videos, endpoints, requests

module.exports = function(p) {

    serverSize = p.cacheServerSize
    servers = _.range(p.cacheServerCount).map((i) => { return { videos: [], remaining: serverSize, id: i, maxGain: 0 } })
    videos = wrapArray(p.videoSizes, 'size')
    endpoints = p.endpoints
    requests = p.requests

    getCacheServersOrderedByMaxPossibleValue()
    servers = _.sortBy(servers, 'maxGain').reverse() // start with the most valuable

    loading.start(servers.length)

    servers.map((server) => {
        
        let serverId = server.id
        loading()

        // Step 1 : collect the videos, and assign them a value for a specific cache server by summing upt it's net gain if it is in.
        let videoValuesPerCacheServer = []
        
        let connectedEndpoints = getConnectedEndpoints(serverId)

        let requestsOnServerByVideo = {}

        connectedEndpoints.map((endpoint) => {
            let videoRequestsForEndpoint = getVideoRequestsForEndpoints(endpoint.id)            
            // Calculate request value per server. Note that we do NOT create an object, the request's value will be server specific
            // and we overwrite it in another iteration.        
            videoRequestsForEndpoint
                // Filter out requests which have been cached already
                .filter((r)=>!r.cached)
                .map((r) => {
                r.value = (endpoint.toDataServerLatency - endpoint.distance) * r.requestCount
                requestsOnServerByVideo[r.videoId] = requestsOnServerByVideo[r.videoId] || []
                requestsOnServerByVideo[r.videoId].push(r)
            })            
        })

        // Step 2 : Compute video values by their queue 
        Object.keys(requestsOnServerByVideo).map((videoId)=>{            
            videoValuesPerCacheServer.push({
                videoId: Number(videoId),
                requestList: requestsOnServerByVideo[videoId],
                value: requestsOnServerByVideo[videoId].reduce(
                    (currentValue, r)=>{
                        return r.value+currentValue
                    }
                    , 0)
                
            })
        })

        // Step 3 : sort the videos, and put the most in it from top.

        let sortedVideos = _.sortBy(videoValuesPerCacheServer, 'value').reverse() // so we start with the biggest value

        for (let vid = 0; vid < sortedVideos.length; vid++) {
            if (server.remaining === 0) break;                        
            if (addVideoToServer(server, sortedVideos[vid].videoId)){
                // Mark the requests as processed.
                sortedVideos[vid].requestList.map((r)=>r.cached = true)
            }
        }

    })

    return { cacheServers: servers };
}

function getVideoRequestsForEndpoints(endpointId) {
    return requests.filter((r) => r.endpointId === endpointId)
}

/**
 * Retrurns the endpoint array connected to a specific server, ordered by
 * the time distance to it. 
 * @param {Number} serverId 
 * @returns {Array}
 */
function getConnectedEndpoints(serverId) {
    return endpoints.map((e, i) => {
        e.id = i
        let edge = e.cacheServerLatencies.find((serverEdge) =>
            serverEdge.cacheServerId === serverId)
        
        // Trick: we extend the original object's distance property so it does not consume memory. This will be overwritten on every server!!!
        e.distance = edge ? edge.latency : undefined
        return e
    })
        .filter((endpoint) => endpoint.distance !== undefined)
        
}

function addVideoToServer(server, videoId) {
    let videoSize = videos[videoId].size
    if (doesItFitTheServer(server, videoSize)) {
        if (!server.videos.includes(videoId)) { } {
            server.videos.push(videoId)
            server.remaining -= videoSize
        }
        // console.log('video added:', videos[videoId], server)
        return true
    }
    else{
        // console.log('video does not fit:', videos[videoId], server)
    }
    return false
}

function doesItFitTheServer(server, videoSize) {
    return server.remaining >= videoSize
}


function wrapArray(array, variableName) {
    return array.map((elementValue, i) => {
        let element = { id: i }
        element[variableName] = elementValue
        return element
    })
}


function getCacheServersOrderedByMaxPossibleValue(){
    requests.map((r)=>{
        // Get endpoints's closest server
        let closestServerToEndpoint = _.sortBy(endpoints[r.endpointId].cacheServerLatencies||[], 'latency')[0]
        if (closestServerToEndpoint && 
            closestServerToEndpoint.latency < endpoints[r.endpointId].toDataServerLatency){                
                servers[closestServerToEndpoint.cacheServerId].maxGain += 
                r.requestCount * (endpoints[r.endpointId].toDataServerLatency-closestServerToEndpoint.latency);
            }
    })
}

