/**
 * This file starts a static server, which serves the library root,
 * and renders the main graph page with the data given to it.
 */

const static = require('node-static'),
    opn = require('opn'),
    DEFAULT_PORT = 1123,
    port = process.env.port || DEFAULT_PORT,
    fileServer = new static.Server('./'),
    http = require('http'),
    server = http.createServer().listen(port),
    fs = require('fs'),
    consts = require('../consts'),
    os = require('os'),
    formidable = require("formidable")


let datasets = [], task = '', algorithms = [], toolkit = {}

server.on('request', (req, res) => {

    if (req.url === '/') {
        var graph = fs.readFileSync('./graph-toolkit/graph.html', 'utf8');
        renderHtml(graph, {
            datasets: JSON.stringify(datasets),
            consts: JSON.stringify(consts),
            hostname: os.hostname(),
            task
        }, res)
        return
    }

    // We can replace solvers from the GUI in the future, so we can 
    // run specific versions of the algorithms
    if (req.url.startsWith('/run')) {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {

            console.log('[RUNNER] with blades: ', fields);

            

            res.writeHead(200, {
                'content-type': 'application/json'
            });
            res.write('{"succes": true}');
            res.end();
        });
    }

    if (req.url == '/magic') {
        if (req.method == 'POST') {
            var form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {

                console.log('[MAGIC] Saving new magic values', fields);

                require(`../magic`).save(task, fields)

                res.writeHead(200, {
                    'content-type': 'application/json'
                });
                res.write('{"succes": true}');
                res.end();
            });

        }
    }

    req.addListener('end', () => {
        fileServer.serve(req, res);
    }).resume()
})

module.exports = function graph(_task, _algorithms, _datasets, _toolkit) {
    task = _task
    algorithms = _algorithms
    datasets = _datasets
    toolkit = _toolkit

    opn(`http://127.0.0.1:${port}/`);    
}

/**
 * Simple template render.
 * Renders a given HTML with the data, replacing it's keys in data.
 * 
 * @param {String} html 
 * @param {Object} data 
 * @param {Response} res 
 */
function renderHtml(html, data, res) {

    var matches = html.match(/{{(.*)}}/g);
    var replaced = html;
    for (var i = 0; i < matches.length; i++) {
        var toReplace = matches[i];
        var keyword = matches[i].substr(2, matches[i].length - 4);
        replaced = replaced.replaceAll(toReplace, data[keyword]);
    }
    res.write(replaced);
    res.end();
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

