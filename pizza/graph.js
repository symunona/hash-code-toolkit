/**
 * This file draws graphs on the client side 
 */

let classMap = {
    'T': '🍅',
    'M': '🍄'
}

function draw(dataset) {
           
    dataset.map = dataset.bitmap.join('\n').replaceObject(classMap);
    
    $('#graph').css({height:'auto', width: 'auto'}).html($('<pre>').text(dataset.map));

}

function drawSolution(solution, dataset){

    let lines = []

    for(let y = 0; y<dataset.bitmap.length; y++){
        lines.push(colorLine(dataset.bitmap[y], y, solution))
    }

    let render = lines.map((m)=>m.replaceObject(classMap)).join('<br/>');

    $('#graph').css({height:'auto', width: 'auto'}).html($('<div>').html(render));

}

function colorLine(line, y, solution){
    let newLine = '';
    let lastColor = 0;
    for(let x = 0; x < line.length; x++){
        if (solution.map[y][x]!=lastColor){
            if (lastColor!=0){                    
                newLine+='</span>'                
            }
            if (solution.map[y][x]!=0){
                newLine+=`<span style="color: ${solution.map[y][x]}">`
            }            
            lastColor = solution.map[y][x];
        }
        newLine+=line[x];
    }
    if (lastColor!=0){
        newLine+='</span>';
    }    
    return newLine;
}

