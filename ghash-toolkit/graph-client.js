var consts = {
    width: 1200,
    height: 700,
    padding: 40
};
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
    this.datasets = window.datasets;
    this.loadInput = loadInput;
    // Map constants to observables.
    this.consts = {}
    Object.keys(consts).map((key) => {
        this.consts[key] = ko.observable(consts[key])
        this.consts[key]._key = key;
        this.consts[key].subscribe(updateConsts)
    })

    this.inputData = ko.observable('')
    return this;
}

var vm = new ViewModel
ko.applyBindings(vm);

function updateConsts(val) {
    consts[this._key] = val
}

function loadInput(name) {
    $.ajax({
        url: name,
        contentType: 'json'
    }).then(function (data) {
        $('#graph').html('').css({ width: consts.width, height: consts.height });
        vm.inputData(JSON.stringify(data, null, 2));
        try {
            vis = d3.select("#graph")
                .append("svg");

            vis.attr("width", consts.width)
                .attr("height", consts.height);

            draw(data, vis)
        } catch (e) {
            console.error(e)
        }
    })
}

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
function createDistributedDotsOfList(array, axis, otherDistance, type, cls, textField, size, padding) {
    distributeOnAxis(array, axis, otherDistance, padding);
    size = size || 10
    type = type || 'rect'
    cls = cls || ''
    var centerAttr = type === 'circle' ? 'c' : ''

    var node = vis.selectAll("circle .nodes" + cls ? '.' + cls : '')
        .data(array)
        .enter()
        .append('g')
        .attr('class', 'nodes ' + cls);

    if (['rect', 'circle'].includes(type)) {
        node
            .append('svg:' + type)
            .attr(centerAttr + 'x', function (d) { return d.x; })
            .attr(centerAttr + 'y', function (d) { return d.y; })
            .attr('width', size)
            .attr('height', size)
            .attr('r', size)
    }
    else if (type === 'triangle') {
        node.append('svg:polygon')
            .attr('points', function (e) {
                return triangle(e.x, e.y, size)
            })
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

function newArray(objectCount) {
    var ret = []
    for (var i = 0; i < objectCount; i++) {
        ret.push({ id: i })
    }
    return ret;
}

// ----------------------------------------------------------------------------------------------

function createLinkBetweenTwoSets(array) {

}

function linkNodes(links, cls, textField) {
    var lineGroup = vis.selectAll(".edge")
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

    lineGroup
        .append('text')
        .text(function (node) {
            console.warn(node, textField)
            return node[textField]
        })
        .attr('class', 'node-text ' + cls)
        .attr('x', function (d) { return (d.source.x + d.target.x) / 2 })
        .attr('y', function (d) { return (d.source.y + d.target.y) / 2 })
}