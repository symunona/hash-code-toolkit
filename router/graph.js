/**
 * This file draws graphs on the client side 
 */

function draw(dataset) {

    let classMap = {
        '\-': ' ',
        '\\#': '█',
        '\\.': '░'
    }
        
    dataset.bitmap[dataset.backboneY] = dataset.bitmap[dataset.backboneY].replaceAt(dataset.backboneX, '╬');
    
    dataset.map = dataset.bitmap.join('\n').replaceObject(classMap);
    

    $('#graph').css({height:'auto', width: 'auto'}).html($('<pre>').text(dataset.map));

}

function drawSolution(solution){
    
}