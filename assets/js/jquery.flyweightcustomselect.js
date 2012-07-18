/*!
* jQuery Custom Select Manager function
* Copyright 2011, Ray Brooks
* Requires jQuery Core 1.4+ - http://www.jquery.com/
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

(function($){
	var clickEvent = ('ontouchstart' in document.documentElement) ? 'touchend' : 'click';
	
	$.fn.flyweightCustomSelect = function(method) {
		var settings = {},
			menu = $.fn.flyweightCustomSelect.menu || null;

		//dropdown menuDiv constructor
		var FlyweightMenu = function() {
			//variables to remember which element the last event was fired from
			var selectEl = null,
				isOpen = false,
				menuDiv = null,
				placeHolder = null,
				initialSelectedIndex = 0,
				lookupHash = [];

			// this utility function gets a hash of text and value of each filtered element out of the select,
			// then gets their values and returns them in an array
			var mapOptionsToHash = function() {
				//get all filtered elements and cache them
				lookupHash = $.map($(settings.optionfilter, selectEl), function(el, index) {
					var $el = $(el),
						selectIndex = $el[0].index;
					
					//hack because IE returns index 0 for optgroup when it should be undefined
					if ($.browser.msie && el.nodeName.toUpperCase() === "OPTGROUP") {
						selectIndex = null;
					}
					
					return {
						type:el.nodeName.toUpperCase(), 
						selectIndex:selectIndex, 
						text: settings.htmlGenerator ? settings.itemHtmlGenerator.apply($el): $el.text(), 
						value:$el.attr("value"), 
						group:$el.attr("label")
					};
				});
			};
			
			//builds menu markup
			var buildMenu = function() {
				//get data from select
				//build markup of control
				var i = 0,
					customHTML = '<ul class="' + settings.classes.menu.list.base + '">';
					
				//builds markup for li and anchor of list item
				var buildItem = function(dataIndex, text) {
					return '<li><a  class="' + settings.classes.menu.listitem.base + '"data-index="' + dataIndex + '" href="#">' + text + '</a></li>';
				};
					
				while (i < lookupHash.length) {
					if (lookupHash[i].type === "OPTGROUP") {
						customHTML += '<li class="' + settings.classes.menu.group.base + '"><span>' + lookupHash[i].group + '</span><ul>';
						i+=1;
						while (i < lookupHash.length && lookupHash[i].type !== "OPTGROUP") {
							customHTML += buildItem(lookupHash[i].selectIndex, lookupHash[i].text);
							i+=1;
						}
						customHTML += '</ul></li>';
					} else {
						customHTML += buildItem(lookupHash[i].selectIndex, lookupHash[i].text);
						i+=1;
					}
				}
				
				menuDiv.html(customHTML + '</ul>');
				
			};
			
			var sizeMenu = function() {
				var width = placeHolder.width();
				menuDiv.width(width);
			};
			
			var positionMenu = function() {
				//position menu
				
				var menuHeight = menuDiv.outerHeight(),
					placeHolderTop = placeHolder.offset().top,
					placeHolderHeight = placeHolder.height(),
					windowHeight = window.innerHeight ? window.innerHeight : $(window).height(), //document.documentElement.clientHeight,
					menuTop = 0,
					isDropDown = true;
					
				if (placeHolderTop + placeHolderHeight + menuHeight < windowHeight) {
					//drop down
					menuTop = placeHolderTop + placeHolderHeight;
				} else if (placeHolderTop - menuHeight > $(window).scrollTop()) {
					//drop up
					menuTop = placeHolderTop - menuHeight;
					isDropDown = false;
				} else {
					var newMenuHeight;
					//drop down with scroll
					menuTop = placeHolderTop + placeHolderHeight;
					newMenuHeight = Math.min(menuHeight, windowHeight - (menuTop - $(window).scrollTop()));
						
					menuDiv.find('ul.' + settings.classes.menu.list.base).height(newMenuHeight);
					
					if (clickEvent === 'touchend') {
						addTouchScrollIndicator(menuHeight, newMenuHeight);
					}
				}
				
				menuDiv.css({
					left: placeHolder.offset().left + 'px',
					top: menuTop + 'px'
				});
				
				return isDropDown;
				
			};
			
			//add a scroll indicator for touch devices
			var addTouchScrollIndicator = function(originalMenuHeight, newMenuHeight) {
				var touchScrollIndicator = $('<span class="' + settings.classes.menu.scroll.base + '"></span>');
					
				touchScrollIndicator.height(parseInt(Math.pow(newMenuHeight, 2) / originalMenuHeight, 10) - 10);
				menuDiv.append(touchScrollIndicator);
			};
			
			//update selecEl value to new index			
			var setSelectToIndex = function(lookupIndex) {
			  if (selectEl.value !== lookupHash[lookupIndex].value) {
          selectEl.value = lookupHash[lookupIndex].value;
          selectEl.selectedIndex = lookupHash[lookupIndex].selectIndex;
          
          //trigger any change events bound to select element
          //this will include the one this plugin creates to update the value of the placeholder
          $(selectEl).trigger("change");
        }
			};

			//update menu to show new select info
			var setMenuToIndex = function(lookupIndex) {
				var $selectedAnchor;
				
				//first ensure select is kept in sync
				//necessary for data integrity
				setSelectToIndex(lookupIndex);
				
				//scroll to selected LI in list
				$selectedAnchor = menuDiv.find('a[data-index="' + lookupHash[lookupIndex].selectIndex + '"]');
				
				menuDiv.find("ul").scrollTop(0);
				menuDiv.find("a").removeClass(settings.classes.menu.listitem.focus);
				if ($selectedAnchor.length > 0) {
					$selectedAnchor.addClass(settings.classes.menu.listitem.focus);
					menuDiv.find("ul").scrollTop($selectedAnchor.position().top);
				}
			};
			
			//get index of attribute 
			var getLookupIndexByAttr = function(attr, data) {
				var i = lookupHash.length - 1;
				
				while(i > 0 && lookupHash[i][attr] !== data) {
					i-=1;
				}
				
				return i;
			};

			//search for next element from specified start position in select
			var find = function(search, i) {
				while (i < selectEl.options.length) {
					if (selectEl[i].text.toUpperCase().charCodeAt(0) === search) {
						setMenuToIndex(getLookupIndexByAttr("selectIndex", i));
						return true;
					}
					i+=1;
				}
				return false;
			};
			
			//typeahead functionality
			var typeAhead = function(search) {
				//normalise search character
				search = search.toUpperCase().charCodeAt(0);
				
				//if we don't find it after our current position, we search from the top
				return find(search, selectEl.selectedIndex + 1) || find(search, 0);
				
			};
			
			var onClick = function(e) {
				e.stopPropagation();
				
				var selectedAnchor = e.target,
					value,
					index;
				
				//we only set target for keyboard nav as events will be triggered on wrapper div, not anchor (as is when clicked)
				//we need to check this because the person could theoretically click on the div which the elements are bound to, as opposed to the anchor 
				if (selectedAnchor.nodeName.toUpperCase() !== "A") {
					return false;
				}
				
				if (!menu.touchMoved) {
					setSelectToIndex(getLookupIndexByAttr("selectIndex", parseInt(selectedAnchor.getAttribute("data-index"), 10)));
					menu.close();
					//return focus to placeholder
					placeHolder.focus();
				}
				
				return false;
			};
			
			var onTouchStart = function(e) {
				e.stopPropagation();
				placeHolder.addClass(settings.classes.placeholder.container.focus);
				menu.touchMoved = false;
				menu.lastTouch = e.originalEvent.touches[0].pageY;
				return false;
			};
			
			var onTouchMove = function(e) {
				menu.touchMoved = true;

				var menuList = menuDiv.find('ul.' + settings.classes.menu.list.base),
					menuScrollIndicator = menuDiv.find('span.' + settings.classes.menu.scroll.base),
					menuScrollTop = menuList.attr('scrollTop') + menu.lastTouch - e.originalEvent.touches[0].pageY,
					menuScrollIndicatorTop = 5 + menuScrollTop * menuScrollIndicator.height() / menuList.height();
					
				menuScrollIndicatorTop = Math.max(5, menuScrollIndicatorTop);
				menuScrollIndicatorTop = Math.min(menuList.height() - menuScrollIndicator.height() - 10, menuScrollIndicatorTop);
					
				menuList.scrollTop(menuScrollTop);
				menuScrollIndicator.css('top', menuScrollIndicatorTop);
				menu.lastTouch = e.originalEvent.touches[0].pageY;
			};
			
			//selects the item by offset from currently selected item in original select element
			var scrollBy = function(offset) {
				// step to next while option's value is not empty and is not an optgroup or label
				var lookupIndex = lookupHash.length;

				while (lookupIndex) {
					lookupIndex -= 1;
					if (lookupHash[lookupIndex].selectIndex === selectEl.selectedIndex + offset) {
						//set index
						setMenuToIndex(lookupIndex);
						lookupIndex = 0;
					}
				}
			};
			
			//initialise on first run
			return function() {
			
				menuDiv = $('<div class="' + settings.classes.menu.container.base + '" />');
				menuDiv.bind(clickEvent, onClick);
				menuDiv.bind('touchstart', onTouchStart);
				menuDiv.bind('touchmove', onTouchMove);
				
				$('body').append(menuDiv);
				
				return {
					bondToSelect: function(triggeredPlaceHolder, triggeredSelectEl) {
						//set closure wide variable to remember which object triggered open
						placeHolder = triggeredPlaceHolder;
						selectEl = triggeredSelectEl;
					},
					open: function() {					
						if (!isOpen) {
							//cache the values & text for performance
							mapOptionsToHash();
							buildMenu();
							sizeMenu();
							
							//positionMenu returns true if it is drop down, false if it is dropping up
							if (positionMenu()) {
								menuDiv.addClass(settings.classes.menu.container.dropdown);
								placeHolder.addClass(settings.classes.placeholder.container.dropdown);
							} else {
								menuDiv.addClass(settings.classes.menu.container.dropup);
								placeHolder.addClass(settings.classes.placeholder.container.dropup);
							}
							
							menuDiv.addClass(settings.classes.menu.container.open);
							placeHolder
								.addClass(settings.classes.placeholder.container.open)
								.focus();
							
							//now set intial state of menu
							initialSelectedIndex = getLookupIndexByAttr("selectIndex", selectEl.selectedIndex);
							setMenuToIndex(initialSelectedIndex);
							
							//set flags
							return (isOpen = true);
						}
						return false;
					},
					close: function() {
						menuDiv.removeClass(settings.classes.menu.container.open + ' ' + settings.classes.menu.container.dropdown + ' ' + settings.classes.menu.container.dropup);

						if (placeHolder) {
							placeHolder.removeClass(settings.classes.placeholder.container.open + ' ' + settings.classes.placeholder.container.dropdown + ' ' + settings.classes.placeholder.container.dropup);
							if (clickEvent === 'touchend') {
								placeHolder[0].className = settings.classes.placeholder.container.base;
							}
						}
						
						//set flag
						isOpen = false;
					},
					destroy:function() {
						menuDiv.unbind();
						menuDiv.remove();
					},
					reset: function() {
						setMenuToIndex(initialSelectedIndex);
						this.close();
					},
					isOpen: function() {
						return isOpen;
					},
					scrollDown: function() {
						this.open() || scrollBy(1);	
					},
					scrollUp: function() {
						this.open() || scrollBy(-1);
					},
					pageDown: function() {
						this.open() || scrollBy(10);	
					},
					pageUp: function() {
						this.open() || scrollBy(-10);	
					},
					search: function(character) {
						this.open();
						typeAhead(character);
					},
					getSelect: function() {
						return selectEl;
					},
					getCurrentPlaceHolder: function() {
						return placeHolder;
					},
					touchMoved: false,
					lastTouch: 0,
					reposition: positionMenu
				};
			}();
		};
		
		var PlaceHolder = function(selectEl) {
			var placeHolder;

			var onClick = (function(e) {
				var clickCommon = function(e) {
					e.stopPropagation();
					e.preventDefault();
          menu.bondToSelect(placeHolder, selectEl);
          return (menu.open() || menu.close());
				};
				if (clickEvent !== 'touchend') {
					return function(e) {
						// toggle the custom select menu if enabled
						clickCommon(e);
					};
				} else {
					return function(e) {
						var currentPlaceHolder = menu.getCurrentPlaceHolder();
						if (currentPlaceHolder) {
							currentPlaceHolder[0].className = settings.classes.placeholder.container.base;
						}
						clickCommon(e);
					};
				}
			})();
			
			var onTouchStart = function(e) {
				e.stopPropagation();
				return false;
			};
			
			//keydown behaviour
			var onKeyDown = function(e) {
				e.stopPropagation();
				var keyCode = e.keyCode;
				
				if (keyCode === settings.keymap.left || keyCode === settings.keymap.right || keyCode === settings.keymap.up || keyCode === settings.keymap.down || keyCode === settings.keymap.enter || keyCode === settings.keymap.space) {
					e.preventDefault();
				}
				
				//switch(true) to enable use of expanded conditional statements
				//crockford doesn't like this but what the hell
				switch (true) {
					case (keyCode === settings.keymap.left):
					case (keyCode === settings.keymap.up):
						menu.scrollUp();
						break;
					case (keyCode === settings.keymap.right):
					case (keyCode === settings.keymap.down):
						menu.scrollDown();
						break;
					case (keyCode === settings.keymap.pgup):
						menu.pageUp();
						break;
					case (keyCode === settings.keymap.pgdn):
						menu.pageDown();
						break;
					case (keyCode === settings.keymap.enter):
					case (keyCode === settings.keymap.space):
						$(this).trigger(clickEvent);
						break;
					case (keyCode === settings.keymap.tab):
						menu.close();
						break;
					case (keyCode === settings.keymap.escape):
						menu.reset();
						break;
					case (keyCode >= 48 && keyCode <= 59):
					case (keyCode >= 65 && keyCode <= 90):
					case (keyCode >= 97 && keyCode <= 122):
						menu.search(String.fromCharCode(keyCode));
						break;
				}
			};
			
			var onFocus = function(e) {
				e.stopPropagation();
				menu.bondToSelect(placeHolder, selectEl);
				placeHolder.addClass(settings.classes.placeholder.container.focus);
			};
			
			var onBlur = function(e) {
				e.stopPropagation();
				placeHolder[0].className = settings.classes.placeholder.container.base;
			};
			
			var onSelectChange = function(e) {
			  if (e.target.selectedOptions && placeHolder) {
			    placeHolder.find("span." + settings.classes.placeholder.text.base).html(e.target.selectedOptions[0].text);
			  }
			};
			
			var enable = (function() {
				var _enable = function() {
					$(selectEl).removeAttr("disabled");
									
					if ($(selectEl).attr('tabindex') && settings.tabindex) {
						placeHolder.attr('tabindex', $(selectEl).attr('tabindex'));
					} else {
						placeHolder.attr('tabindex', 0);
					}
					
					placeHolder.removeClass(settings.classes.placeholder.container.disabled);
					placeHolder.bind(clickEvent, onClick);
				};
				if (clickEvent !== 'touchend') {
					return function() {
						_enable();
						placeHolder.unbind('focus').bind('focus', onFocus);
						placeHolder.unbind('blur').bind('blur', onBlur);
						placeHolder.keydown(onKeyDown);
					};
				} else {
					return function() {
						_enable();
						placeHolder.unbind('touchstart').bind('touchstart', onTouchStart);
					};
				}
			})();
			
			var disable = (function() {
				var _disable = function() {
					$(selectEl).attr("disabled", "disabled");
					
					//remove tabindex according to settings
					!settings.tabindex || placeHolder.removeAttr("tabindex");
					
					placeHolder.addClass(settings.classes.placeholder.container.disabled);
					//prevent default click
					placeHolder.unbind(clickEvent).bind(clickEvent, function() {return false;});
				};
				if (clickEvent !== 'touchend') {
					return function() {
						_disable();
						placeHolder.unbind('focus').bind('focus', function() {this.blur();return false;});
						placeHolder.unbind('blur');
						placeHolder.unbind('keydown');
					};
				} else {
					return function() {
						_disable();
						placeHolder.unbind('touchstart');
					};
				}
			})();
			
			//generate placeholder and enable
			return function() {
				placeHolder = buildPlaceHolder(selectEl);
				enable();
				
				//inesrt and hide bound control
				$(selectEl).after(placeHolder);
				$(selectEl).hide();
				
				//bind change event of select to update placeholder when select is updated
				//if this is unbound then the placeholder will stop representing the value of the select
				$(selectEl).bind('change', onSelectChange);
				
				return {
					enable:function() {
						enable();
					},
					disable:function() {
						disable();
					},
					destroy:function() {
						placeHolder.unbind();
						placeHolder.remove();
						$(selectEl).removeAttr("disabled").show();
					}
				};
			}();
			
		};
		
		var methods = {
			init:function(options) {
				var cancelMenu = (function() {
					if (clickEvent !== 'touchend') {
						return function() {
							if (menu.isOpen()) {
								menu.reset();
							}
						};
					} else {
						var touchMoved;

						$(document).bind('touchstart', function(e) {
							touchMoved = false;
						});
						
						$(document).bind('touchmove', function(e) {
							touchMoved = true;
						});
						
						return function() {
							if (menu.isOpen() && touchMoved === false) {
								menu.reset();
							}
						};
					}
				}());
				
				settings = $.extend({}, $.fn.flyweightCustomSelect.settings, options);
				
				//instantiate single drop down menuDiv on first run
				//store instance on prototype. menu is local var for better compression & performance!
				if (menu === null) {
					menu = $.fn.flyweightCustomSelect.menu = new FlyweightMenu();
					$(window).bind('resize', menu.reposition);
					$(document).bind(clickEvent, cancelMenu);
				}
				
				//keep a record of placeholder on select
				return this.each(function() {
					if (!$(this).data('placeHolder')) {
						$(this).data('placeHolder', new PlaceHolder(this));
					}
				});
			},
			destroy:function() {
				menu.destroy();
				menu = $.fn.flyweightCustomSelect.menu = null;
				
				$(document).unbind(clickEvent);
				$(document).unbind('touchmove');
				$(document).unbind('touchstart');
				
				return this.each(function() {
					$(this).data('placeHolder').destroy();
					$(this).data('placeHolder', null);
				});
			},
			enable:function() {
				return this.each(function() {
					$(this).data('placeHolder').enable();	
				});
			},
			disable:function() {
				return this.each(function() {
					$(this).data('placeHolder').disable();	
				});
			}
		};
		
		//curry function to build placeHolder
		//we do this here for performance so it is run only once.
		var buildPlaceHolder = (function() {
			//vml in IE6 won't focus on hyperlinks with PIE so, we have to wrap our markup in another div :(
			if ($.browser.msie && parseInt($.browser.version, 10) < 7) {
				return function(selectEl) {
					return $('<div class="' + settings.classes.placeholder.container.base + ' ' + selectEl.className + '"><a href="#" aria-owns="' + selectEl.id + '" role="button" href="#" aria-haspopup="true" id="' + selectEl.id + '-button"><span class="' + settings.classes.placeholder.text.base + '">' + selectEl.options[selectEl.selectedIndex].text + '</span><span class="' + settings.classes.placeholder.arrow.base + '"></span></a></div>');
				};
			} else {
				return function(selectEl) {
					return $('<a href="#" aria-owns="' + selectEl.id + '" class="' + settings.classes.placeholder.container.base + ' ' + selectEl.className + '" role="button" href="#" aria-haspopup="true" id="' + selectEl.id + '-button"><span class="' + settings.classes.placeholder.text.base + '">' + selectEl.options[selectEl.selectedIndex].text + '</span><span class="' + settings.classes.placeholder.arrow.base + '"></span></a>');
				};
			}
		})();
		
		//see if we have the method public method. if so, call it with remaining arguments
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
		  //else if the argument is of type object (i.e. we assume it is config and extend it into default settings) or nothing, we call init
			return methods.init.apply( this, arguments );
		} else {
		  //fail with error message to jQuery
			$.error( 'Method ' +  method + ' does not exist on jQuery.flyweightCustomSelect' );
		}

	};
	
	$.fn.flyweightCustomSelect.settings = {
		classes:{
			placeholder:{
				container:{
					base:"fwselect",
					open:"fwselect-open",
					dropdown:"fwselect-drop-down",
					dropup:"fwselect-drop-up",
					focus:"fwselect-focus",
					disabled:"fwselect-disabled"
				},
				text:{
					base:"fwselect-text"
				},
				arrow:{
					base:"fwselect-arrow"
				}
			},
			menu:{
				container:{
					base:"fwselect-menu",
					open:"fwselect-menu-open",
					dropdown:"fwselect-menu-drop-down",
					dropup:"fwselect-menu-drop-up"
				},
				list:{
					base:"fwselect-menu-list"
				},
				listitem:{
					base:"fwselect-menu-listitem",
					focus:"fwselect-menu-listitem-focus"
				},
				group:{
					base:"fwselect-menu-group"
				},
				scroll:{
					base:"fwselect-menu-scroll"
				}
			}			
		},
		optionfilter:'option,optgroup',
		tabindex:false,
		keymap:{
			left:37,
			right:39,
			up:38,
			down:40,
			enter:13,
			space:32,
			tab:9,
			pgup:33,
			pgdn:34,
			escape:27
		}
	};
}(jQuery));
