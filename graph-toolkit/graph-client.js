/**
 * This file handles generic GUI functionality in the browser.
 */

document.title = task + ' ' + document.title

var consts = {
    width: 2000,
    height: 1000,
    padding: 40
};

var CONST_KEY = 'consts'
if (localStorage.getItem(CONST_KEY)) {
    consts = JSON.parse(localStorage.getItem(CONST_KEY));
}

var vis;

ko.bindingHandlers.json = {
    update: function (element, value) {
        var stringOrObject = ko.unwrap(value());
        if (typeof (stringOrObject) === 'string') {
            element.innerHTML = stringOrObject;
        }
        else {
            element.innerHTML = JSON.stringify(stringOrObject, null, 2)
        }
    }
}

function ViewModel() {
    
    this.loadInput = loadInput;
    this.cleanStats = cleanStats;
    this.loadSolution = loadSolution;
    this.flatMagic = flatMagic;
    
    this.formatSize = formatSize;
    this.exportSolution = exportSolution;
    this.exportToOutputFolder = exportToOutputFolder;
    this.getMagics = getMagics;
    this.time = time;
    this.packCurrent = packCurrent;
    this.packCode = packCode;

    // Map constants to observables.
    this.consts = {}
    Object.keys(consts).map((key) => {
        this.consts[key] = ko.observable(consts[key])
        this.consts[key]._key = key;
        this.consts[key].subscribe(updateConsts, this.consts[key])
    })


    this.inputData = ko.observable('')
    this.outputData = ko.observable('')
    this.stats = ko.observable({})
    this.solvers = ko.observable();
    this.magic = ko.observable({});
    this.allInputs = ko.observable();

    this.isThisExported = function(solverName, ver, magic, dataset){
        if (this.stats() && 
            this.stats().output &&
            this.stats().output[dataset]){
            return this.stats().output[dataset].version === ver &&
                this.stats().output[dataset].magic === magic &&
                this.stats().output[dataset].solver === solverName
        }
        return false;
    }.bind(this)
    

    this.datasets = ko.computed(function(){
        if (!this.stats()) return window.datasets
        let datasets = []
        Object.keys(this.stats())
            .filter((algo)=>algo!=='output')
            .map((algo)=>{
            Object.keys(this.stats()[algo]).map((ver)=>{
                datasets = datasets.concat(Object.keys(this.stats()[algo][ver]))
            })
        })
        return _.uniq(datasets)
    }, this)

    this.currentlyExportedScore = ko.computed(function(){        
        let output = this.stats().output;
        if (!output) return 'nope...';
        return Object.keys(output).reduce((prev, s)=>prev+(output[s].score || 0), 0);
    }, this)


    return this;
}

ko.onError = function (e) {
    console.error
}

setInterval(function(){
    $.ajax({url: '/data/'}).then((data)=>console.warn)
},1000 )

var vm = new ViewModel
ko.applyBindings(vm);

getStats();
getAllInputs()

function updateConsts(val) {
    consts[this._key] = Number(val)
    localStorage.setItem(CONST_KEY, JSON.stringify(consts));
}

function getSolutionFileName(algo, ver, dataset, magic) {
    return `${task}/${serverConsts.solutionCacheFolderName}/${algo}/${ver}/${dataset}/${magic ? magic : 'default'}.json`
}

function getAllInputs() {
    $.ajax({
        url: `/inputs/` + task,
        contentType: 'json'
    }).then(vm.allInputs)
}

function getAllSolvers() {
    $.ajax({
        url: `/solvers/` + task,
        contentType: 'json'
    }).then((data)=>{
        console.warn(data)
        return data
    }).then(vm.allInputs)
}

/**
 * Loads a given input json cache from the server and feeds it to the graph function.
 * @param {String} name 
 */
function loadInput(name) {
    if (vm.allInputs()[name]>10000){
        if (!confirm('This is a pretty big file, it might freeze the browser. Sure?')) return;
    }
    return $.ajax({
        url: `/${task}/${serverConsts.inputFolder}/${name}.cache.json`,
        contentType: 'json'
    }).then(function (data) {
        $('#graph').html('').css({ width: consts.width, height: consts.height });
        vm.inputData(JSON.stringify(data, null, 2));
        try {
            vis = d3.select("#graph")
                .append("svg");

            vis.attr("width", consts.width)
                .attr("height", consts.height);
            var startTime = new Date()
            draw(data.parsedValue)

            $('#graph .nodes').on('mouseenter', function () {
                this.parentElement.appendChild(this)
            });

            console.warn('Rendered in', (new Date() - startTime) / 1000)
        } catch (e) {
            console.error(e)
        }
        return data;
    })
}

