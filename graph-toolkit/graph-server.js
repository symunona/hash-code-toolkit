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
    app = http.createServer(),
    fs = require('fs'),
    consts = require('../consts'),
    os = require('os'),
    formidable = require("formidable"),
    del = require('node-delete'),
    packer = require('../packer'),
    solverRunner = require('../solver-runner')

let stdin = process.stdin

let datasets = [], task = '', algorithms = [], inputs = {}, data

let runtimeData

// process.on('message',(data)=>{
//     console.log('[graph-async]', data);
//     runtimeData = data;
// })

stdin.on('data', function (_data) {
    runtimeData = _data
    console.warn('data', _data)    
    debugger;
});

function initServer() {
    server = app.listen(port);
    console.log('[graph-server] Started on', port)
    server.on('request', (req, res) => {

        // We can replace solvers from the GUI in the future, so we can 
        // run specific versions of the algorithms
        if (req.url.startsWith('/run/')) {
            if (req.method == 'POST') {
                let parts = req.url.split('/');
                let solverName = parts[2]
                let version = parts[3]

                let inputFileName = `./${task}/${consts.inputFolder}/${input[i]}${consts.inputExtension}`
                parsedData = bostich(inputFileName, parser, force)

            }
            return
        }

        if (req.url.startsWith('/export/')) {
            if (req.method == 'POST') {
                let parts = req.url.split('/');
                let solverName = parts[2]
                let version = parts[3]
                let magic = parts[4]
                let dataset = parts[5]

                // Export all datasets from that specific 
                if (parts.length === 4) {
                    console.log(`Exporting set: ${solverName} ${version} ${magic}`)
                    let result = packer.exportSolutionsForSolver(task, solverName, version, magic)
                    if (result === true) {
                        success(res)
                    }
                    else {
                        fail(res, result)
                    }
                } else {
                    // Export one specific solution
                    console.log(`Exporting solution: ${solverName} ${version} ${magic} ${dataset}`)
                    let result = packer.exportSolutionsForSolverAndDataset(task, solverName, version, magic, dataset)
                    if (result) {
                        success(res)
                    }
                    else {
                        fail(res, result)
                    }
                }
            }
            return
        }
        if (req.url === '/pack') {
            if (req.method == 'POST') {
                packer.packCode(task, (result) => {
                    packer.packOutputFolder(task, (result) => {
                        success(res, result);
                    });
                });
            }
            return
        }
        if (req.url === '/packcode') {
            if (req.method == 'POST') {
                packer.packCode(task, (result) => {
                    success(res, result);
                })
            }
            return
        }

        if (req.url.startsWith('/magic/')) {
            if (req.method == 'POST') {
                let solverName = req.url.substr(req.url.lastIndexOf('/'));
                let form = new formidable.IncomingForm();
                form.parse(req, function (err, fields, files) {

                    console.log('[MAGIC] Saving new magic values', fields);

                    require(`../magic`).save(task, solverName, fields)

                    success(res)
                });
            }
            return
        }

        if (req.url == '/cleanstats') {
            if (req.method == 'POST') {

                console.log('[STATS] Cleaning up stats, solution cache and solver backups. Clean slate.');
                fs.writeFileSync(`./${task}/${os.hostname()}.${consts.statFileName}`, '{}');

                console.log(del.sync(`${task}/${consts.solutionCacheFolderName}/**/*`))

                success(res)
            }
            return
        }


        if (req.url.startsWith('/inputs/')) {
            if (req.method == 'GET') {
                let task = req.url.split('/')[2];
                let inputs = {}
                try {
                    fs.readdirSync(`./${task}/${consts.inputFolder}/`)
                        .filter((fn) => fn.endsWith(consts.inputExtension))
                        .map((fileName) => {
                            inputs[fileName.substr(0, fileName.length - consts.inputExtension.length)] =
                                fs.statSync(`./${task}/${consts.inputFolder}/${fileName}`).size
                        })
                }
                catch (e) {
                    fail(res, `Maybe task ${task} does not exist?`);
                    return
                }
                sendJSON(res, inputs)
            }
            return
        }

        if (req.url.startsWith('/data/')) {
            if (req.method == 'GET') {                
                sendJSON(res, runtimeData)
            }
            return
        }

        if (req.url === '/' || req.url.indexOf('.') === -1) {
            let graph = fs.readFileSync('./graph-toolkit/graph.html', 'utf8');
            renderHtml(graph, {
                // datasets: JSON.stringify(datasets),
                consts: JSON.stringify(consts),
                hostname: os.hostname(),
                // task,
                // inputs: JSON.stringify(inputs)
            }, res)
            return
        }


        req.addListener('end', () => {
            fileServer.serve(req, res);
        }).resume()
    })
}

module.exports = function graph(_task, _algorithms, _datasets) {
    task = _task
    algorithms = _algorithms
    datasets = _datasets

    initServer();

    // fs.readdirSync(`./${task}/${consts.inputFolder}/`)
    //     .filter((fn) => fn.endsWith(consts.inputExtension))
    //     .map((fileName) => {
    //         inputs[fileName.substr(0, fileName.length - consts.inputExtension.length)] =
    //             fs.statSync(`./${task}/${consts.inputFolder}/${fileName}`).size
    //     })

    // opn(`http://127.0.0.1:${port}/`);
}

module.exports.data = function (_data) {
    data = _data
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

function success(res, message) {
    res.writeHead(200, {
        'content-type': 'application/json'
    });
    let response = { success: true };
    if (message) {
        response.message = message;
    }
    res.write(JSON.stringify(response));
    res.end();
}

function sendJSON(res, json) {
    res.writeHead(200, {
        'content-type': 'application/json'
    });
    res.write(JSON.stringify(json));
    res.end();
}


function fail(res, message) {
    res.writeHead(500, {
        'content-type': 'application/json'
    });
    res.write(`{"succes": false, "message":"${message}"}`);
    res.end();
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

module.exports();

