/*!
* jQuery Custom Select Manager function
* Copyright 2011, Ray Brooks
* Requires jQuery Core 1.4+ - http://www.jquery.com/
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

(function($){
	$.fn.flyweightCustomSelect = function(method) {
		var settings = {},
			menu = $.fn.flyweightCustomSelect.menu || null;

		//dropdown menuDiv constructor
		var FlyweightMenu = function() {
			//variables to remember which element the last event was fired from
			var placeHolder = null,
				selectEl = null,
				isOpen = false,
				$menuDiv = null,
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
					
					return {type:el.nodeName.toUpperCase(), selectIndex:selectIndex, text:$el.text(), value:$el.attr("value"), group:$el.attr("label")};
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
				
				$menuDiv.html(customHTML + '</ul>');
				
			};
			
			var positionMenu = function() {
				//get offset of placeholder for menu position
				//msie7 reports offset incorrectly - VML issue?
				var xy = $(placeHolder).offset();
				xy.top += $(placeHolder).height();
				
				$menuDiv.css({
					left: xy.left + 'px',
					top: xy.top + 'px'
				});
			};
			
			var hasScrollBar = function(el) {
			    //note: clientHeight= height of holder
			    //scrollHeight= we have content till this height
			    if ((el.clientHeight < el.scrollHeight) || (el.clientWidth < el.scrollWidth)) {
				return true;
			    }
			    return false;
			};
			
			var fitScrollBar = function() {
				//make jQuery to get rendered width
				var placeholderWidth = $(selectEl).width();
									
				if (placeholderWidth > $menuDiv.width()) {
					$menuDiv.find("ul").width(placeholderWidth);
					if (hasScrollBar($menuDiv.find("ul"))) {
						$menuDiv.find("li").width(placeholderWidth - 17); //this needs calculating properly, somehow
					} else {
						$menuDiv.find("li").width(placeholderWidth);
					}       
				}	
			};
			
			var fitMenuOnScreen = function() {
				//ensure menu is always visible

				if($menuDiv.offset().top + $menuDiv.height() > $(window).height()) {
					var scrollEl = $.browser.webkit ? window.document.body : "html"; 
					$(scrollEl).animate({scrollTop: parseInt($menuDiv.position().top, 10) - 100}, 1000);
				}	
			};

			//update selecEl value to new index			
			var setSelectToIndex = function(lookupIndex) {
				selectEl.value = lookupHash[lookupIndex].value;
				selectEl.selectedIndex = lookupHash[lookupIndex].selectIndex;
				
				//update value of anchor
				$(placeHolder).find("span." + settings.classes.placeholder.text.base).text(lookupHash[lookupIndex].text);
				
				//trigger any change events bound to select element
				$(selectEl).trigger("change");
			};

			//update menu to show new select info
			var setMenuToIndex = function(lookupIndex) {
				var $selectedAnchor;
				
				//first ensure select is kept in sync
				//necessary for data integrity
				setSelectToIndex(lookupIndex);
				
				//scroll to selected LI in list
				$selectedAnchor = $menuDiv.find('a[data-index="' + lookupHash[lookupIndex].selectIndex + '"]');
				
				$menuDiv.find("ul").scrollTop(0);
				$menuDiv.find("a").removeClass(settings.classes.menu.listitem.focus);
				if ($selectedAnchor.length > 0) {
					$selectedAnchor.addClass(settings.classes.menu.listitem.focus);
					$menuDiv.find("ul").scrollTop($selectedAnchor.position().top);
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
			
			//update menu to to match psecific attribute in lookupHash 
			var setMenuByAttr = function(attr, data) {
				setMenuToIndex(getLookupIndexByAttr(attr, data));
			};

			//search for next element from specified start position in select
			var find = function(search, i) {
				while (i < selectEl.options.length) {
					if (selectEl[i].text.toUpperCase().charCodeAt(0) === search) {
						setMenuByAttr("selectIndex", i);
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
				find(search, selectEl.selectedIndex + 1) || find(search, 0);
				
			};
			
			var onClick = function(e) {
				e.preventDefault();
				e.stopPropagation();
				
				var selectedAnchor = e.target,
					value,
					index;
				
				//we only set target for keyboard nav as events will be triggered on wrapper div, not anchor (as is when clicked)
				//we need to check this because the person could theoretically click on the div which the elements are bound to, as opposed to the anchor 
				if (selectedAnchor.nodeName.toUpperCase() !== "A") {
					return false;
				}
				setSelectToIndex(getLookupIndexByAttr("selectIndex", parseInt(selectedAnchor.getAttribute("data-index"), 10)));
				menu.close();
				
				//return focus to placeholder
				placeHolder.focus();
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
				$menuDiv = $('<div class="' + settings.classes.menu.container.base + '" />').bind('click', onClick);
				$('body').append($menuDiv);
				
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
							positionMenu();
							fitScrollBar();
							fitMenuOnScreen();
							
							//now set intial state of menu
							initialSelectedIndex = getLookupIndexByAttr("selectIndex", selectEl.selectedIndex);
							setMenuToIndex(initialSelectedIndex);
							
							$menuDiv.addClass(settings.classes.menu.container.open);
							$(placeHolder)
								.addClass(settings.classes.placeholder.container.open)
								.focus();
							
							//set flags
							isOpen = true;
							return true;
						}
						return false;
					},
					close: function() {
						$menuDiv.removeClass(settings.classes.menu.container.open);
						$(placeHolder).removeClass(settings.classes.placeholder.container.open);
						
						//set flag
						isOpen = false;
					},
					destroy:function() {
						$menuDiv.unbind();
						$menuDiv.remove();
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
					}
				};
			}();
		};
		
		var PlaceHolder = function(selectEl) {
			var $placeHolder;
			
			//click behaviour
			var onClick = function(e) {
				e.stopPropagation();
				e.preventDefault();
				
				//close existing any menu and re-initialise for current select 
				if (menu.getSelect() !== selectEl) {
					menu.close();
					menu.bondToSelect(this, selectEl);
				}
				
				// toggle the custom select menu if enabled
				menu.open() || menu.close();
			};
			
			//keydown behaviour
			var onKeyDown = function(e) {			
				if (e.keyCode === settings.keymap.left || e.keyCode === settings.keymap.right || e.keyCode === settings.keymap.up || e.keyCode === settings.keymap.down || e.keyCode === settings.keymap.enter || e.keyCode === settings.keymap.space) {
					e.stopPropagation();
					e.preventDefault();
				}
				
				//switch(true) to enable use of expanded conditional statements
				//crockford doesn't like this but what the hell
				switch (true) {
					case (e.keyCode === settings.keymap.left):
					case (e.keyCode === settings.keymap.up):
						menu.scrollUp();
						break;
					case (e.keyCode === settings.keymap.right):
					case (e.keyCode === settings.keymap.down):
						menu.scrollDown();
						break;
					case (e.keyCode === settings.keymap.pgup):
						menu.pageUp();
						break;
					case (e.keyCode === settings.keymap.pgdn):
						menu.pageDown();
						break;
					case (e.keyCode === settings.keymap.enter):
					case (e.keyCode === settings.keymap.space):
						$(this).trigger("click");
						break;
					case (e.keyCode === settings.keymap.tab):
						menu.close();
						break;
					case (e.keyCode === settings.keymap.escape):
						menu.reset();
						break;
					case (e.keyCode >= 48 && e.keyCode <= 59):
					case (e.keyCode >= 65 && e.keyCode <= 90):
					case (e.keyCode >= 97 && e.keyCode <= 122):
						menu.search(String.fromCharCode(e.keyCode));
						break;
				}
			};
			
			var onFocus = function(e) {
				menu.bondToSelect($(this), selectEl);
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
				$(selectEl).removeAttr("disabled");
				
				//copy tabindex of select to placeholder according to settings
				!($(selectEl).attr('tabindex') && settings.tabindex) || $placeHolder.attr('tabindex', $(selectEl).attr('tabindex'));
				
				$placeHolder.removeClass(settings.classes.placeholder.container.disabled);
				$placeHolder.click(onClick);
				$placeHolder.unbind('focusin').bind('focusin', onFocus);
				$placeHolder.focusout(onBlur);

				$placeHolder.keydown(onKeyDown);
				$placeHolder.hover(onMouseOver, onMouseOut);
			};
			
			var disable = function() {
				$(selectEl).attr("disabled", "disabled");
				
				//remove tabindex according to settings
				!settings.tabindex || $placeHolder.removeAttr("tabindex");
				
				$placeHolder.addClass(settings.classes.placeholder.container.disabled);
				//prevent default click
				$placeHolder.unbind('click').click(function() {return false;});
				$placeHolder.unbind('keydown');
				//remove placeholder from document focus flow
				$placeHolder.unbind('focusin').bind('focusin', function() {this.blur();return false;});
				$placeHolder.unbind('focusout');
				$placeHolder.unbind('mouseover');
				$placeHolder.unbind('mouseout');
			};
			
			//generate placeholder and enable
			return function() {
				$placeHolder = buildPlaceHolder(selectEl);
				enable();
				
				//inesrt and hide bound control
				$(selectEl).after($placeHolder);
				$(selectEl).hide();
				
				return {
					enable:function() {
						enable();
					},
					disable:function() {
						disable();
					},
					destroy:function() {
						$placeHolder.unbind();
						$placeHolder.remove();
						$(selectEl).removeAttr("disabled").show();
					}
				};
			}();
			
		};
		
		var methods = {
			init:function(options) {
				settings = $.extend({}, $.fn.flyweightCustomSelect.settings, options);
				
				//instantiate single drop down menuDiv on first run
				//store instance on prototype. menu is local var for better compression & performance!
				if (menu === null) {
					menu = $.fn.flyweightCustomSelect.menu = new FlyweightMenu();
					$(document).click(function() {
						if (menu.isOpen()) {menu.reset()};
					});
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
					return $('<div class="' + settings.classes.placeholder.container.base + '"><a href="#" aria-owns="' + selectEl.id + '" role="button" href="#" aria-haspopup="true" id="' + selectEl.id + '-button"><span class="' + settings.classes.placeholder.text.base + '">' + selectEl.options[selectEl.selectedIndex].text + '</span><span class="' + settings.classes.placeholder.arrow.base + '"></span></a></div>');
				};
			} else {
				return function(selectEl) {
					return $('<a href="#" aria-owns="' + selectEl.id + '" class="' + settings.classes.placeholder.container.base + '" role="button" href="#" aria-haspopup="true" id="' + selectEl.id + '-button"><span class="' + settings.classes.placeholder.text.base + '">' + selectEl.options[selectEl.selectedIndex].text + '</span><span class="' + settings.classes.placeholder.arrow.base + '"></span></a>');
				};
			}
		})();
		
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.flyweightCustomSelect' );
		}

	};
	
	$.fn.flyweightCustomSelect.settings = {
		classes:{
			placeholder:{
				container:{
					base:"fwselect",
					open:"fwselect-open",
					hover:"fwselect-hover",
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
					open:"fwselect-menu-open"
				},
				list:{
					base:"fwselect-menu-list"
				},
				listitem:{
					base:"fwselect-menu-listitem",
					focus:"fwselect-menu-listitem-focus",
					hover:"fwselect-menu-listitem-hover"
				},
				group:{
					base:"fwselect-menu-group"
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
