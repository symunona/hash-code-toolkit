
function draw(dataset, vis) {

    dataset.parsedValue.cacheServers = newArray(dataset.parsedValue.cacheServerCount)    
    createDistributedDotsOfList(dataset.parsedValue.cacheServers, 'x', consts.height/10, 'circle', 'cache', 'id', 20)
    

    fillArrayKeyWithValue(dataset.parsedValue.endpoints, 'id', 'index')
    createDistributedDotsOfList(dataset.parsedValue.endpoints, 'x', consts.height/2, 'rect', 'endpoint', 'id')
        
    dataset.parsedValue.videos = convertToObject(dataset.parsedValue.videoSizes, 'size')
    fillArrayKeyWithValue(dataset.parsedValue.videos, 'id', 'index')
    createDistributedDotsOfList(dataset.parsedValue.videos, 'x', consts.height*9/10, 'v', 'video', 'id')

    var edges = []
    
    dataset.parsedValue.endpoints.map((e) =>{
        e.cacheServerLatencies.map((c)=>{
            edges.push({
                source: e, 
                target: dataset.parsedValue.cacheServers[c.cacheServerId],
                text: c.latency
            })
        })
    });
    
    linkNodes(edges, 'cache-endpoint', 'text');

    var videoRequestsFromEndpoints = dataset.parsedValue.requests.map((req) => {
        var requestLine = {}
        requestLine.source = dataset.parsedValue.videos[req.videoId];
        requestLine.target = dataset.parsedValue.endpoints[req.endpointId];
        requestLine.text = req.requestCount;
        return requestLine;
    });    

    linkNodes(videoRequestsFromEndpoints, 'endpoint-video', 'text');

    vm.inputData(dataset.parsedValue)

}