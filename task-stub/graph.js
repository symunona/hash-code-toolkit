/**
 * This file draws graphs on the client side 
 */

function draw(dataset) {

    // dataset.cacheServers = newArray(dataset.cacheServerCount)    
    // createDistributedDotsOfList(dataset.cacheServers, 'x', consts.height/10, 'circle', 'cache', 'id', 20)
    

    // fillArrayKeyWithValue(dataset.endpoints, 'id', 'index')
    // dataset.endpoints.map((e)=>e.text=`${e.id} ${e.toDataServerLatency}`)
    // createDistributedDotsOfList(dataset.endpoints, 'x', consts.height/2, 'rect', 'endpoint', 'text')
        
    // dataset.videos = convertToObject(dataset.videoSizes, 'size')
    // fillArrayKeyWithValue(dataset.videos, 'id', 'index')
    // fillArrayKeyWithValue(dataset.videos, 'text', (v)=>`${v.id} ${v.size}` )
    // createDistributedDotsOfList(dataset.videos, 'x', consts.height*9/10, 'v', 'video', 'text')

    // var edges = []
    
    // dataset.endpoints.map((e) =>{
    //     e.cacheServerLatencies.map((c)=>{
    //         edges.push({
    //             source: e, 
    //             target: dataset.cacheServers[c.cacheServerId],
    //             text: c.latency
    //         })
    //     })
    // });
    
    // linkNodes(edges, 'cache-endpoint', 'text');

    // var videoRequestsFromEndpoints = dataset.requests.map((req) => {
    //     var requestLine = {}
    //     requestLine.source = dataset.videos[req.videoId];
    //     requestLine.target = dataset.endpoints[req.endpointId];
    //     requestLine.text = req.requestCount;
    //     return requestLine;
    // });    

    // linkNodes(videoRequestsFromEndpoints, 'endpoint-video', 'text');

    // vm.inputData(dataset)

}

function drawSolution(solution){
    // let links = []
    // let dataset = vm.inputData();
    // solution.cacheServers.map((c, i)=>{        
    //     c.videos.map((videoId)=>{
    //         links.push({source: dataset.videos[videoId], target: dataset.cacheServers[i]})
    //     })
    // })

    // linkNodes(links, 'solution');

}