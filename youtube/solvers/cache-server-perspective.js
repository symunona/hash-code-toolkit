// Put the video in
const _ = require('underscore')

let servers, serverSize, videos, endpoints, requests

module.exports = function(p) {

    serverSize = p.cacheServerSize
    servers = _.range(p.cacheServerCount).map((i) => { return { videos: [], remaining: serverSize } })
    videos = wrapArray(p.videoSizes, 'size')
    endpoints = p.endpoints
    requests = p.requests

    servers.map((server, serverId) => {
        let connectedEndpoints = getConnectedEndpoints(serverId)
        let aggregatedVideoRequestList = connectedEndpoints.reduce((arr, endpoint) => {
            let videosForEndpoint = getVideoRequestsForEndpoints(endpoint.id)
            return arr.concat(videosForEndpoint)
        }, [])
        let videosRequestedOnCacheServerMap = {}
        aggregatedVideoRequestList.map((r) => {
            videosRequestedOnCacheServerMap[r.videoId] = videosRequestedOnCacheServerMap[r.videoId] || 0
            videosRequestedOnCacheServerMap[r.videoId] += r.requestCount
        })
        let videosRequestedOnCacheServerSorted = _.sortBy(
            Object.keys(videosRequestedOnCacheServerMap).map((v) => {
                return {
                    videoId: v,
                    requestCount: videosRequestedOnCacheServerMap[v]
                }
            }), 'requestCount')

        for (let videoIndexInRequested = 0; videoIndexInRequested < videosRequestedOnCacheServerSorted.length; videosRequestedOnCacheServerSorted++) {
            if (server.remaining === 0) break;
            addVideoToServer(server, videosRequestedOnCacheServerSorted[videoIndexInRequested].videoId);
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
    let video = videos[videoId]
    if (doesItFitTheServer(server, video)) {
        if (!server.videos.includes(videoId)) { } {
            server.videos.push(videoId)
            server.remaining -= video
        }
        return true
    }
    return false
}

function doesItFitTheServer(server, video) {
    return server.remaining >= video
}


function wrapArray(array, variableName) {
    return array.map((elementValue, i) => {
        let element = { id: i }
        element[variableName] = elementValue
        return element
    })
}