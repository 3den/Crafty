Crafty.extend({
	/**@
	* #Crafty.randRange
	* @category Math
	* @sign public Number Crafty.randRange(Number from, Number to)
	* @param from - Lower bound of the range
	* @param to - Upper bound of the range
	* Returns a random number between (and including) the two numbers.
	*/
	randRange: function(from, to) {
		return Math.round(Math.random() * (to - from) + from);
	},
	
	/**@
	* #Crafty.randRange
	* @category Math
	* @sign public Number Crafty.randRange(Number from, Number to)
	* @param from - Lower bound of the range
	* @param to - Upper bound of the range
	* Returns a random number between (and including) the two numbers.
	*/
	zeroFill: function(number, width) {
		width -= number.toString().length;
		if (width > 0)
			return new Array(width + (/\./.test( number ) ? 2 : 1)).join( '0' ) + number;
		return number.toString();
	},
	
	/**@
	* #Crafty.n
	* @category Math
	* @sign public Number Crafty.n(* n)
	* @param n - Any value that will be converted to an int
	* Cast anything to a number. If it can't it will return 0 (none of this NaN rubbish).
	*/
	n: function(n) {
		return isNaN(+n) ? 0 : +n;
	},
	
	/**@
	* #Crafty.sprite
	* @category Graphics
	* @sign public this Crafty.sprite([Number tile], String url, Object map[, Number paddingX[, Number paddingY]])
	* @param tile - Tile size of the sprite map, defaults to 1
	* @param url - URL of the sprite image
	* @param map - Object where the key is what becomes a new component and the value points to a position on the sprite map
	* @param paddingX - Horizontal space inbetween tiles. Defaults to 0.
	* @param paddingY - Vertical space inbetween tiles. Defaults to paddingX.
	* Generates components based on positions in a sprite image to be applied to entities.
	*
	* Accepts a tile size, URL and map for the name of the sprite and it's position. 
	*
	* The position must be an array containing the position of the sprite where index `0` 
	* is the `x` position, `1` is the `y` position and optionally `2` is the width and `3` 
	* is the height. If the sprite map has padding, pass the values for the `x` padding 
	* or `y` padding. If they are the same, just add one value.
	*
	* If the sprite image has no consistent tile size, `1` or no argument need be 
	* passed for tile size.
	*
	* Entities that add the generated components are also given a component called `Sprite`.
	* @see Sprite
	*/
	sprite: function(tile, tileh, url, map, paddingX, paddingY) {
		var pos, temp, x, y, w, h, img;
		
		//if no tile value, default to 1
		if(typeof tile === "string") {
			paddingY = paddingX;
			paddingX = map;
			map = tileh;
			url = tile;
			tile = 1;
			tileh = 1;
		}
		
		if(typeof tileh == "string") {
			paddingY = paddingX;
			paddingX = map;
			map = url;
			url = tileh;
			tileh = tile;
		}
		
		//if no paddingY, use paddingX
		if(!paddingY && paddingX) paddingY = paddingX;
		paddingX = Crafty.n(paddingX); //just incase
		paddingY = Crafty.n(paddingY);
		
		img = Crafty.assets[url];
		if(!img) {
			img = new Image();
			img.src = url;
			Crafty.assets[url] = img;
			img.onload = function() {
				//all components with this img are now ready
				for(var pos in map) {
					Crafty(pos).each(function() {
						this.ready = true;
						this.trigger("Change");
					});
				}
			};
		}
		
		for(pos in map) {
			if(!map.hasOwnProperty(pos)) continue;
			
			temp = map[pos];
			x = temp[0] * tile + paddingX;
			y = temp[1] * tileh + paddingY;
			w = temp[2] * tile || tile;
			h = temp[3] * tileh || tileh;
			
			Crafty.c(pos, {
				__image: url,
				__coord: [x,y,w,h],
				__tile: tile,
				__tileh: tileh,
				__padding: [paddingX, paddingY],
				__trim: null,
				img: img,
				ready: false,
				
				init: function() {
					this.addComponent("Sprite");
					this.__trim = [0,0,0,0];
					this.__coord = [this.__coord[0], this.__coord[1], this.__coord[2], this.__coord[3]];
		
					//draw now
					if(this.img.complete && this.img.width > 0) {
						this.ready = true;
					}

					//set the width and height to the sprite size
					this.w = this.__coord[2];
					this.h = this.__coord[3];
					
                    var draw = function(e) {
    					var co = this.__coord,
							old = this._changed,
							pos = e.pos || this,
							context = Crafty.canvas.context;
							
						if(e.type === "canvas") {
							//draw the image on the canvas element
							try {
							context.drawImage(this.img, //image element
								co[0], //x position on sprite
								co[1], //y position on sprite
								co[2], //width on sprite
								co[3], //height on sprite
								pos.x, //x position on canvas
								pos.y, //y position on canvas
								this.w, //width on canvas
								this.h //height on canvas
							);
							
							} catch(err) {
								console.log(err, co, pos, this);
							}
						} else if(e.type === "DOM") {
							//check if the sprite changed
							if(old.cox !== co[0] || old.coy !== co[1]) {
								this._element.style.background = "url('" + this.__image + "') no-repeat -" + co[0] + "px -" + co[1] + "px";
								old.cox = co[0];
								old.coy = co[1];
							}
						}
					};
                    
					this.bind("Draw", draw).bind("RemoveComponent", function(id) {
                        if(id === pos) this.unbind("Draw", draw);  
                    });
				}
			});
		}
		
		return this;
	},
	
	_events: {},

	/**@
	* #Crafty.addEvent
	* @category Events, Misc
	* @sign public this Crafty.addEvent(Object ctx, HTMLElement obj, String event, Function callback)
	* @param ctx - Context of the callback or the value of `this`
	* @param obj - Element to add the DOM event to
	* @param event - Event name to bind to
	* @param callback - Method to execute when triggered
	* Adds DOM level 3 events to elements. The arguments it accepts are the call 
	* context (the value of `this`), the DOM element to attach the event to, 
	* the event name (without `on` (`click` rather than `onclick`)) and 
	* finally the callback method. 
	*
	* If no element is passed, the default element will be `window.document`.
	* 
	* Callbacks are passed with event data.
	* @see Crafty.removeEvent
	*/
	addEvent: function(ctx, obj, type, fn) {
		if(arguments.length === 3) {
			fn = type;
			type = obj;
			obj = window.document;
		}

		//save anonymous function to be able to remove
		var afn = function(e) { var e = e || window.event; fn.call(ctx,e) },
			id = ctx[0] || "";

		if(!this._events[id+obj+type+fn]) this._events[id+obj+type+fn] = afn;
		else return;

		if (obj.attachEvent) { //IE
			obj.attachEvent('on'+type, afn);
		} else { //Everyone else
			obj.addEventListener(type, afn, false);
		}
	},

	/**@
	* #Crafty.removeEvent
	* @category Events, Misc
	* @sign public this Crafty.removeEvent(Object ctx, HTMLElement obj, String event, Function callback)
	* @param ctx - Context of the callback or the value of `this`
	* @param obj - Element the event is on
	* @param event - Name of the event
	* @param callback - Method executed when triggered
	* Removes events attached by `Crafty.addEvent()`. All parameters must 
	* be the same that were used to attach the event including a reference 
	* to the callback method.
	* @see Crafty.addEvent
	*/
	removeEvent: function(ctx, obj, type, fn) {
		if(arguments.length === 3) {
			fn = type;
			type = obj;
			obj = window.document;
		}

		//retrieve anonymouse function
		var id = ctx[0] || "",
			afn = this._events[id+obj+type+fn];

		if(afn) {
			if (obj.detachEvent) {
				obj.detachEvent('on'+type, afn);
			} else obj.removeEventListener(type, afn, false);
			delete this._events[id+obj+type+fn];
		}
	},
	
	/**@
	* #Crafty.background
	* @category Graphics, Stage
	* @sign public void Crafty.background(String value)
	* @param color - Modify the background with a color or image
	* This method is essentially a shortcut for adding a background
	* style to the stage element.
	*/
	background: function(color) {
		Crafty.stage.elem.style.background = color;
	},
	
	/**@
	* #Crafty.viewport
	* @category Stage
	* Viewport is essentially a 2D camera looking at the stage. Can be moved which
	* in turn will react just like a camera moving in that direction.
	*/
	viewport: {
		width: 0, 
		height: 0,
		/**@
		* #Crafty.viewport.x
		* @comp Crafty.viewport
		* Will move the stage and therefore every visible entity along the `x` 
		* axis in the opposite direction.
		*
		* When this value is set, it will shift the entire stage. This means that entity 
		* positions are not exactly where they are on screen. To get the exact position, 
		* simply add `Crafty.viewport.x` onto the entities `x` position.
		*/
		x: 0,
		/**@
		* #Crafty.viewport.y
		* @comp Crafty.viewport
		* Will move the stage and therefore every visible entity along the `y` 
		* axis in the opposite direction.
		*
		* When this value is set, it will shift the entire stage. This means that entity 
		* positions are not exactly where they are on screen. To get the exact position, 
		* simply add `Crafty.viewport.y` onto the entities `y` position.
		*/
		y: 0,
		
		scroll: function(axis, v) {
			v = Math.floor(v);
			var change = (v - this[axis]), //change in direction
				context = Crafty.canvas.context,
				style = Crafty.stage.inner.style;
			
			//update viewport and DOM scroll
			this[axis] = v;
			if(axis == 'x') {
				if(context) context.translate(change, 0);
			} else {
				if(context) context.translate(0, change);
			}
			
			style[axis === 'x' ? "left" : "top"] = ~~v + "px";
		},
		
		rect: function() {
			return {x: -this.x, y: -this.y, w: this.width, h: this.height};
		},
		
		init: function(w, h) {
			Crafty.DOM.window.init();
			
			//fullscreen if mobile or not specified
			this.width = (!w || Crafty.mobile) ? Crafty.DOM.window.width : w;
			this.height = (!h || Crafty.mobile) ? Crafty.DOM.window.height : h;
			
			//check if stage exists
			var crstage = document.getElementById("cr-stage");
			
			//create stage div to contain everything
			Crafty.stage = {
				x: 0,
				y: 0,
				fullscreen: false,
				elem: (crstage ? crstage : document.createElement("div")),
				inner: document.createElement("div")
			};
			
			//fullscreen, stop scrollbars
			if((!w && !h) || Crafty.mobile) {
				document.body.style.overflow = "hidden";
				Crafty.stage.fullscreen = true;
			}
			
			Crafty.addEvent(this, window, "resize", function() {
				Crafty.DOM.window.init();
				var w = Crafty.DOM.window.width,
					h = Crafty.DOM.window.height,
					offset;
				
				
				if(Crafty.stage.fullscreen) {
					this.width = w;
					this.height = h;
					Crafty.stage.elem.style.width = w + "px";
					Crafty.stage.elem.style.height = h + "px";
					
					if(Crafty._canvas) {
						Crafty._canvas.width = w + "px";
						Crafty._canvas.height = h + "px";
					}
				}
				
				offset = Crafty.DOM.inner(Crafty.stage.elem);
				Crafty.stage.x = offset.x;
				Crafty.stage.y = offset.y;
			});
			
			//make the stage unselectable
			Crafty.settings.register("stageSelectable", function(v) {
				Crafty.stage.elem.onselectstart = v ? function() { return true; } : function() { return false; };
			});
			Crafty.settings.modify("stageSelectable", false);
			
			//make the stage have no context menu
			Crafty.settings.register("stageContextMenu", function(v) {
				Crafty.stage.elem.oncontextmenu = v ? function() { return true; } : function() { return false; };
			});
			Crafty.settings.modify("stageContextMenu", false);
			
			//add to the body and give it an ID if not exists
			if(!crstage) {
				document.body.appendChild(Crafty.stage.elem);
				Crafty.stage.elem.id = "cr-stage";
			}
			
			var elem = Crafty.stage.elem.style,
				offset;
			
			Crafty.stage.elem.appendChild(Crafty.stage.inner);
			Crafty.stage.inner.style.position = "absolute";
			Crafty.stage.inner.style.zIndex = "1";
			
			//css style
			elem.width = this.width + "px";
			elem.height = this.height + "px";
			elem.overflow = "hidden";
			
			if(Crafty.mobile) {
				elem.position = "absolute";
				elem.left = "0px";
				elem.top = "0px";
				
				var meta = document.createElement("meta"),
					head = document.getElementsByTagName("HEAD")[0];
				
				//stop mobile zooming and scrolling
				meta.setAttribute("name", "viewport");
				meta.setAttribute("content", "width=device-width, initial-scale=0.5, maximum-scale=0.5, user-scalable=no");
				head.appendChild(meta);
				
				//hide the address bar
				meta = document.createElement("meta");
				meta.setAttribute("name", "apple-mobile-web-app-capable");
				meta.setAttribute("content", "yes");
				head.appendChild(meta);
				setTimeout(function() { window.scrollTo(0,1); }, 0);
				
				Crafty.addEvent(this, window, "touchmove", function(e) {
					e.preventDefault();
				});
				
				Crafty.stage.x = 0;
				Crafty.stage.y = 0;
				
				//scale up
				elem[Crafty.support.prefix + "Transform"] = "scale3d(2, 2, 0) translate3d(200px, 110px, 0)";
			} else {
				elem.position = "relative";
				//find out the offset position of the stage
				
				offset = Crafty.DOM.inner(Crafty.stage.elem);
				Crafty.stage.x = offset.x;
				Crafty.stage.y = offset.y;
			}
		}
	},
	
	support: {},
	
	/**@
	* #Crafty.keys
	* @category Input
	* Object of key names and the corresponding key code.
	* ~~~
	* BACKSPACE: 8,
    * TAB: 9,
    * ENTER: 13,
    * PAUSE: 19,
    * CAPS: 20,
    * ESC: 27,
    * SPACE: 32,
    * PAGE_UP: 33,
    * PAGE_DOWN: 34,
    * END: 35,
    * HOME: 36,
    * LEFT_ARROW: 37,
    * UP_ARROW: 38,
    * RIGHT_ARROW: 39,
    * DOWN_ARROW: 40,
    * INSERT: 45,
    * DELETE: 46,
    * 0: 48,
    * 1: 49,
    * 2: 50,
    * 3: 51,
    * 4: 52,
    * 5: 53,
    * 6: 54,
    * 7: 55,
    * 8: 56,
    * 9: 57,
    * A: 65,
    * B: 66,
    * C: 67,
    * D: 68,
    * E: 69,
    * F: 70,
    * G: 71,
    * H: 72,
    * I: 73,
    * J: 74,
    * K: 75,
    * L: 76,
    * M: 77,
    * N: 78,
    * O: 79,
    * P: 80,
    * Q: 81,
    * R: 82,
    * S: 83,
    * T: 84,
    * U: 85,
    * V: 86,
    * W: 87,
    * X: 88,
    * Y: 89,
    * Z: 90,
    * NUMPAD_0: 96,
    * NUMPAD_1: 97,
    * NUMPAD_2: 98,
    * NUMPAD_3: 99,
    * NUMPAD_4: 100,
    * NUMPAD_5: 101,
    * NUMPAD_6: 102,
    * NUMPAD_7: 103,
    * NUMPAD_8: 104,
    * NUMPAD_9: 105,
    * MULTIPLY: 106,
    * ADD: 107,
    * SUBSTRACT: 109,
    * DECIMAL: 110,
    * DIVIDE: 111,
    * F1: 112,
    * F2: 113,
    * F3: 114,
    * F4: 115,
    * F5: 116,
    * F6: 117,
    * F7: 118,
    * F8: 119,
    * F9: 120,
    * F10: 121,
    * F11: 122,
    * F12: 123,
    * SHIFT: 16,
    * CTRL: 17,
    * ALT: 18,
    * PLUS: 187,
    * COMMA: 188,
    * MINUS: 189,
    * PERIOD: 190 
	* ~~~
	*/
	keys: {
		'BACKSPACE': 8,
        'TAB': 9,
        'ENTER': 13,
        'PAUSE': 19,
        'CAPS': 20,
        'ESC': 27,
        'SPACE': 32,
        'PAGE_UP': 33,
        'PAGE_DOWN': 34,
        'END': 35,
        'HOME': 36,
        'LEFT_ARROW': 37,
        'UP_ARROW': 38,
        'RIGHT_ARROW': 39,
        'DOWN_ARROW': 40,
        'INSERT': 45,
        'DELETE': 46,
        '0': 48,
        '1': 49,
        '2': 50,
        '3': 51,
        '4': 52,
        '5': 53,
        '6': 54,
        '7': 55,
        '8': 56,
        '9': 57,
        'A': 65,
        'B': 66,
        'C': 67,
        'D': 68,
        'E': 69,
        'F': 70,
        'G': 71,
        'H': 72,
        'I': 73,
        'J': 74,
        'K': 75,
        'L': 76,
        'M': 77,
        'N': 78,
        'O': 79,
        'P': 80,
        'Q': 81,
        'R': 82,
        'S': 83,
        'T': 84,
        'U': 85,
        'V': 86,
        'W': 87,
        'X': 88,
        'Y': 89,
        'Z': 90,
        'NUMPAD_0': 96,
        'NUMPAD_1': 97,
        'NUMPAD_2': 98,
        'NUMPAD_3': 99,
        'NUMPAD_4': 100,
        'NUMPAD_5': 101,
        'NUMPAD_6': 102,
        'NUMPAD_7': 103,
        'NUMPAD_8': 104,
        'NUMPAD_9': 105,
        'MULTIPLY': 106,
        'ADD': 107,
        'SUBSTRACT': 109,
        'DECIMAL': 110,
        'DIVIDE': 111,
        'F1': 112,
        'F2': 113,
        'F3': 114,
        'F4': 115,
        'F5': 116,
        'F6': 117,
        'F7': 118,
        'F8': 119,
        'F9': 120,
        'F10': 121,
        'F11': 122,
        'F12': 123,
        'SHIFT': 16,
        'CTRL': 17,
        'ALT': 18,
        'PLUS': 187,
        'COMMA': 188,
        'MINUS': 189,
        'PERIOD': 190 
	}
});

