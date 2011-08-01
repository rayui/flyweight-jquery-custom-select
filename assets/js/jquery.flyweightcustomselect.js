/*!
* jQuery Custom Select Manager function
* Copyright 2011, Ray Brooks
* Requires jQuery Core 1.4+ - http://www.jquery.com/
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

(function($){
	$.fn.flyweightCustomSelect = function(options) {
		var settings = $.extend({}, $.fn.flyweightCustomSelect.settings, options),
		menu = $.fn.flyweightCustomSelect.menu || null;
		
		/*Produce modulo correctly */		
		var mod = function(n, m) {
			return ((m%n)+n)%n;
		};

		//dropdown menuDiv constructor
		var FlyweightMenu = function() {
			//variables to remember which element the last event was fired from
			var placeHolder = null,
				selectEl = null,
				isOpen = false,
				menuDiv = null,
				initialSelectedIndex = -1,
				searchString = "",
				lookupHash = [],
				timer = null;

			// this utility function gets a hash of text and value of each filtered element out of the select,
			// then gets their values and returns them in an array
			var mapOptionsToHash = function() {
				lookupHash = $.map($(settings.optionfilter, selectEl), function(el, index) {
					var $el = $(el);
					return {type:el.nodeName, index:$el.attr("index"), text:$el.attr("text"), value:$el.attr("value"), group:$el.attr("label")};
				});
			};
			
			//builds markup for li and anchor of list item
			var buildItem = function(value, text) {
				return '<li><a  class="' + settings.classes.menu.listitem.base + '"data-value="' + value + '" href="#">' + text + '</a></li>';
			};
			
			//builds placeholder markup
			var buildPlaceholder = function() {
				//get data from select
				//build markup of control
				var i = 0,
					customHTML = '<ul class="' + settings.classes.menu.list.base + '">';
					
				while (i < lookupHash.length) {
					if (lookupHash[i].type === "OPTGROUP") {
						customHTML += '<li class="' + settings.classes.menu.group.base + '"><span>' + lookupHash[i].group + '</span><ul>';
						i+=1;
						while (i < lookupHash.length && lookupHash[i].type !== "OPTGROUP") {
							customHTML += buildItem(lookupHash[i].value, lookupHash[i].text);
							i+=1;
						}
						customHTML += '</ul></li>';
					} else {
						customHTML += buildItem(lookupHash[i].value, lookupHash[i].text);
						i+=1;
					}
				}
				
				$(menuDiv).html(customHTML + '</ul>');
				
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
			var setSelectToIndex = function(lookupIndex) {
				selectEl.value = lookupHash[lookupIndex].value;
				selectEl.selectedIndex = lookupHash[lookupIndex].index;
				
				//trigger any change events bound to select element
				$(selectEl).trigger("change");
			};

			//update menu to show new select info
			var setMenuToIndex = function(lookupIndex) {
				var $menuDiv = $(menuDiv),
					$selectedAnchor;
					
				//first ensure select is kept in sync
				//necessary for data integrity
				setSelectToIndex(lookupIndex);
				
				//scroll to selected LI in list
				$selectedAnchor = $menuDiv.find('a[data-value="' + lookupHash[lookupIndex].value + '"]');
					
				$menuDiv.find("ul").scrollTop(0);
				$menuDiv.find("a").removeClass(settings.classes.menu.listitem.focus);
				if ($selectedAnchor.length > 0) {
					$selectedAnchor.addClass(settings.classes.menu.listitem.focus);
					$menuDiv.find("ul").scrollTop($selectedAnchor.position().top);
				}
				
				//update value of anchor
				$(placeHolder).find("span." + settings.classes.placeholder.text.base).text($selectedAnchor.text());
			};
			
			//update menu to to match psecific attribute in lookupHash 
			var setMenuByAttr = function(attr, data) {
				var i = lookupHash.length - 1;
				
				while(i > 0 && lookupHash[i][attr] !== data) {
					i-=1;
				}
				
				setMenuToIndex(i);
			};
			
			//typeahead functionality
			var typeAhead = function() {
				var typeAheadString = searchString.replace(/[\W]/ig,"").toUpperCase(),

				for (i = 0; i < lookupHash.length; i+=1) {
					if(lookupHash[i].text) {
						if (lookupHash[i].text.replace(/[\W]/ig,"").substring(0, typeAheadString.length).toString().toUpperCase() === typeAheadString) {
							setMenuByAttr("value", lookupHash[i].value);
							i = lookupHash.length;
							found = true;
						}
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
				
				setMenuByAttr("value", $(selectedAnchor).attr("data-value"));
				menu.close();
			};
			
			//selects the item by offset from currently selected item in original select element
			var scrollBy = function(offset) {
				/* step to next while option's value is not empty and is not an optgroup or label
				* 
				* set index
				* set list to selected index
				*/
				
				var lookupIndex = lookupHash.length;
					
				while (lookupIndex--) {                                     
					if (lookupHash[lookupIndex].index === selectEl.selectedIndex + offset) {
						setMenuToIndex(lookupIndex);	
						lookupIndex = 0;
					}
				}			
				
			};
			
			var init = function() {
				var $menuDiv;
				
				menuDiv = window.document.createElement('div');
				menuDiv.className = settings.classes.menu.container.base;
				
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
					initialSelectedIndex = selectEl.selectedIndex; 
					
					//cache the values & text for performance
					mapOptionsToHash();
					buildPlaceholder();
					positionPlaceHolder();
					fitScrollBar();
					fitMenuOnScreen();
					setMenuByAttr("index", initialSelectedIndex);
					
					$(menuDiv).addClass(settings.classes.menu.container.open);
					$(placeHolder).addClass(settings.classes.placeholder.container.open);
					
					//set flags
					isOpen = true;
					searchString = "";
					window.clearTimeout(timer);

				},
				close: function() {
					$(menuDiv).removeClass(settings.classes.menu.container.open);
					$(placeHolder).removeClass(settings.classes.placeholder.container.open);
					
					//set flag
					isOpen = false;
				},
				reset: function() {
					setMenuByAttr("index", initialSelectedIndex);
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
				search: function(charCode) {
					searchString += charCode;
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
						//if it's a different target select, open the menu (or we must click twice, boring)
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
						//pass string to typeahead function
						menu.search(String.fromCharCode(e.which));
						break;
				}
			};
			
			var onFocus = function(e) {
				$(this).addClass(settings.classes.placeholder.container.focus);
			};
			
			var onBlur = function(e) {
				$(this).removeClass(settings.classes.placeholder.container.focus);
			};
			
			var onMouseOver = function(e) {
				$(this).addClass(settings.classes.placeholder.container.hover);
			};
			
			var onMouseOut = function(e) {
				$(this).removeClass(settings.classes.placeholder.container.hover);
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
				
				$placeHolder = $('<a href="#" aria-owns="' + selectEl.id + '" class="' + settings.classes.placeholder.container.base + '" role="button" href="#" tabindex="0" aria-haspopup="true" id="' + selectEl.id + '-button"><span class="' + settings.classes.placeholder.text.base + '">' + text + '</span><span class="' + settings.classes.placeholder.arrow.base + '"></span></a>');
				
				enable();
				
				$(selectEl).after($placeHolder);
				$(selectEl).hide();
			};
			
			init();
			
			return $placeHolder[0];
			
		};
		
		//instantiate single drop down menuDiv on first run
		//store instance on prototype. menu is local var for better compression & performance!
		if (menu === null) {
			$.fn.flyweightCustomSelect.menu = new FlyweightMenu();
			menu = $.fn.flyweightCustomSelect.menu;
			
			//close existing instance, looks cleaner
			//do this here as opposed to on each new PlaceHolder as interferes with user if used on dynamic load
			menu.close();
		}
				
		return this.each(function() {
			return new PlaceHolder(this);
		});
	};
	
	/*!
	 * hasScrollBar function
	 * Adapted from code
	 * Copyright 2011, Pravee Prasad
	 * See http://stackoverflow.com/users/183200/praveen-prasad http://stackoverflow.com/questions/2059743/detect-elements-overflow-using-jquery/2060003#2060003 
	 */
	
	$.fn.flyweightCustomSelect.hasScrollBar = function() {
	    //note: clientHeight= height of holder
	    //scrollHeight= we have content till this height
	    var elm = this;
	    var hasScrollBar = false;
	    if ((elm.clientHeight < elm.scrollHeight) || (elm.clientWidth < elm.scrollWidth)) {
		hasScrollBar = true;
	    }
	    return hasScrollBar;
	};
	
	$.fn.flyweightCustomSelect.settings = {
		classes:{
			placeholder:{
				container:{
					base:"jquery-flyweight-select",
					open:"jquery-flyweight-select-open",
					hover:"jquery-flyweight-select-hover",
					focus:"jquery-flyweight-select-focus",
					disabled:"jquery-flyweight-select-disabled"
				},
				text:{
					base:"jquery-flyweight-select-text"
				},
				arrow:{
					base:"jquery-flyweight-select-arrow"
				}
			},
			menu:{
				container:{
					base:"jquery-flyweight-selectmenu",
					open:"jquery-flyweight-selectmenu-open"
				},
				list:{
					base:"jquery-flyweight-selectmenu-list"
				},
				listitem:{
					base:"jquery-flyweight-selectmenu-listitem",
					focus:"jquery-flyweight-selectmenu-listitem-focus",
					hover:"jquery-flyweight-selectmenu-listitem-hover"
				},
				group:{
					base:"jquery-flyweight-selectmenu-group"
				}
			}			
		},
		optionfilter:'option[value!=""],optgroup',
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
=======
}(jQuery));
