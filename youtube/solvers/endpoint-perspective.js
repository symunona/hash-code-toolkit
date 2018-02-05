// Put the video in
const _ = require('underscore')

let servers, serverSize, videos, endpoints, requests

module.exports = function (p) {

    serverSize = p.cacheServerSize
    servers = _.range(p.cacheServerCount).map((i) => { return { videos: [], remaining: serverSize } })
    videos = wrapArray(p.videoSizes, 'size')
    endpoints = p.endpoints
    requests = p.requests


    endpoints.map((endpoint, endpointId) => {
        let videos = getVideosForEndpoint(endpointId)
        // remove already accessible ones
        videos.map((video) => {
            if (!isVideoAlreadyAccessibleFromEndpoint(endpointId, video.id)) {
                let servers = getConnectedServersFromEndpointOrderedByLatency(endpointId)
                let i = 0
                while (i<servers.length && !addVideoToServer(servers[i].server, video.id)) i++;
            }
        })

    })

    return { cacheServers: servers };
}

function getVideosForEndpoint(endpointId) {
    return _.sortBy(requests.filter((r) => r.endpointId === endpointId).map((r) => {
        return {
            id: r.videoId,
            requests: r.requestCount,
            size: videos[r.videoId].size
        }

    }), 'requests').reverse()
}

function isVideoAlreadyAccessibleFromEndpoint(endpointId, videoId) {
    let endpoint = endpoints[endpointId]
    return endpoint.cacheServerLatencies.filter((cacheServer) =>
        servers[cacheServer.cacheServerId].videos.includes(videoId)).length

}

function getConnectedServersFromEndpointOrderedByLatency(endpointId) {
    let endpoint = endpoints[endpointId]
    return _.sortBy(endpoint.cacheServerLatencies.map((relation) => {
        return {
            server: servers[relation.cacheServerId],
            latency: relation.latency
        }
    }), 'latency')
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
    return _.sortBy(endpoints.map((e, i) => {
        e.id = i
        let edge = e.cacheServerLatencies.find((serverEdge) =>
            serverEdge.cacheServerId === serverId)
        e.distance = edge ? edge.latency : undefined
        return e
    })
        .filter((endpoint) => endpoint.distance !== undefined)
        , 'distance')
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
    else {
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