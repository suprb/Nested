makeBoxes = function() {
  var boxes = [],
      count = Math.random()*15;
      if (count < 5) count = 5;

  for (var i=0; i < count; i++ ) {
    var box = document.createElement('div');
    box.className = 'box size' +  Math.ceil( Math.random()*3 ) +  Math.ceil( Math.random()*3 );
    // add box DOM node to array of new elements
    boxes.push( box );
  }

  return boxes;
};

