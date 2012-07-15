/**
 * pSlider v1.0 jQuery plugin
 * Copyright (c) 2012, Konstantin Vayner <poncha@gmx.net>
 * GitHub: https://github.com/poncha/jquery-plugins/tree/master/pSlider
 */

(function($){

	var methods = {

		init: function(options) {
		
			var mode = options.mode !== undefined ? options.mode : $.fn.pSlider.defaults.mode;
			var cfg = $.extend({}, $.fn.pSlider.defaults, $.fn.pSlider.mode_defaults[mode], options);

			if(cfg.debug) debug({method: 'init', options: options, cfg: cfg});
			
			return this.each(function(){

				var $this = $(this),
					data = $this.data('pSlider');
				
				if( !data )
				{
					var container = $this.parent(),
						container_width = container.width();
					
					var items = $this.children(),
						items_count = items.length,
						items_width = 0,
						//item_widths = [],
						item_index = 0;

					if(!items_count) return;

					items.each(function(){
						var item_width = $( this ).outerWidth( true );
						$(this).addClass('slider-item-original').addClass('slider-item-' + item_index);
						//$(this).attr('title', 'width: ' + item_width + 'px');
						//item_widths[item_index] = item_width;
						items_width += item_width;
						item_index++;
					});
					
					// it should cover at least 3 containers width, and have at least 2 copies
					var copies = Math.max(2, Math.floor(3 * container_width / items_width));
					
					for(var copy=0; copy<copies; ++copy) {
						var items_copy = items.clone();
						item_index = 0;
						items_copy.removeClass('slider-item-original').each(function(){
							//item_widths[copy*items_count + item_index] = item_widths[item_index];
							$(this).addClass('slider-item-copy slider-item-copy-' + copy);
							item_index++;
						}).appendTo($this);
					}
					
					var items_total_count = items_count * (copies + 1);
					var items_total_width = items_width * (copies + 1);
					
					data = {
						options: cfg,
						
						// container
						container: container,
						containerWidth: container_width,
						
						// original set of items
						itemsCount: items_count,
						itemsWidth: items_width,
						
						// how many copies of the items have we made?
						copies: copies,
						
						// all items, including copies
						itemsTotalCount: items_total_count,
						itemsTotalWidth: items_total_width

						//currentItem: 0
					};
					if(cfg.debug) debug({data: data});

					container.css({
						position: 'relative'
					});
					
					$this.css({
						position: 'absolute',
						width: items_total_width,
						left: -1 * items_width
					});
					
					$this.data('pSlider', data);
					
					// scroll one item at a time
					$this.bind('nextItem', handleEvent);
					$this.bind('prevItem', handleEvent);
					
					// scroll pre-defined block size at a time
					$this.bind('nextBlock', handleEvent);
					$this.bind('prevBlock', handleEvent);
					
					// scroll full page (full length of container)
					$this.bind('nextPage', handleEvent);
					$this.bind('prevPage', handleEvent);
					
					// next/prev events depend on mode: if mode=item , then next=nextItem, etc. (ignored for mode=smooth)
					$this.bind('next', handleEvent);
					$this.bind('prev', handleEvent);
					
					// slideshow
					$this.bind('start', handleEvent);
					$this.bind('stop', handleEvent);
				}
			
			});
		},
		
		destroy: function() {
		
			return this.each(function(){
			
				var $this = $(this);
			
				$this.pSlider('stop');
				
				$this.unbind('nextItem');
				$this.unbind('prevItem');
				
				$this.unbind('nextBlock');
				$this.unbind('prevBlock');
				
				$this.unbind('nextPage');
				$this.unbind('prevPage');
				
				$this.unbind('next');
				$this.unbind('prev');

				$this.unbind('start');
				$this.unbind('stop');
				
				// remove item duplicates...
				$this.children('.slider-item-copy').remove();
				
				// cleanup stored slider data
				$this.removeData('pSlider');
			});
		},
		
		scrollReal: function(options) {
		
			return this.each(function(){
			
				var $this = $(this),
					data = $this.data('pSlider'),
					container = data.container,
					cfg = $.extend({}, data.options, options);

				if(cfg.debug) debug({method: 'scrollReal', options: options, cfg: cfg});

				$this.stop();
					
				// scrollAmount is real scroll amount in pixels, amount may be in mode-specific units
				var scrollAmount = cfg.scrollAmount !== undefined ? cfg.scrollAmount : cfg.amount;

				// if we're moving left, then scrollAmount is negative
				if(cfg.direction == 'left') scrollAmount *= -1;

				// current offset
				var offset = $this.position().left;
				
				// calculate new offset
				var new_offset = offset + scrollAmount;
				
				if(cfg.debug) debug("Offset calculation", {offset: offset, scrollAmount: scrollAmount, new_offset: new_offset});
				
				while( new_offset <= -2 * data.itemsWidth )
				{
					if(cfg.debug) debug("New offset " + new_offset + " is too far left. Moving right");
					offset += data.itemsWidth;
					new_offset += data.itemsWidth;
					$this.css({left: offset});
				}
				
				while( new_offset >= 0 )
				{
					if(cfg.debug) debug("New offset " + new_offset + " is too far right. Moving left");
					offset -= data.itemsWidth;
					new_offset -= data.itemsWidth;
					$this.css({left: offset});
				}
				
				if(cfg.debug) debug("Final offset", {offset: offset, scrollAmount: scrollAmount, new_offset: new_offset});
				
				var callback = cfg.complete !== undefined ? cfg.complete : undefined;
				
				var animate_css = {
					left: new_offset
				};
				
				var animate_options = {
					speed: cfg.speed,
					easing: cfg.easing,
					complete: callback
				};
				
				if(cfg.debug) debug("Animation settings", animate_css, animate_options);
				
				//var fx_off = $.fx.off;
				//if(cfg.fx_off) $.fx.off = true;
				
				if(cfg.fx_off) {
					$this.css(animate_css);

					if(callback !== undefined)
						callback.apply();
				}
				else {				
					$this.animate(animate_css, animate_options);
				}
				
				//$.fx.off = fx_off;
				
			});
		
		},
		
		scrollLeft: function(options) {
			if(options.debug) debug({method: 'scrollLeft', options: options});
			return this.each(function(){
				$(this).pSlider('scrollReal', $.extend({}, options, {direction:'left'}));
			});
		},
		
		scrollRight: function(options) {
			if(options.debug) debug({method: 'scrollRight', options: options});
			return this.each(function(){
				$(this).pSlider('scrollReal', $.extend({}, options, {direction:'right'}));
			});
		},
		
		nextItem: function(options) {
		
			return this.each(function() {
			
				var $this = $(this),
					data = $this.data('pSlider'),
					cfg = $.extend({}, data.options, options);
				
				if(cfg.debug) debug({method: 'nextItem', options: options, cfg: cfg});
				
				var offset = Math.abs($this.position().left);
				var item, scrollMethod, scrollAmount;
				
				if(cfg.direction == 'right') {
					var items_before = getFirstVisibleItem($this).prevAll();
					// if no items before current, move 1 set of items to the left
					if( items_before.length == 0 ) {
						$this.css({ left: $this.position().left - data.itemsWidth });
					}
					item = getFirstVisibleItem($this).prev();
					scrollAmount = offset - item.position().left;
					scrollMethod = 'scrollRight';
				}
				else {
					item = getFirstVisibleItem($this).next();				
					scrollAmount = item.position().left - offset;
					scrollMethod = 'scrollLeft';
				}

				cfg.scrollAmount = scrollAmount;
				
				if(cfg.debug) debug({scrollMethod: scrollMethod, scrollAmount: scrollAmount});
				
				$this.pSlider(scrollMethod, cfg);
			
			});
		},
		
		prevItem: function(options) {
		
			return this.each(function() {
			
				var $this = $(this),
					data = $this.data('pSlider'),
					cfg = $.extend({}, data.options, options);
				
				if(cfg.debug) debug({method: 'prevItem', options: options, cfg: cfg});
				
				var offset = Math.abs($this.position().left);
				var item, scrollMethod, scrollAmount;
				
				if(cfg.direction == 'right') {
					item = getFirstVisibleItem($this).next();
					scrollAmount = item.position().left - offset;
					scrollMethod = 'scrollLeft';
				}
				else {
					item = getFirstVisibleItem($this).prev();
					scrollAmount = offset - item.position().left;
					scrollMethod = 'scrollRight';
				}

				cfg.scrollAmount = scrollAmount;
				
				if(cfg.debug) debug({scrollMethod: scrollMethod, scrollAmount: scrollAmount});
				
				$this.pSlider(scrollMethod, cfg);
			
			});
		},
		
		nextBlock: function(options) {
		
			return this.each(function(){
			
				var $this = $(this),
					data = $this.data('pSlider'),
					cfg = $.extend({}, data.options, options);

				if(cfg.debug) debug({method: 'nextBlock', options: options, cfg: cfg});

				if( cfg.mode == 'item' ) { // amount = number of items
				
					if(cfg.amount > data.itemsCount) {
						cfg.amount = cfg.amount % data.itemsCount;
						if(cfg.debug) debug("updated amount", {amount: cfg.amount});
					}
					
					var offset = Math.abs($this.position().left);
					var item, scrollMethod, scrollAmount;
					
					if( cfg.direction == 'right' ) {
						// get all items before current
						var items_before = getFirstVisibleItem($this).prevAll();

						// if not enough items before current, shift 1 set of items left
						if( items_before.length < cfg.amount ) {
							// shift slider
							$this.css({ left: $this.position().left - data.itemsWidth });
							// rescan items_before
							items_before = getFirstVisibleItem($this).prevAll();
							//recalculate slider offset
							offset = Math.abs(offset - data.itemsWidth);
						}

						// get the target item
						item = items_before.slice(cfg.amount -1, cfg.amount);

						scrollAmount = offset - item.position().left;
						scrollMethod = 'scrollRight';
					}
					else {
						item = getFirstVisibleItem($this).nextAll().slice(cfg.amount -1, cfg.amount);
						scrollAmount = item.position().left - offset;
						scrollMethod = 'scrollLeft';
					}
					
					cfg.scrollAmount = scrollAmount;
					
					if(cfg.debug) debug({scrollMethod: scrollMethod, scrollAmount: scrollAmount});

					$this.pSlider(scrollMethod, cfg);
				}
				else { // amount = number of pixels
					cfg.scrollAmount = cfg.amount;
					
					var scrollMethod;
					
					if( cfg.direction == 'right' ) {
						scrollMethod = 'scrollRight';
					}
					else {
						scrollMethod = 'scrollLeft';
					}
					
					if(cfg.debug) debug({scrollMethod: scrollMethod, scrollAmount: cfg.scrollAmount});

					$this.pSlider(scrollMethod, cfg);
				}
			});
			
		},
		
		prevBlock: function(options) {
		
			return this.each(function(){
			
				var $this = $(this),
					data = $this.data('pSlider'),
					cfg = $.extend({}, data.options, options);

				if(cfg.debug) debug({method: 'prevBlock', options: options, cfg: cfg});

				if( cfg.mode == 'item' ) { // amount = number of items
				
					if(cfg.amount > data.itemsCount) cfg.amount = cfg.amount % data.itemsCount;
					
					var offset = Math.abs($this.position().left);
					var item, scrollMethod, scrollAmount;
					
					if( cfg.direction == 'right' ) {
						item = getFirstVisibleItem($this).nextAll().slice(cfg.amount -1, cfg.amount);
						scrollAmount = item.position().left - offset;
						scrollMethod = 'scrollLeft';
					}
					else {
						// get all items before current
						var items_before = getFirstVisibleItem($this).prevAll();

						// if not enough items before current, shift 1 set of items left
						if( items_before.length < cfg.amount ) {
							// shift slider
							$this.css({ left: $this.position().left - data.itemsWidth });
							// rescan items_before
							items_before = getFirstVisibleItem($this).prevAll();
							//recalculate slider offset
							offset = Math.abs(offset - data.itemsWidth);
						}

						// get the target item
						item = items_before.slice(cfg.amount -1, cfg.amount);

						scrollAmount = offset - item.position().left;
						scrollMethod = 'scrollRight';
					}
					
					cfg.scrollAmount = scrollAmount;

					if(cfg.debug) debug({scrollMethod: scrollMethod, scrollAmount: scrollAmount});

					$this.pSlider(scrollMethod, cfg);
				}
				else { // amount = number of pixels
					cfg.scrollAmount = cfg.amount;
					
					var scrollMethod;
					
					if( cfg.direction == 'right' ) {
						scrollMethod = 'scrollLeft';
					}
					else {
						scrollMethod = 'scrollRight';
					}

					if(cfg.debug) debug({scrollMethod: scrollMethod, scrollAmount: cfg.scrollAmount});
					
					$this.pSlider(scrollMethod, cfg);
				}
			});
			
		},
		
		nextPage: function(options) {
		
			return this.each(function(){
			
				var $this = $(this),
					data = $this.data('pSlider'),
					cfg = $.extend({}, data.options, options, {scrollAmount: data.containerWidth});
				
				if(cfg.debug) debug({method: 'nextPage', options: options, cfg: cfg});
		
				if( cfg.direction == 'right' )
					$this.pSlider('scrollRight', cfg);
				else
					$this.pSlider('scrollLeft', cfg);
				
			});

		},
	
		prevPage: function(options) {
		
			return this.each(function(){
			
				var $this = $(this),
					data = $this.data('pSlider'),
					cfg = $.extend({}, data.options, options, {scrollAmount: data.containerWidth});
					
				if(cfg.debug) debug({method: 'prevPage', options: options, cfg: cfg});
		
				if( cfg.direction == 'right' )
					$this.pSlider('scrollLeft', cfg);
				else
					$this.pSlider('scrollRight', cfg);
				
			});

		},

		next: function(options) {
		
			return this.each(function(){
			
				var $this = $(this),
					data = $this.data('pSlider'),
					cfg = $.extend({}, data.options, options);
					
				if(cfg.debug) debug({method: 'next', options: options, cfg: cfg});
				
				switch( cfg.mode )
				{
					case 'page':
						$this.pSlider('nextPage', cfg);
						break;
					case 'block':
						$this.pSlider('nextBlock', cfg);
						break;
					case 'item':
						$this.pSlider('nextItem', cfg);
						break;
					case 'smooth':
					default:
						$this.pSlider('scrollReal', cfg);
						break;
				}
				
			});

		},
		
		prev: function(options) {
		
			return this.each(function(){
			
				var $this = $(this),
					data = $this.data('pSlider'),
					cfg = $.extend({}, data.options, options);
					
				if(cfg.debug) debug({method: 'prev', options: options, cfg: cfg});
				
				switch( cfg.mode )
				{
					case 'page':
						$this.pSlider('prevPage', cfg);
						break;
					case 'block':
						$this.pSlider('prevBlock', cfg);
						break;
					case 'item':
						$this.pSlider('prevItem', cfg);
						break;
					case 'smooth':
					default:
						cfg.direction = cfg.direction == 'right' ? 'left' : 'right';
						$this.pSlider('scrollReal', cfg);
						break;
				}
				
			});

		},
	
		// start slideshow
		start: function(options) {
		
			return this.each(function() {
			
				var $this = $(this),
					data = $this.data('pSlider'),
					cfg = $.extend({}, data.options, options);
					
				if(cfg.debug) debug({method: 'start', options: options, cfg: cfg});
				
				// first of all, stop any ongoing scrolling
				$this.pSlider('stop');
				
				// for smooth animation - disable jQuery fx
				// we just apply css directly there, without transitions, otherwise animation is getting too slow
				if( cfg.mode == 'smooth' ) cfg.fx_off = true;
				
				// store current configuration for slideshow (so that slideshow is running with current options and not defaults)
				$this.data('pSlider.slideShow', cfg);
				
				// start slideshow
				slideShow($this);

			});
		
		},
		
		// stop slideshow
		stop: function(options) {
		
			return this.each(function() {
			
				var $this = $(this),
					timeout = $this.data('pSlider.slideShow.timeout');

				// if timeout is waiting, lets clear it
				if(timeout) window.clearTimeout(timeout);

				$this.stop(); // stop animation
				$this.data('pSlider.slideShow.timeout', false); // reset timeout ref
				$this.data('pSlider.slideShow', false); // reset slideshow configuration
			});
		
		}
		
	};
	
	// return first (left-most) visible item (private)
	getFirstVisibleItem = function(slider) {
	
		var offset = Math.abs(slider.position().left);
		
		return slider.children().filter(function(index){
			return offset < $(this).position().left + $(this).outerWidth();
		}).first();
		
		// why is this wrong?! (returns all items!)
		//return slider.children(':visible:first');
	};
	
	// event handler (private)
	handleEvent = function(event) {
		$(event.target).pSlider(event.type, event.data);
	};

	// perform slideshow (private)
	slideShow = function(slider) {
	
		//debug({method: 'slideShow'});
		
		var $this = $(slider),
			cfg = $this.data('pSlider.slideShow');
			
		if( cfg ) {
			
			cfg.complete = function(){
				var timeout = $this.data('pSlider.slideShow.timeout');
				if(timeout) window.clearTimeout(timeout);
				timeout = window.setTimeout(function(){ slideShow(slider); }, cfg.delay);
				$this.data('pSlider.slideShow.timeout', timeout);
			};
			slider.pSlider('next', cfg);
			
		}
			
	};

	// send debug output to console.log (private)
	debug = function() {
		for(var i=0; i<arguments.length; ++i) {
			var arg = arguments[i];
			var log = '';
			if(arguments.length>1) log += i + ': ';
			if( typeof(arg) == 'object' ) {
				log += '{\n';
				for(var key in arg) {
					log += ' ' + key + ': ';
					var val = arg[key];
					if(typeof(val) == 'object') {
						log += '{\n';
						for(var k in val) log += '  ' + k + ': ' + val[k] + '\n';
						log += '  }';
					}
					else log += val;
					log += ',\n';
				}
				log += '}';
			}
			else log += arg;
			console.log(log);
		}
	};

	// this will be callable as $(selector).pSlider
	$.fn.pSlider = function( method ) {
	    // Method calling logic
		if ( methods[method] ) {
		  return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
		  return methods.init.apply( this, arguments );
		} else {
		  $.error( 'Method ' +  method + ' does not exist on jQuery.pSlider' );
		}    
	};
	
	// slider defaults
	$.fn.pSlider.defaults = {
		direction: 'right', // positive direction: right|left
		mode: 'item', // scroll type: smooth|item|block|page
		amount: null, // amount of units (see mode-specific settings) to move
		speed: null, // transition speed (ignored by mode=smooth)
		easing: '', // easing function used for animation
		delay: null, // delay between transitions
		debug: false
	};
	
	// defaults for each mode
	$.fn.pSlider.mode_defaults = {
		smooth: {
			amount: 1, // pixels
			delay: 10
		},
		item: {
			amount: 3, // number of items for nextBlock/prevBlock (nextItem/prevItem always scrolls single item, regardless of mode)
			speed: 'fast', // transition speed (milliseconds or 'fast'/'slow')
			delay: 1000 // delay between transitions in slideshow (milliseconds)
		},
		block: {
			amount: 100, // block size in pixels
			speed: 'fast', // transition speed (milliseconds or 'fast'/'slow')
			delay: 1000 // delay between transitions in slideshow (milliseconds)
		},
		page: {
			speed: 'fast', // transition speed (milliseconds or 'fast'/'slow')
			delay: 5000 // delay between transitions in slideshow (milliseconds)
		}
	};
	
})(jQuery);
