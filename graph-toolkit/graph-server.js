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
    formidable = require("formidable"),
    del = require('node-delete'),
    packer = require('../packer')


let datasets = [], task = '', algorithms = [], toolkit = {}, inputs = {}

server.on('request', (req, res) => {

    if (req.url === '/') {
        let graph = fs.readFileSync('./graph-toolkit/graph.html', 'utf8');
        renderHtml(graph, {
            datasets: JSON.stringify(datasets),
            consts: JSON.stringify(consts),
            hostname: os.hostname(),
            task,
            inputs: JSON.stringify(inputs)
        }, res)
        return
    }

    // We can replace solvers from the GUI in the future, so we can 
    // run specific versions of the algorithms
    if (req.url.startsWith('/run')) {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {

            console.log('[RUNNER] with blades: ', fields);

            success(res)
        });
        return
    }

    if (req.url.startsWith('/export/')) {
        if (req.method == 'POST') {
            let parts = req.url.split('/');
            let solverName = parts[2]
            let version = parts[3]
            let magic = parts[4]
            
            console.log(`Exporting set: ${solverName} ${version} ${magic}`)
            packer.exportSolutionsForSolver(task, solverName, version, magic)
            
            success(res)
            
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
            console.log(del.sync(`${task}/${consts.solversFolderName}/_*\.backup\.js`))
            console.log(del.sync(`${task}/${consts.inputFolder}/_*\.output\.json`))

            success(res)
        }
        return
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

    fs.readdirSync(`./${task}/${consts.inputFolder}/`)
        .filter((fn) => fn.endsWith(consts.inputExtension))
        .map((fileName) => {
            inputs[fileName.substr(0, fileName.length - consts.inputExtension.length)] =
                fs.statSync(`./${task}/${consts.inputFolder}/${fileName}`).size
        })

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

function success(res) {
    res.writeHead(200, {
        'content-type': 'application/json'
    });
    res.write('{"succes": true}');
    res.end();
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

