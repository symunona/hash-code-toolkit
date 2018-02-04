
function draw(dataset) {

    dataset.cacheServers = newArray(dataset.cacheServerCount)    
    createDistributedDotsOfList(dataset.cacheServers, 'x', consts.height/10, 'circle', 'cache', 'id', 20)
    

    fillArrayKeyWithValue(dataset.endpoints, 'id', 'index')
    createDistributedDotsOfList(dataset.endpoints, 'x', consts.height/2, 'rect', 'endpoint', 'id')
        
    dataset.videos = convertToObject(dataset.videoSizes, 'size')
    fillArrayKeyWithValue(dataset.videos, 'id', 'index')
    createDistributedDotsOfList(dataset.videos, 'x', consts.height*9/10, 'v', 'video', 'id')

    var edges = []
    
    dataset.endpoints.map((e) =>{
        e.cacheServerLatencies.map((c)=>{
            edges.push({
                source: e, 
                target: dataset.cacheServers[c.cacheServerId],
                text: c.latency
            })
        })
    });
    
    linkNodes(edges, 'cache-endpoint', 'text');

    var videoRequestsFromEndpoints = dataset.requests.map((req) => {
        var requestLine = {}
        requestLine.source = dataset.videos[req.videoId];
        requestLine.target = dataset.endpoints[req.endpointId];
        requestLine.text = req.requestCount;
        return requestLine;
    });    

    linkNodes(videoRequestsFromEndpoints, 'endpoint-video', 'text');

    vm.inputData(dataset)

}