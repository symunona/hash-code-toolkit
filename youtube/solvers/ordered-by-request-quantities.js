// Put the video in
const _ = require('underscore')

let servers, serverSize, videos

module.exports = function (p) {
    serverSize = p.cacheServerSize
    servers = _.range(p.cacheServerCount).map((i) => { return { videos: [], remaining: serverSize } })
    videos = p.videoSizes

    let requestsSorted = _.sortBy(p.requests, 'requestCount').reverse()

    requestsSorted.map((r) => {
        let endpoint = p.endpoints[r.endpointId]
        if (endpoint.cacheServerLatencies.length) {
            let closestServer = _.sortBy(endpoint.cacheServerLatencies, 'latency')[0]
            if (closestServer.latency < endpoint.toDataServerLatency) {
                addVideoToServer(servers[closestServer.cacheServerId], r.videoId)
            }
        }
    })

    return { cacheServers: servers };
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