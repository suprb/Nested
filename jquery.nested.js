/**
 * jQuery Nested v1.0
 *
 */

// Debouncing function from John Hann
// http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
// Copy pasted from http://paulirish.com/2009/throttled-smartresize-jquery-event-handler/

jQuery.fn.reverse = [].reverse;

(function ($, sr) {
    var debounce = function (func, threshold, execAsap) {
        var timeout;
        return function debounced() {
            var obj = this,
                args = arguments;

            function delayed() {
                if (!execAsap) func.apply(obj, args);
                timeout = null;
            };
            if (timeout) clearTimeout(timeout);
            else if (execAsap) func.apply(obj, args);

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
        minWidth: 50,
        minColumns: 1,
        gutter: 10,
        animate: false,
        fillGaps: true,
    };

    $.Nested.prototype = {

        _init: function (options) {

            var container = this;
            this.name = this._setName(5);
            this.rows = 1;
            this.matrix = {};
            this.gridrow = new Object;
            this.box = this.element;
            this.options = $.extend(true, {}, $.Nested.settings, options);
  
            // build columns
            this.columns = Math.max(this.options.minColumns, parseInt(this.box.innerWidth() / (this.options.minWidth + this.options.gutter))) + 1;
            
            // build box dimensions
            this._setBoxes();
            
            // render grid
            $.each(this.box.find(this.options.selector), function() {
                container._renderGrid($(this));
            });

            if (this.options.fillGaps) {
              this._fillGaps();
            }

            // add smartresize
            $(window).smartresize(function () {
                container.resize();
            });
        },

        _setName: function (length, current) {
            current = current ? current : '';
            return length ? this._setName(--length, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 60)) + current) : current;
        },

        _setBoxes: function () {
            
            var minWidth = this.options.minWidth;
            var gutter = this.options.gutter;
            var gridrow = new Object;
            var columns = this.columns;
            
      	    $.each(this.box.find(this.options.selector), function() {
                
              var dim = parseInt($(this).attr('class').replace(/^.*size([0-9]+).*$/, '$1')).toString().split('');
              var x = (dim[0] == "N") ? 1 : parseFloat(dim[0]);
              var y = (dim[1] == "a") ? 1 : parseFloat(dim[1]);
                
                $(this).css({
      	           'width': minWidth * x + gutter * (x-1),
      	           'height': minWidth * y + gutter * (y-1)
      	        }).removeClass('moved');
            });
                    	    
        },
        _updateMatrix: function($box) {
          var t = parseInt($box.css('top')) - this.box.offset().top;
          var l = parseInt($box.css('left')) - this.box.offset().left;
          for (var h = 0; h < $box.height(); h+=(this.options.minWidth + this.options.gutter))
          {
            for (var w = 0; w < $box.width(); w+=(this.options.minWidth + this.options.gutter))
            {
              var x = l + w;
              var y = t + h;
              if (!this.matrix[y]) {
                this.matrix[y] = [];
              }
              this.matrix[y][x] = true;
            }
          }
        },
        _fillGaps: function() {
          var self = this;
          var box = {};
          this.box.find(this.options.selector).each(function(index, el){
            self._updateMatrix($(el));
          });
          $.each(this.matrix, function(y, row){
            $.each(row, function(x, col){
              if (col === false) {
                for (i = 1; i < 4; i++) // Check 3 rows down
                {
                  var y2 = parseInt(y) + parseInt(i * (self.options.minWidth + self.options.gutter));
                  box.h = self.options.minWidth;
                  if (self.matrix[y2] && self.matrix[y2][x] && self.matrix[y2][x] === false) {
                    box.h += (self.options.minWidth + self.options.gutter);
                    self.matrix[y2][x] = true;
                  }
                }
                if (!box.x) box.x = x;
                if (!box.y) box.y = y;
                if (!box.w) box.w = 0;
                box.w += (box.w) ? (self.options.minWidth + self.options.gutter) : self.options.minWidth;
                box.ready = true;
              } else if (box.ready) {
                self.box.find(self.options.selector).not('.moved').reverse().each(function(i, el) {
                  console.log(box);
                  $(el).css({
      	            'width': parseInt(box.w),
      	            'height': parseInt(box.h)
      	          }).addClass('moved');
                  self._renderItem($(el), parseInt(box.x), parseInt(box.y));
                  return false;
                });
                box = {};
              }
            });
          });
        },
        _renderGrid: function ($box) {

           var ypos, gridy = ypos = 0;
           var missFits = [];

              // Width & height
        	    var width = $box.width();
        	    var height = $box.height();

        	    // Calculate row and col
        	    var col = Math.ceil(width / (this.options.minWidth + this.options.gutter));
        	    var row = Math.ceil(height / (this.options.minWidth + this.options.gutter));
  	    	    do {
        	        for (var y = col; y >= 0; y--) {
        	            if (this.gridrow[gridy + y]) {
        	                break;
        	            }
        	            this.gridrow[gridy + y] = new Object;
        	            for (var x = 0; x < this.columns; x++) {
        	                this.gridrow[gridy + y][x] = false;
        	            }
        	            this.rows++;
        	        }

        	        for (var column = 0; column < (this.columns - col); column++) {

                      // Add default empty matrix, used to calculate and update matrix for each box
                      matrixY = gridy * (this.options.minWidth + this.options.gutter);
                      matrixX = column * (this.options.minWidth + this.options.gutter);
                      if (!this.matrix[matrixY]) this.matrix[matrixY] = [];
                      if (!this.matrix[matrixY][matrixX]) {
                        this.matrix[matrixY][matrixX] = false;
                      }

                      var fits = true;

        	            for (var y = 0; y < row; y++) {
        	                for (var x = 0; x < col; x++) {

        	                    if (this.gridrow[gridy + y][column + x]) {
        	                       fits = false;
        	                       break;
        	                    }

        	                    if(!fits) {

        	                     // put missfits into an array (no clue why and what to do with it, but maybe something?…) 
        	                     if ($.inArray(gridy + y, missFits)<0) {
        	                       missFits.push(gridy + y);
                               }
        	                    }
        	                }
        	            }

        	            if (fits) {

        	                // Set as taken
        	                for (var y = 0; y < row; y++) {
        	                    for (var x = 0; x < col; x++) {
        	                        this.gridrow[gridy + y][column + x] = true;
        	                    }
        	                }
                          this._renderItem($box, column * (this.options.minWidth + this.options.gutter), gridy * (this.options.minWidth + this.options.gutter));
        	                return;
        	            }
        	            
        	        }
        	    } while (++gridy < this.rows)
              
 
            
 
         },      
 
     

        _renderItem: function ($el, x, y) {
            $el.css({
      	        'left': x + this.box.offset().left,
      	        'top': y + this.box.offset().top
            });
        },

        resize: function () {
          this._init();
        },

    }

    $.fn.nested = function (options, e) {
        if (typeof options === 'string') {
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
