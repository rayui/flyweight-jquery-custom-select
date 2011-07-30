/*!
* jQuery Custom Select Manager function
* Copyright 2011, Ray Brooks
* Requires jQuery Core 1.4+ - http://www.jquery.com/
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

(function($){
	$.fn.flyweightCustomSelect = function(options) {
		var settings = $.extend({}, $.fn.flyweightCustomSelect.settings, options),
			menu = null;
		
		/*Produce modulo correctly */		
		var mod = function(n, m) {
			return ((m%n)+n)%n;
		};

		//dropdown menuDiv constructor
		var FlyweightMenu = function() {
			//variables to remember which element the last event was fired from
			var placeHolder = null
				selectEl = null,
				isOpen = false,
				menuDiv = null,
				initialSelectedIndex = -1,
				searchString = "",
				timer = null;

			// this utility function gets all the options out of the select element,
			// then gets their values and returns them in an array
			var mapOptionsToArray = function() {
				var text = $.map($('option', selectEl), function(el, index) {
					return $(el).text();
				});
				var values = $.map($('option', selectEl), function(el, index) {
					return $(el).attr("value");
				});
				
				return [text, values];
			};
			
			var buildMarkup = function() {
				//get data from select
				//build markup of control
				var list = mapOptionsToArray(),
					i = list[0].length - 1,
					customHTML = '</ul>';
				
				while (i >= 0) {
					customHTML = '<li class="' + settings.menu.classes.listitem.default + '"><a data-value="' + list[1][i] + '" href="#">' + list[0][i] + '</a></li>' + customHTML;
					i--;
				}
				
				menuDiv.innerHTML = '<ul class="' + settings.menu.classes.list.default + '">' + customHTML;
			};
			
			var positionPlaceHolder = function() {
				//get offset of placeholder for menu position
				//msie7 reports offset incorrectly - VML issue?
				var xy = $(placeHolder).offset();
				xy.top += $(placeHolder).height();
				
				menuDiv.style.left = xy.left + 'px';
				menuDiv.style.top = xy.top + 'px';
			};
			
			var fitScrollBar = function() {
				//make jQuery to get rendered width
				var $menuDiv = $(menuDiv),
					placeholderWidth = $(selectEl).width();
									
				if (placeholderWidth > $menuDiv.width()) {
					$menuDiv.find("ul").width(placeholderWidth);
					if($menuDiv.find("ul").flyweightCustomSelect.hasScrollBar()) {
						$menuDiv.find("li").width(placeholderWidth - 17); //arbitrarily set width of scrollbar - varies from OS to OS. i picked an approximate value
					} else {
						$menuDiv.find("li").width(placeholderWidth);
					}       
				}	
			};
			
			var fitMenuOnScreen = function() {
				//ensure menu is always visible
				var $menuDiv = $(menuDiv);
				if($menuDiv.offset().top + $menuDiv.height() > $(window).height()) {
					var scrollEl = $.browser.webkit ? window.document.body : "html"; 
					$(scrollEl).animate({scrollTop: parseInt(menuDiv.style.top, 10) - 100}, 1000);
				}	
			};

			//update selecEl value to new index			
			var setSelectToIndex = function(index) {
				selectEl.value = selectEl.options[index].value;
				selectEl.options[index].selected = true;
			};

			//update menu to show new select info
			var setMenuToIndex = function(index) {
				var $menuDiv = $(menuDiv),
					$selectedLi;
					
				//first ensure select is kept in sync
				//necessary for data integrity
				setSelectToIndex(index);
				
				//scroll to selected LI in list
				$selectedLi = $menuDiv.find("li:eq(" + index + ")");
					
				$menuDiv.find("ul").scrollTop(0);
				$menuDiv.find("li").removeClass(settings.menu.classes.listitem.focus);
				if ($selectedLi.length > 0) {
					$selectedLi.addClass(settings.menu.classes.listitem.focus);
					$menuDiv.find("ul").scrollTop($selectedLi.position().top);
				}
				
				//update value of anchor
				$(placeHolder).find("span." + settings.placeholder.classes.text.default).text($selectedLi.text());

			};
			
			var getOptFromSelect = function(value) {
				return $(selectEl).find("option[value='" + value + "']");
			};
			
			var typeAhead = function() {
				var typeAheadString = searchString.replace(/[\W]/ig,"").toUpperCase(),
					list = mapOptionsToArray(),
					found = false;
					
				for (var i = 0; i < list[0].length; i++) {
					if (list[0][i].replace(/[\W]/ig,"").substring(0, typeAheadString.length).toString().toUpperCase() === typeAheadString) {
						setMenuToIndex(i);
						i = list[0].length;
						found = true;
					}
				}
				
				window.clearTimeout(timer);
				timer = window.setTimeout(function() {searchString = "";}, 1000);

			};
			
			var onClick = function(e) {
				var selectedAnchor = e.target,
					value,
					index;
					
				e.preventDefault();
				e.stopPropagation();
				
				
				//we only set target for keyboard nav as events will be triggered on wrapper div, not anchor (as is when clicked)
				//we need to check this because the person could theoretically click on the div which the elements are bound to, as opposed to the anchor 
				if (selectedAnchor.nodeName.toLowerCase() !== "a") {
					return false;
				}				
				
				//get index of selected item in list and update the controls
				value = $(selectedAnchor).attr("data-value");
				index  = $(selectEl).find("option[value='" + value + "']").index();
				
				setMenuToIndex(index);
				
				//kick off the change event bound to the actual select
				menu.close();
			};
			
			//selects the item by offset from currently selected item in original select element
			var scrollBy = function(offset) {
				/* step to next while option's value is not empty and is not an optgroup or label
				* 
				* set index
				* set list to selected index
				*/
				
				var index = mod(selectEl.childNodes.length, parseInt(selectEl.selectedIndex + offset, 10));
				
				while (selectEl[index].getAttribute("value").length === 0) {
					index = mod(selectEl.childNodes.length, parseInt(index + offset, 10));
				}
				
				setMenuToIndex(index);
			};
			
			var init = function() {
				var $menuDiv;
				
				menuDiv = window.document.createElement('div');
				menuDiv.className = settings.menu.classes.container.default;
				
				$('body').append(menuDiv);
				
				$menuDiv = $(menuDiv);
				$menuDiv.bind('click', onClick);
			};
			
			//intialise menu object
			init();
			
			return {
				open: function(triggeredPlaceHolder, triggeredSelectEl) {
					var $menuDiv;
					
					//set closure wide variable to remember which object triggered open
					placeHolder = triggeredPlaceHolder;
					selectEl = triggeredSelectEl;
					
					buildMarkup();
					positionPlaceHolder();
					fitScrollBar();
					fitMenuOnScreen();
					setMenuToIndex(selectEl.selectedIndex);
					
					$(menuDiv).addClass(settings.menu.classes.container.open);
					$(placeHolder).addClass(settings.placeholder.classes.container.open);
					
					//set flags
					initialSelectedIndex = selectEl.selectedIndex; 
					isOpen = true;
					searchString = "";
					window.clearTimeout(timer);

				},
				close: function() {
					$(menuDiv).removeClass(settings.menu.classes.container.open);
					$(placeHolder).removeClass(settings.placeholder.classes.container.open);
					//$placeHolder.removeClass(settings.placeholder.classes.container.hover);
					
					//set flag
					isOpen = false;
				},
				reset: function() {
					setMenuToIndex(initialSelectedIndex);
					this.close();
				},
				visible: function() {
					return isOpen;	
				},
				enabled: function() {
					//stub
					return true;	
				},
				scrollDown: function() {
					scrollBy(1);	
				},
				scrollUp: function() {
					scrollBy(-1);	
				},
				search: function() {
					typeAhead();
				},
				getSelect: function() {
					return selectEl;
				}
			};
		};
		
		var PlaceHolder = function(selectEl) {
			var text = "";
			var $placeHolder;
			var isEnabled = true;
			
			//click behaviour
			var onClick = function(e) {
				e.stopPropagation();
				e.preventDefault();

				// toggle the custom select menu if enabled
				if (isEnabled) {
					if (!menu.visible()) {
						menu.open(this, selectEl);
					} else {
						menu.close();
						if (menu.getSelect() !== selectEl) {
							menu.open(this, selectEl);
						}
					}       
				}
			};
			
			//keydown behaviour
			var onKeydown = function(e) {
				if (e.which === settings.keymap.left || e.keyCode === settings.keymap.right || e.keyCode === settings.keymap.up || e.keyCode === settings.keymap.down || e.keyCode === settings.keymap.enter) {
					e.stopPropagation();
					e.preventDefault();
				}
				
				/* switch(true) to enable use of expanded conditional statements */
				switch (true) {
					case (e.which === settings.keymap.left):
					case (e.which === settings.keymap.up):
						if (menu.visible()) {
							menu.scrollUp();
						} else {
							$(this).trigger("click");
						}
						return false;
					case (e.which === settings.keymap.right):
					case (e.which === settings.keymap.down):
						if (menu.visible()) {
							menu.scrollDown();
						} else {
							$(this).trigger("click");
						}
						return false;
					case (e.which === settings.keymap.enter):
					case (e.which === settings.keymap.tab):
					case (e.which === settings.keymap.space):
						//trigger click on nav
						if (menu.visible()) {
							menu.close();
						} else {
							if (e.which === settings.keymap.enter || e.which === settings.keymap.space) {
								$(this).trigger("click");
								return false;
							} else {
								menu.close();
							}
						}
						break;
					case (e.which === settings.keymap.escape):
						//close dropdown
						menu.reset();
						return false;
					case (e.which >= 48 && e.which <= 59):
					case (e.which >= 65 && e.which <= 90):
					case (e.which >= 97 && e.which <= 122):
						//open menu if not already
						if (!menu.visible()) {
							$(this).trigger("click");
						}
						//first, add character to search string
						searchString += String.fromCharCode(e.which);
				
						//pass string to typeahead function
						menu.search();
				}
			};
			
			var onFocus = function(e) {
				$(this).addClass(settings.placeholder.classes.container.focus);
			};
			
			var onBlur = function(e) {
				$(this).removeClass(settings.placeholder.classes.container.focus);
			};
			
			var onMouseOver = function(e) {
				$(this).addClass(settings.placeholder.classes.container.hover);
			};
			
			var onMouseOut = function(e) {
				$(this).removeClass(settings.placeholder.classes.container.hover);
			};
			
			var enable = function() {
				$placeHolder.click(onClick);
				$placeHolder.keydown(onKeydown);
				$placeHolder.focus(onFocus);
				$placeHolder.blur(onBlur);
				$placeHolder.hover(onMouseOver, onMouseOut);
			};
			
			var disable = function() {
				$placeHolder.unbind("click");
				$placeHolder.unbind("keydown");
				$placeHolder.unbind("focus");
				$placeHolder.unbind("blur");
				$placeHolder.unbind("mouseover");
				$placeHolder.unbind("mouseout");
			};
			
			var init = function() {
				//set initial text of placeholder
				if (selectEl.selectedIndex >= 0) {
					text = selectEl.options[selectEl.selectedIndex].text;
				} else {
					text = selectEl.options[0].text;
				}
				
				$placeHolder = $('<a href="#" aria-owns="' + selectEl.id + '" class="' + settings.placeholder.classes.container.default + '" role="button" href="#" tabindex="0" aria-haspopup="true" id="' + selectEl.id + '-button"><span class="' + settings.placeholder.classes.text.default + '">' + text + '</span><span class="' + settings.placeholder.classes.arrow.default + '"></span></a>');
				
				enable();
				
				$(selectEl).after($placeHolder);
				$(selectEl).hide();
			};
			
			init();
			
			return $placeHolder[0];
			
		};
		
		//instantiate single drop down menuDiv on run
		if (menu === null) {
			menu = new FlyweightMenu();
		}
				
		return this.each(function() {
			return new PlaceHolder(this);
		});
	};
	$.fn.flyweightCustomSelect.settings = {
		menu:{
			classes:{
				container:{
					default:"jquery-flyweight-selectmenu",
					open:"jquery-flyweight-selectmenu-open"
				},
				list:{
					default:"jquery-flyweight-selectmenu-list"
				},
				listitem:{
					default:"jquery-flyweight-selectmenu-listitem",
					focus:"jquery-flyweight-selectmenu-listitem-focus"
				}
			}
		},
		placeholder:{
			classes:{
				container:{
					default:"jquery-flyweight-select",
					open:"jquery-flyweight-select-open",
					hover:"jquery-flyweight-select-hover",
					focus:"jquery-flyweight-select-focus",
					disabled:"jquery-flyweight-select-disabled"
				},
				text:{
					default:"jquery-flyweight-select-text"
				},
				arrow:{
					default:"jquery-flyweight-select-arrow"
				}
			}			
		},
		keymap:{
			left:$.ui.keyCode.LEFT,
			right:$.ui.keyCode.RIGHT,
			up:$.ui.keyCode.UP,
			down:$.ui.keyCode.DOWN,
			enter:$.ui.keyCode.ENTER,
			space:$.ui.keyCode.SPACE,
			tab:$.ui.keyCode.TAB,
			escape:$.ui.keyCode.ESCAPE
		}
	};
	$.fn.flyweightCustomSelect.hasScrollBar = function() {
	    //note: clientHeight= height of holder
	    //scrollHeight= we have content till this height
	    var _elm = this;
	    var _hasScrollBar = false;
	    if ((_elm.clientHeight < _elm.scrollHeight) || (_elm.clientWidth < _elm.scrollWidth)) {
		_hasScrollBar = true;
	    }
	    return _hasScrollBar;
	}
})(jQuery);