/**@
* #Crafty.support
* @category Misc, Core
* Determines feature support for what Crafty can do.
*/
(function testSupport() {
	var support = Crafty.support,
		ua = navigator.userAgent.toLowerCase(),
		match = /(webkit)[ \/]([\w.]+)/.exec(ua) || 
				/(o)pera(?:.*version)?[ \/]([\w.]+)/.exec(ua) || 
				/(ms)ie ([\w.]+)/.exec(ua) || 
				/(moz)illa(?:.*? rv:([\w.]+))?/.exec(ua) || [],
		mobile = /iPad|iPod|iPhone|Android|webOS/i.exec(ua),
		testDiv,
		testCanvas;
	
	if(mobile) Crafty.mobile = mobile[0];
	
	/**@
	* #Crafty.support.setter
	* @comp Crafty.support
	* Is `__defineSetter__` supported?
	*/
	support.setter = ('__defineSetter__' in this && '__defineGetter__' in this);
	
	/**@
	* #Crafty.support.defineProperty
	* @comp Crafty.support
	* Is `Object.defineProperty` supported?
	*/
	support.defineProperty = (function() {
		return ('defineProperty' in Object);
	})();
	
	/**@
	* #Crafty.support.audio
	* @comp Crafty.support
	* Is HTML5 `Audio` supported?
	*/
	support.audio = ('Audio' in window);
	
	/**@
	* #Crafty.support.prefix
	* @comp Crafty.support
	* Returns the browser specific prefix (`Moz`, `O`, `ms`, `webkit`).
	*/
	support.prefix = (match[1] || match[0]);
	
	//browser specific quirks
	if(support.prefix === "moz") support.prefix = "Moz";
	if(support.prefix === "o") support.prefix = "O";
	
	if(match[2]) {
		/**@
		* #Crafty.support.versionName
		* @comp Crafty.support
		* Version of the browser
		*/
		support.versionName = match[2];
		
		/**@
		* #Crafty.support.version
		* @comp Crafty.support
		* Version number of the browser as an Integer (first number)
		*/
		support.version = +(match[2].split("."))[0];
	}
	
	/**@
	* #Crafty.support.canvas
	* @comp Crafty.support
	* Is the `canvas` element supported?
	*/
	testCanvas = document.createElement("canvas")
	support.canvas = ('getContext' in testCanvas);
	
	testDiv = document.createElement("div");
	support.css3dtransform = (typeof testDiv.style[support.prefix + "Perspective"] !== "undefined");
	
	//clear the test elements
	testCanvas = testDiv = null;
})();