function getMagics(statNode){
    let magics = []
    Object.keys(statNode).map((inputDataSet)=>{
        if (!statNode[inputDataSet].magicVersions){
            magics.push('default')
        }
        else{
            magics = magics.concat(Object.keys(statNode[inputDataSet].magicVersions))
        }
    })
    return _.uniq(magics)
}


function loadSolution(dataset, path) {
    if (vm.allInputs()[name]>10000){
        if (!confirm('This is a pretty big file, it might freeze the browser. Sure?')) return;
    }
    return loadInput(dataset).then((inp)=>{        
        return $.ajax({
            url: path,
            contentType: 'json'
        }).then(function (data) {
            vm.outputData(JSON.stringify(data, null, 2));
            try {
                var startTime = new Date()
                drawSolution(data, inp.parsedValue)
                console.warn('Rendered in', (new Date() - startTime) / 1000)
            } catch (e) {
                console.error(e)
            }
        })
    })
}


function exportSolution(solverName, ver, magic){
    return $.ajax({
        type: 'post',
        url: `/export/${solverName}/${ver}/${magic==='default'?'':magic}`        
    }).then(console.warn).then(getStats).catch(console.error)
}

function packCurrent(){
    return $.ajax({
        type: 'post',
        url: `/pack`        
    }).then(console.warn).then(getStats).catch(console.error)
}


function packCode(){
    return $.ajax({
        type: 'post',
        url: `/packcode`        
    }).then(console.warn).then(getStats).catch(console.error)
}


function exportToOutputFolder(solverName, ver, magic, dataset){
    return $.ajax({
        type: 'post',
        url: `/export/${solverName}/${ver}/${magic==='default'?'':magic}/${dataset}`        
    }).then(console.warn).then(getStats).catch(console.error)
}

function cleanStats() {
    return confirm('Sure?') ? $.ajax({
        type: 'post',
        url: `/cleanstats`
    }).then(getStats) : false;
}


function getStats() {
    return $.ajax({
        url: `/${task}/${hostname}.${serverConsts.statFileName}`,
        contentType: 'json'
    }).then((stats) => {
        let magic = {}
        Object.keys(stats).map((solverName) => {
            magic[solverName] = ko.observable()
            getMagic(solverName).then(magic[solverName])
        })
        vm.magic(magic)
        vm.stats(stats)
    })
}

function getMagic(solverName) {
    return $.ajax({
        url: `/${task}/${serverConsts.solversFolderName}/${solverName}.${serverConsts.magicConstantFile}`,
        contentType: 'json'
    }).then(function (magic) {
        return wrapWithSaveNumbers(magic, saveMagic.bind(this, solverName));
    })
}

function saveMagic(solverName, magic) {
    return $.ajax({
        type: 'post',
        url: `/magic/${solverName}`,
        contentType: 'json',
        data: JSON.stringify(magic)
    });
}

function wrapWithSaveNumbers(originalObject, callback) {
    Object.keys(originalObject).map((key) => {
        originalObject[key] = ko.observable(originalObject[key])
        originalObject[key].subscribe(function (val) {
            var objectToSave = {}
            Object.keys(originalObject).map((origKey) => {
                objectToSave[origKey] = Number(ko.unwrap(originalObject[origKey]))
            })
            callback(objectToSave);
        }, originalObject[key])
    });
    return originalObject
}

function flatMagic(magic) {
    return Object.keys(magic).map((m) => `${m}: ${magic[m]}`).join(', ')
}

function time(seconds){
    if (seconds < 1) return '<1s'
    else if (seconds < 100) return Math.round(seconds) + 's'
    else if (seconds < 3600) return Math.floor(seconds/60) + 'm ' + Math.floor(seconds%60) + 's'
    else return Math.floor(seconds/3600) + 'h ' + Math.floor(seconds % 60) + 'm'
}

function score(score){
    if(!score) return 'x'
    if(_.isString(score)){
        return score;
    }
    return score.toFixed(0).replace(/./g, function(c, i, a) {
        return i && c !== "." && ((a.length - i) % 3 === 0) ? ' ' + c : c;
    })
}

///////////////////////////////////////////////////////////////////////////////////


/**
 * Converts an array with basic elements to an array with object
 * that has a fieldName property, containing the original value.
 * @param {Array} arrayWithSimpleTypes 
 * @param {String} fieldName 
 */
function convertToObject(arrayWithSimpleTypes, fieldName) {
    return arrayWithSimpleTypes.map((originalValue) => {
        let object = {}
        object[fieldName] = originalValue;
        return object;
    })
}

