/**
 * This file starts a static server, which serves the library root,
 * and renders the main graph page with the data given to it.
 */

const
    DEFAULT_PORT = 1123,
    port = process.env.port || DEFAULT_PORT,
    http = require('http')

// let socket

let child

module.exports = function (onConnected) {

    startChild(onConnected)
    // const graphServer = require('./graph-toolkit/graph-server')

    // Check if it already is running
    // Checking if server is running
    // var request = http.request({
    //     host: "http://127.0.0.1:" + port
    // }, function (req) {
    //     console.error('[graph-server] Running already... Whatnow?')
    // });

    // request.on('error', function (err) {
    //     // Handle error
    //     // opn = require('opn')
    //     console.warn('[graph-server-async] Not running yet, start...', err)
    //     // startChild();
    // });

    // startChild();

    // connectClient(onConnected)    


    // request.end();
}

function connectClient(onConnected) {

    socket = require('socket.io-client')('http://127.0.0.1:' + (Number(port) + 1));
    socket.on('connect', function () {
        console.log('[graph-server] Async client connected');
        socket.emit('console', 'Server has connected to graph porcess')
        onConnected()
    });
    socket.on('event', function (data) {
        console.log('[event]', data)
    });
    socket.on('disconnect', function () { });

}


function startChild(callback) {

    const execArgv = [];
    let callbackCalled = false;
    
    // this is funny...
    const debugArg = process.execArgv.find(o => o.startsWith('--debug'));
    const port = parseInt(debugArg.substr(debugArg.indexOf('=') + 1)) + 100;
    execArgv.push('--debug=' + port);
    
    const fork = require('child_process').fork;
    const path = require('path')
    const program = path.resolve('./graph-toolkit/graph-server.js');
    const childOptions = 
    { silent: true, execArgv, stdio: ['pipe', 'pipe', 'pipe', 'ipc'] }

    console.warn('[graph-server-async] staring server...')

    child = fork(program, [], childOptions);

    child.stdout.on('data', (data) => {
        console.log(`[graph-server-async] ${data}`);
        if (!callbackCalled){
            callback()
        }
    });

    child.stderr.on('data', (data) => {
        console.error(`[graph-server-async] ${data}`);        
    });

    child.on('close', (code) => {
        console.log(`[graph-server-async] child process exited with code ${code}`);
    });

}

module.exports.send = function (data) {
    child.send(data)
}


// module.exports.send = function (data) {
//     // child.send(data)

//     try {
//         child.stdin.setEncoding('utf-8');
//         // child.stdout.pipe(process.stdout);

//         child.stdin.write(JSON.stringify(data));

//         child.stdin.end();
//     }
//     catch (e) { }

// }


// module.exports.send = function(data, event){
//     // console.warn('[graph-server-async] broadcasting', data, event)
//     socket.emit(event || 'iterate', JSON.stringify(data))    

// }

// module.exports.send = function (data, event) {
//     // event = event || 'graph iterate'
//     // io.emit('some event', { for: 'everyone' });
// }
