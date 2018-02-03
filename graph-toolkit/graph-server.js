/**
 * This file starts a static server, which serves the library root,
 * and renders the main graph page with the data given to it.
 */

const static = require('node-static')
    opn = require('opn');
    DEFAULT_PORT = 1123
    port = process.env.port || DEFAULT_PORT
    fileServer = new static.Server('./')
    http = require('http'),
    server = http.createServer().listen(port)
    fs = require('fs'),
    consts = require('../consts')

let datasets = [];
let task = '', algorithms = []

server.on('request', (req, res) => {

    if (req.url === '/'){
        var graph = fs.readFileSync('./graph-toolkit/graph.html', 'utf8');
        renderHtml(graph, {
            datasets: JSON.stringify(datasets),
            consts: JSON.stringify(consts),
            task
        }, res)        
        return
    }

    // We can replace solvers from the GUI in the future, so we can 
    // roll the version back easily.
    if (req.url.startsWith('/replace')){        
        
    }

    req.addListener('end', ()=> {
        fileServer.serve(req, res);
    }).resume()
})

module.exports = function graph(_task, _algorithms, _datasets){
    task = _task
    algorithms = _algorithms, 
    datasets = _datasets
    if (datasets.length === 1){
        opn(`http://127.0.0.1:${port}/`);
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