/**
 * Distributes a set of data along an axis with a padding value
 * @param {Array} array 
 * @param {String} axis - with value 'x' or 'y'
 * @param {Number} [otherAxisValue] - if we want it to be set.
 * @param {Number} [padding] - for each sides
 */
function distributeOnAxis(array, axis, otherAxisValue, padding) {
    padding = padding || consts.padding;
    var distributeAlong = axis === 'x' ? consts.width : consts.height;
    var otherAxis = axis === 'x' ? 'y' : 'x';
    var length = array.length;
    var step = (distributeAlong - (padding * 2)) / (length - 1)
    array.map((element, index) => {
        element[axis] = padding + (index * step)
    });

    if (otherAxisValue) {
        fillArrayKeyWithValue(array, otherAxis, otherAxisValue);
    }
}

/**
 * Fills an array's element's specific keys with a given value.
 * @param {Array} array 
 * @param {String} key 
 * @param {*} value - if 'index' is provided, index will be added. If function is provided, function result will be added
 */
function fillArrayKeyWithValue(array, key, value) {
    if (typeof (value) === 'string') {
        if (value === 'index') {
            array.map((element, index) => {
                element[key] = index;
            })
        } else {
            array.map((element) => {
                element[key] = value;
            })
        }
    } else if (typeof (value) === 'function') {
        array.map((element) => {
            element[key] = value(element);
        })
    } else {
        array.map((element) => {
            element[key] = value;
        })
    }

}

function drawRect(){

}

/**
 * 
 * @param {Array} array 
 * @param {String} axis - 'x' or 'y' which we want to distribute the nodes by
 * @param {Number} [otherDistance] - the displacement on the other axis
 * @param {String} [type] - 'rect' or 'circle'
 * @param {String} [cls] - if you want an extra class
 * @param {String} [textField] - if provided, text will be added to the nodes
 * @param {String} [size] - if we want to have 
 * @param {Number} [padding] - distance from the sides. Default: '10px'
 */
function createDotsOfList(array, type, cls, textField, size, padding, subclass) {    
    size = size || 10
    type = type || 'rect'
    cls = cls || ''

    var node = vis.selectAll("circle .nodes" + cls ? '.' + cls : '')
        .data(array)
        .enter()
        .append('g')
        .attr('class', 'nodes ' + cls);


    if (type === 'circle') {
        node
            .append('svg:' + type)
            .attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; })
            .attr('r', size);

    } else if (type === 'rect') {
        let n = node
            .append('svg:' + type)
            .attr('x', function (d) { return d.x - (size / 2); })
            .attr('y', function (d) { return d.y - (size / 2); })
            .attr('width', size)
            .attr('height', size);
        if (_.isFunction(subclass)){
            n.attr('class', subclass)
        }
    }
    else if (type === 'triangle') {
        node.append('svg:polygon')
            .attr('points', function (e) {
                return triangle(e.x, e.y, size)
            })
    }
    else if (type === 'v') {
        node.append('svg:polygon')
            .attr('points', function (e) {
                return triangle(e.x, e.y, size)
            })
            .attr('transform', (e) => 'rotate(180 ' + e.x + ',' + e.y + ')')
    }
    else {
        throw new Error('What should be shape?')
    }

    if (textField) {
        var offsetX = -size * 2, offsetY = 0
        node
            .append('text')
            .text(function (node) {
                return node[textField]
            })
            .attr('class', 'node-text ' + cls)
            .attr('x', function (d) { return d.x + offsetX; })
            .attr('y', function (d) { return d.y + offsetY; })
    }
    return node;
}


/**
 * 
 * @param {Array} array 
 * @param {String} axis - 'x' or 'y' which we want to distribute the nodes by
 * @param {Number} [otherDistance] - the displacement on the other axis
 * @param {String} [type] - 'rect' or 'circle'
 * @param {String} [cls] - if you want an extra class
 * @param {String} [textField] - if provided, text will be added to the nodes
 * @param {String} [size] - if we want to have 
 * @param {Number} [padding] - distance from the sides. Default: '10px'
 */
