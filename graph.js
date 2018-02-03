
function draw(dataset, vis) {

    dataset.parsedValue.cacheServers = newArray(dataset.parsedValue.cacheServerCount)    
    createDistributedDotsOfList(dataset.parsedValue.cacheServers, 'x', 50, 'circle', 'cache', 'id', 20)
    

    fillArrayKeyWithValue(dataset.parsedValue.endpoints, 'id', 'index')
    createDistributedDotsOfList(dataset.parsedValue.endpoints, 'x', 300, 'rect', 'endpoint', 'id')
    

    fillArrayKeyWithValue(dataset.parsedValue.requests, 'id', 'index')
    createDistributedDotsOfList(dataset.parsedValue.requests, 'x', 450, 'rect', 'request', 'id')

    
    dataset.parsedValue.videos = convertToObject(dataset.parsedValue.videoSizes, 'size')
    fillArrayKeyWithValue(dataset.parsedValue.videos, 'id', 'index')
    createDistributedDotsOfList(dataset.parsedValue.videos, 'x', 550, 'triangle', 'video', 'id')


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

    vm.inputData(dataset.parsedValue)

}