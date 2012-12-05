/**
 * jQuery Nested v1.0
 *
 * For a (total) gap free, multi column, grid layout experience.
 * http://suprb.com/apps/nested/
 * By Andreas Pihlström and additional brain activity by Jonas Blomdin
 *
 * Licensed under the MIT license.
 */
 
jQuery.fn.reverse = [].reverse;

// Debouncing function from John Hann
// http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
// Copy pasted from http://paulirish.com/2009/throttled-smartresize-jquery-event-handler/
(function ($, sr) {
    var debounce = function (func, threshold, execAsap) {
        var timeout;
        return function debounced() {
            var obj = this,
                args = arguments;

            function delayed() {
                if(!execAsap) func.apply(obj, args);
                timeout = null;
            };
            if(timeout) clearTimeout(timeout);
            else if(execAsap) func.apply(obj, args);

            timeout = setTimeout(delayed, threshold || 150);
        };
    }
    jQuery.fn[sr] = function (fn) {
        return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr);
    };

})(jQuery, 'smartresize');

// The Nested magic

(function ($) {

    $.Nested = function (options, element) {
        this.element = $(element);
        this._init(options);
    };

    $.Nested.settings = {
        selector: '.box',
        minWidth: 100,
        minColumns: 4,
        gutter: 1,
        resizeToFit: true,
        animate: false,
        animationOptions: {
            speed: 100,
            duration: 200,
            queue: true,
            complete: function () {}
        },
    };

    $.Nested.prototype = {

        _init: function (options) {
            var container = this;
            this.name = this._setName(5);
            this.box = this.element;
            this.options = $.extend(true, {}, $.Nested.settings, options);
            this.elements = [];
            this._isResizing = false;

            // add smartresize
            $(window).smartresize(function () {
                container.resize();
            });

            // build box dimensions
            this._setBoxes();
        },

        _setName: function (length, current) {
            current = current ? current : '';
            return length ? this._setName(--length, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 60)) + current) : current;
        },

        _setBoxes: function ($els) {
            var self = this;
            this.idCounter = 0;
            this.counter = 0;
            this.total = this.box.find(this.options.selector);
            this.matrix = {};
            this.gridrow = new Object;
            // build columns
            this.columns = Math.max(this.options.minColumns, parseInt(this.box.innerWidth() / (this.options.minWidth + this.options.gutter))) + 1;

            var minWidth = this.options.minWidth;
            var gutter = this.options.gutter;
            var gridrow = new Object;

            var display = !this._isResizing ? "none" : "block";

            $.each(this.box.find(this.options.selector), function () {
  
                var dim = parseInt($(this).attr('class').replace(/^.*size([0-9]+).*$/, '$1')).toString().split('');
                var x = (dim[0] == "N") ? 1 : parseFloat(dim[0]);
                var y = (dim[1] == "a") ? 1 : parseFloat(dim[1]);
  
                $(this).css({
                    'display': display,
                    'position': 'absolute',
                    'width': minWidth * x + gutter * (x - 1),
                    'height': minWidth * y + gutter * (y - 1)
                }).removeClass('nested-moved').attr('data-box', self.idCounter);
  
                self.idCounter++;
  
                // render grid
                self._renderGrid($(this));
  
            });
 
            // position grid
            if(self.counter == self.total.length) {

                // if option resizeToFit is true
                if(self.options.resizeToFit) {
                    self.elements = self._fillGaps();
                    self._renderItems(self.elements);

                    // else
                } else {
                    self._renderItems(self.elements);
                }

                self.elements = [];

            }
        },
        
        _addMatrixRow: function(y) { // Add empty row for matrix
            if (this.matrix[y]) {
              return false;
            } else this.matrix[y] = [];
            for (var c = 0; c < (this.columns - 1); c++)
            {
              var x = c * (this.options.minWidth + this.options.gutter);
              this.matrix[y][x] = false;
            }
        },

        _updateMatrix: function (el) { // Update matrix based on box
            var t = parseInt(el['y']) - this.box.offset().top;
            var l = parseInt(el['x']) - this.box.offset().left;
            for (var h = 0; h < el['height']; h += (this.options.minWidth + this.options.gutter)) 
            {
                for (var w = 0; w < el['width']; w += (this.options.minWidth + this.options.gutter)) 
                {
                    var x = l + w;
                    var y = t + h;
                    if (!this.matrix[y]) {
                      this._addMatrixRow(y);
                    }
                    this.matrix[y][x] = true;
                }
            }
        },

        _fillGaps: function () {
            var self = this;
            var box = {};

            $.each(this.elements, function (index, el) { 
              self._updateMatrix(el);
            });
            
            
            var arr = this.elements;
            arr.sort(function(a,b) {
                return a.y - b.y;
            });
            arr.reverse();
            
            var topY = arr[0]['y'];
            $.each(this.matrix, function (y, row) {
                $.each(row, function (x, col) {

                    if(col === false) {
                        for(row = 0; row < 5; row++) // Check 3 rows down
                        {
                            box.h = self.options.minWidth;
                            var z = parseInt(y) + parseInt(row * (self.options.minWidth + self.options.gutter));
                            if (self.matrix[z] && self.matrix[z][x] === false) {
                                box.h += (self.options.minWidth + self.options.gutter);
                                self.matrix[z][x] = true;
                            }
                        }
                        if(!box.x) box.x = x;
                        if(!box.y) box.y = y;
                        if(!box.w) box.w = 0;

                        box.w += (box.w) ? (self.options.minWidth + self.options.gutter) : self.options.minWidth;
                        box.ready = true;

                    } else if(box.ready) {

                                                
                     //self.box.find(self.options.selector).not('.nested-moved').reverse().each(function (i, el) {
                         
                         $.each(arr, function (i, el) {
                            el = el['$el'];
                            if (arr[i]['y'] == topY && box.y < arr[i]['y']) {
                              item = arr.splice(i, 1);
                              self.elements.push({
                                $el: $(el),
                                x: parseInt(box.x) + self.box.offset().left,
                                y: parseInt(box.y) + self.box.offset().top,
                                width: parseInt(box.w),
                                height: parseInt(box.h)
                              });
                              return false;
                            }
                            /*
                            $(el).addClass('nested-moved');
                            
                            for(var i = 0, len = self.elements.length; i < len; i++) {
                                if(self.elements[i]['$el'].attr('data-box') == $(el).attr('data-box')) {
                                    self.elements.splice(i, 1);
                                    break;
                                }
                            }
                            
                            self.elements.push({
                                $el: $(el),
                                x: parseInt(box.x) + self.box.offset().left,
                                y: parseInt(box.y) + self.box.offset().top,
                                width: parseInt(box.w),
                                height: parseInt(box.h)
                            });


                            return false;
                           */
                        });
                        box = {};
                    }
                });

            });
            console.log(self.matrix);

            return self.elements;
        },

        _renderGrid: function ($box) {

            this.counter++;

            var ypos, gridy = ypos = 0;
            var tot = 0;

            // Width & height
            var width = $box.width();
            var height = $box.height();

            // Calculate row and col
            var col = Math.ceil(width / (this.options.minWidth + this.options.gutter));
            var row = Math.ceil(height / (this.options.minWidth + this.options.gutter));

            while(true) {
                for(var y = col; y >= 0; y--) {
                    if(this.gridrow[gridy + y]) break;
                    this.gridrow[gridy + y] = new Object;
                    for(var x = 0; x < this.columns; x++) {
                        this.gridrow[gridy + y][x] = false;
                    }
                }

                for(var column = 0; column < (this.columns - col); column++) {

                    // Add default empty matrix, used to calculate and update matrix for each box
                    matrixY = gridy * (this.options.minWidth + this.options.gutter);
                    this._addMatrixRow(matrixY);

                    var fits = true;

                    for(var y = 0; y < row; y++) {
                        for(var x = 0; x < col; x++) {
                            if(this.gridrow[gridy + y][column + x]) {
                                fits = false;
                                break;
                            }
                            if(!fits) {
                                break;
                            }
                        }
                    }

                    if(fits) {

                        // Set as taken
                        for(var y = 0; y < row; y++) {
                            for(var x = 0; x < col; x++) {
                                this.gridrow[gridy + y][column + x] = true;
                            }
                        }
                        
                        // Push to elements array
                        this._pushItem($box, column * (this.options.minWidth + this.options.gutter), gridy * (this.options.minWidth + this.options.gutter), width, height, col, row);
                        return;

                    }

                }
                gridy++;
            }
        },

        _pushItem: function ($el, x, y, w, h, cols, rows) {

            this.elements.push({
                $el: $el,
                x: x + this.box.offset().left,
                y: y + this.box.offset().top,
                width: w,
                height: h,
                cols: cols,
                rows: rows,
            });
        },

        _renderItems: function ($els) {
            
            var speed = this.options.animationOptions.speed;
            var effect = this.options.animationOptions.effect;
            var duration = this.options.animationOptions.duration;
            var queue = this.options.animationOptions.queue;
            var animate = this.options.animate;
            var complete = this.options.animationOptions.complete;
            var item = this;
            var i = 0;
            var t = 0;

            $.each($els, function (index, value) {

                //if animate and queue
                if(animate && queue) {                
                  setTimeout(function () {
                      value['$el'].css({
                        'display': 'block',
                        'width': value['width'],
                        'height': value['height'],
                      }).animate({
                        'left': value['x'],
                        'top': value['y'],
                      }, duration);
                      t++;
                      if (t == $els.length) {
                          complete.call(undefined, $els)
                      }
                  }, i * speed);
                  i++;
                }


              if(animate && !queue) {                
                //if animate and no queue
                setTimeout(function () {
                    value['$el'].css({
                      'display': 'block',
                      'width': value['width'],
                      'height': value['height'],
                    }).animate({
                      'left': value['x'],
                      'top': value['y'],
                    }, duration);
                    t++;
                    if (t == $els.length) {
                        complete.call(undefined, $els)
                    }
                }, i);
                i++;
              }

              if(!animate) {                
                    value['$el'].css({
                      'display': 'block',
                      'width': value['width'],
                      'height': value['height'],
                      'left': value['x'],
                      'top': value['y'],
                    });
                    t++;
                    if (t == $els.length) {
                        complete.call(undefined, $els)
                    }
              }


            });
        },

        _renderItem: function ($el, x, y) {

            var speed = this.options.animationOptions.speed;
            var effect = this.options.animationOptions.effect;
            var duration = this.options.animationOptions.duration;
            var queue = this.options.animationOptions.queue;
            var animate = this.options.animate;
            var complete = this.options.animationOptions.complete;
            var item = this.box;
            var i = 0;
            var t = 0;

            $el.css({
                'left': x + this.box.offset().left,
                'top': y + this.box.offset().top
            });
        },

        append: function ($els) {
            console.log($els);
            this._isResizing = true;
            this._setBoxes();
        },

        resize: function () {
            this._isResizing = true;
            this._setBoxes();
            this._isResizing = false;
        },

    }

    $.fn.nested = function (options, e) {
        if(typeof options === 'string') {
            this.each(function () {
                var container = $.data(this, 'nested');
                container[options].apply(container, [e]);
            });
        } else {
            this.each(function () {
                $.data(this, 'nested', new $.Nested(options, this));
            });
        }
        return this;
    }

})(jQuery);