function createDistributedDotsOfList(array, axis, otherDistance, type, cls, textField, size, padding, subclass) {
    distributeOnAxis(array, axis, otherDistance, padding);
    size = size || 10
    type = type || 'rect'
    cls = cls || ''

    var node = vis.selectAll("circle .nodes" + cls ? '.' + cls : '')
        .data(array)
        .enter()
        .append('g')
        .attr('class', 'nodes ' + cls);


    if (type === 'circle') {
        node
            .append('svg:' + type)
            .attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; })
            .attr('r', size);

    } else if (type === 'rect') {
        let n = node
            .append('svg:' + type)
            .attr('x', function (d) { return d.x - (size / 2); })
            .attr('y', function (d) { return d.y - (size / 2); })
            .attr('width', size)
            .attr('height', size);
        if (_.isFunction(subclass)){
            n.attr('class', subclass)
        }
    }
    else if (type === 'triangle') {
        node.append('svg:polygon')
            .attr('points', function (e) {
                return triangle(e.x, e.y, size)
            })
    }
    else if (type === 'v') {
        node.append('svg:polygon')
            .attr('points', function (e) {
                return triangle(e.x, e.y, size)
            })
            .attr('transform', (e) => 'rotate(180 ' + e.x + ',' + e.y + ')')
    }
    else {
        throw new Error('What should be shape?')
    }

    if (textField) {
        var offsetX = axis === 'x' ? 0 : -size * 2, offsetY = axis === 'x' ? -size * 2 : 0
        node
            .append('text')
            .text(function (node) {
                return node[textField]
            })
            .attr('class', 'node-text ' + cls)
            .attr('x', function (d) { return d.x + offsetX; })
            .attr('y', function (d) { return d.y + offsetY; })
    }
}

/**
 * Returns a triangle polygon attr data.
 * @param {*} x 
 * @param {*} y 
 * @param {*} r 
 */
function triangle(x, y, r) {
    return [
        [x, y - (r / 2)].join(','),
        [x - (r * 0.707), y + (r / 2)].join(','),
        [x + (r * 0.707), y + (r / 2)].join(',')
    ].join(' ')
}


// /////////////////////////////////////////////////////////
// ///////////////////// DATA FUNCTIONS ////////////////////
// /////////////////////////////////////////////////////////

/**
 * Creates an array of object with their index as their id property.
 * @param {Number} objectCount 
 */
function newArray(objectCount) {
    var ret = []
    for (var i = 0; i < objectCount; i++) {
        ret.push({ id: i })
    }
    return ret;
}

function wrapArray(array, variableName) {
    return array.map((elementValue, i) => {
        let element = { id: i }
        element[variableName] = elementValue
        return element
    })
}

function NormalizedCoordinateSystem(height, width){
    let h = (consts.height - (consts.padding * 2)) / height
    let w = (consts.width - (consts.padding * 2)) / width
    
    return function(coords){        
        return {
            x: consts.padding + (coords.x * w),
            y: consts.padding + (coords.y * h)
        }
    }
}

/**
 * Draws edges between nodes.
 * @param {Array} links - of Objects, containing a source and a target
 *                          object, which both have x and y coordinates.
 * @param {String} cls - selector class of the edge. Has to be different, than any
 *                          other set of edges.
 * @param {String} [textField] - if provided, the edge will have a caption.
 */
function linkNodes(links, cls, textField) {
    var lineGroup = vis.selectAll(".edge" + '.' + cls)
        .data(links)
        .enter()
        .append('g')
        .attr('class', 'edge ' + cls);

    lineGroup
        .append("line")
        .attr("x1", function (d) { return d.source.x })
        .attr("y1", function (d) { return d.source.y })
        .attr("x2", function (d) { return d.target.x })
        .attr("y2", function (d) { return d.target.y })

    if (textField) {
        lineGroup
            .append('text')
            .text(function (node) {
                return node[textField]
            })
            .attr('class', 'node-text ' + cls)
            .attr('x', function (d) { return (d.source.x + d.target.x) / 2 })
            .attr('y', function (d) { return (d.source.y + d.target.y) / 2 })
            .attr('transform', (d) => {
                var cx = (d.source.x + d.target.x) / 2;
                var cy = (d.source.y + d.target.y) / 2;
                var angle = Math.tanh((d.target.y - d.source.y) / (d.target.x - d.source.x)) * (180 / Math.PI)

                return `rotate(${angle} ${cx},${cy})`;
            })
    }
}


$('.flipper').on('click', function () {
    $(this).next().slideToggle()
})

function formatSize(size){
    if (size === undefined) return ''
    if (size < 1024) return size + 'B'
    if (size < 1024*1024) return Math.round(size/1024) + 'KB'
    return Math.round(size/1024/1024) + 'MB'
}


String.prototype.replaceObject=function(object) {
    return Object.keys(object).reduce(function(prev, cur){
        return prev.replaceAll(cur, object[cur])
    }, this);
}

function groupReplace(string, object){
    
}

String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
