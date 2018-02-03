const static = require('node-static')
    opn = require('opn');
    DEFAULT_PORT = 1123
    port = process.env.port || DEFAULT_PORT
    fileServer = new static.Server('./')
    http = require('http'),
    server = http.createServer().listen(port)
    fs = require('fs')

let datasets = []

server.on('request', (req, res) => {

    if (req.url.startsWith('/?')){
        var graph = fs.readFileSync('./ghash-toolkit/graph.html', 'utf8');
        renderHtml(graph, {datasets: JSON.stringify(datasets)}, res)
        return;
    }

    req.addListener('end', function () {
        fileServer.serve(req, res);
    }).resume();
})

module.exports = function graph(name){

    datasets.push(name);
    
    if (datasets.length === 1){
        opn(`http://127.0.0.1:${port}/?input=${name}`);
    }
}

function renderHtml(html, data, res){

    var matches = html.match(/{{(.*)}}/g);
    var replaced = html;
    for(var i = 0; i<matches.length; i++){
        var toReplace = matches[i];
        var keyword = matches[i].substr(2,matches[i].length-4);
        replaced = replaced.replaceAll(toReplace, data[keyword]);
    }
    res.write(replaced);
    res.end();
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
