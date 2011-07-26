var jQuery = jQuery || {} ;

/*!
* jQuery Custom Select Manager function
* Copyright 2011, Ray Brooks
* Requires jQuery Core 1.4+ - http://www.jquery.com/
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

(function($){
	$.fn.flyweightCustomSelect = function(options) {
		var opts = $.extend({}, $.fn.flyweightCustomSelect.defaults, options),
			menu = null;
		
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
				menuDiv,
				initialSelectedIndex = -1,
				searchString = "",
				timer;
			
			// this utility function gets all the options out of the select element,
			// then gets their values and returns them in an array
			var mapOptionsToArray = function() {
				var text,
					values;
					
				text = $.map($('option', selectEl), function(el, index) {
					return $(el).text();
				});
				values = $.map($('option', selectEl), function(el, index) {
					return $(el).attr("value");
				});
				
				return [text, values];
			};
				
			var buildMarkup = function() {
				//get data from select
				//build markup of control
				var list = mapOptionsToArray(selectEl),
					i = list[0].length - 1,
					customHTML = '</ul>';
				
				while (i >= 0) {
					customHTML = '<li><a data-value="' + list[1][i] + '" href="#">' + list[0][i] + '</a></li>' + customHTML;
					i-=1;
				}
				
				menuDiv.innerHTML = '<ul class="ui-selectmenu-menu ui-widget ui-widget-content ui-selectmenu-menu-dropdown ui-corner-bottom" style="visibility:visible;">' + customHTML;
			};
			
			var positionPlaceHolder = function() {
				//get offset of placeholder for menu position
				//msie7 reports offset incorrectly - VML issue?
				var xy = $(placeHolder).offset();
				xy.top += $(placeHolder).height();
				
				menuDiv.style.left = xy.left + 'px';
				menuDiv.style.top = xy.top + 'px';
				menuDiv.style.display = 'block';	
			};
			
			var fitScrollBar = function() {
				//make jQuery to get rendered width
				var $menuDiv = $(menuDiv),
					placeholderWidth = $(selectEl).width();
					
				if (placeholderWidth > $menuDiv.width()) {
					$menuDiv.find("ul").width(placeholderWidth);
					if($menuDiv.find("ul").hasScrollBar()) {
						$menuDiv.find("li").width(placeholderWidth - 17); //arbitrarily set width of scrollbar - varies from OS to OS. i picked an approximate value
					} else {
						$menuDiv.find("li").width(placeholderWidth);
					}       
				}	
			};
			
			var fitMenuOnScreen = function() {
				var $menuDiv = $(menuDiv);
				
				//ensure menu is always visible
				if($menuDiv.offset().top + $menuDiv.height() > $(window).height()) {
					var scrollEl = $.browser.webkit ? document.body : "html"; 
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
				var $menuDiv = $(menuDiv);
				
				//first ensure select is kept in sync
				//necessary for data integrity
				setSelectToIndex(index);
				
				//scroll to selected LI in list
				var $selectedLi = $menuDiv.find("li:eq(" + index + ")");
				$menuDiv.find("ul").scrollTop(0);
				$menuDiv.find("li a").removeClass("hover");
				if ($selectedLi.length > 0) {
					$selectedLi.find("a").addClass("hover");
					$menuDiv.find("ul").scrollTop($selectedLi.position().top);
				}
				
				//update value of anchor
				$(placeHolder).find(".ui-selectmenu-status").text($selectedLi.text());

			};
			
			var getOptFromSelect = function(value) {
				return $(selectEl).find("option[value='" + value + "']");
			};
			
			var typeAhead = function(character) {
				var typeAheadString,
					list,
					found = false,
					i = 0;
					
				searchString += character;
				typeAheadString = searchString.replace(/[\W]/ig,"").toUpperCase();
				list = mapOptionsToArray();

				for (i = 0; i < list[0].length; i+=1) {
					if (list[0][i].replace(/[\W]/ig,"").substring(0, typeAheadString.length).toUpperCase() === typeAheadString) {
						setMenuToIndex(i);
						i = list[0].length;
						found = true;
					}
				}
				
				clearTimeout(timer);
				timer = setTimeout(function() {searchString = "";}, 1000);

			};
			
			var onClick = function(e) {
				var index,
					selectedAnchor;
					
				e.preventDefault();
				e.stopPropagation();
				
				selectedAnchor = e.srcElement;
				
				//we need to check this because the person could theoretically click on the div which the elements are bound to, as opposed to the anchor 
				if (selectedAnchor.nodeName.toLowerCase() !== "a") {
					return false;
				}				
				
				//get index of selected item in list and update the controls
				index  = $(selectEl).find("option[value='" + $(selectedAnchor).attr("data-value") + "']").index();
				
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
				
				var index;
				
				index = mod(selectEl.childNodes.length, parseInt(selectEl.selectedIndex + offset, 10));
				
				while (selectEl[index].getAttribute("value").length === 0) {
					index = mod(selectEl.childNodes.length, parseInt(index + offset, 10));
				}
				
				setMenuToIndex(index);
			};
			
			var init = function() {
				menuDiv = document.createElement('div');

				menuDiv.style.display = 'none';
				menuDiv.style.position = 'absolute';
				menuDiv.className = 'customSelect';
			
				$('body').append(menuDiv);
				
				$(menuDiv).bind('click', onClick);
			};
			
			//intialise menu object
			init();
			
			return {
				open: function(triggeredPlaceHolder, triggeredSelectEl) {
					//set closure wide variable to remember which object triggered open
					placeHolder = triggeredPlaceHolder;
					selectEl = triggeredSelectEl;
					
					buildMarkup();
					positionPlaceHolder();
					fitScrollBar();
					fitMenuOnScreen();
					setMenuToIndex(selectEl.selectedIndex);
					
					//set flags
					initialSelectedIndex = selectEl.selectedIndex; 
					isOpen = true;
					searchString = "";
					clearTimeout(timer);

				},
				close: function() {
					menuDiv.style.display = 'none';

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
				scrollDown: function() {
					scrollBy(1);	
				},
				scrollUp: function() {
					scrollBy(-1);	
				},
				search: function(character) {
					typeAhead(character);
				}
			};
		};
		
		/*create placeHolder for a submit*/
		var createPlaceholder = function(selectEl) {
			var text = "",
				$placeHolder;
			
			//set initial text of placeholder
			if (selectEl.selectedIndex >= 0) {
				text = selectEl.options[selectEl.selectedIndex].text;
			} else {
				text = selectEl.options[0].text;
			}
			
			$placeHolder = $('<a href="#" aria-owns="' + selectEl.id + '" class="placeholder ui-selectmenu ui-widget ui-state-default ui-selectmenu-dropdown ui-corner-all" role="button" href="#" tabindex="0" aria-haspopup="true" id="' + selectEl.id + '-button"><span class="ui-selectmenu-status">' + text + '</span><span class="ui-selectmenu-icon ui-icon ui-icon-triangle-1-s"></span></a>');
			
			$(selectEl).after($placeHolder);
			$(selectEl).hide();
			
			//bind behaviour
			$placeHolder.bind('click', function(e) {
				e.stopPropagation();
				e.preventDefault();

				// toggle the custom select menu if enabled
				if (!$(this).hasClass("disabled")) {
					if (!menu.isOpen) {                             
						menu.open(this, selectEl);
					} else {
						menu.close();
					}       
				}
			});
			
			$placeHolder.bind('keydown', function(e){
                                if (e.which === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT || e.keyCode === $.ui.keyCode.UP || e.keyCode === $.ui.keyCode.DOWN || e.keyCode === $.ui.keyCode.ENTER) {
					e.stopPropagation();
					e.preventDefault();
				}
				/* switch(true) to enable use of expanded conditional statements */
				switch (true) {
					case (e.which === $.ui.keyCode.UP || e.which === $.ui.keyCode.LEFT):
						if (menu.visible()) {
							menu.scrollUp();
						} else {
							$(this).trigger("click");
						}
						return false;
					case (e.which === $.ui.keyCode.DOWN || e.which === $.ui.keyCode.RIGHT):
						if (menu.visible()) {
							menu.scrollDown();
						} else {
							$(this).trigger("click");
						}
						return false;
					case (e.which === $.ui.keyCode.ENTER || e.which === $.ui.keyCode.TAB):
						if (e.which === $.ui.keyCode.ENTER && !menu.visible()) {
							$(this).trigger("click");
							return false;
						} else {
							menu.close();
						}
						break;
					case (e.which === $.ui.keyCode.ESCAPE):
						//reset placeholder and select to original values
						//close menu
						menu.reset();
						return false;
					case ((e.which >= 48 && e.which <= 59) || (e.which >= 65 && e.which <= 90) || (e.which >= 97 && e.which <= 122)):
						//open menu if not already
						if (!menu.visible()) {
							$(this).trigger("click");
						}
						//pass string to typeahead function
						menu.search(String.fromCharCode(e.which));
						break;
				}
			});
			
			$placeHolder.bind('focus', function(e) {
				$(this).addClass("ui-selectmenu-focus");
			});
			
			$placeHolder.bind('mouseover', function(e) {
				$(this).addClass("ui-state-hover");
			});
			
			$placeHolder.bind('blur', function(e) {
				$(this).removeClass("ui-selectmenu-focus");
			});
			
			$placeHolder.bind('mouseout', function(e) {
				$(this).removeClass("ui-state-hover");
			});
			
			return $placeHolder;
		};
		
		//instantiate single drop down menuDiv on run
		if (menu === null) {
			menu = new FlyweightMenu();
		}
		
		// add event handler to the page, so when you click anywhere which ISN'T the custom select menuDiv, or a placeholder
		// for one, we close the custom select menuDiv
		$('body').bind('click keydown focus', function(e) {
		    if ((!$(e.target).closest('.ui-selectmenu-menu').length) && (!$(e.target).closest('a.placeholder').length)) {
			menu.close();
		    }
		});

				
		return this.each(function() {
			var $placeHolder = createPlaceholder(this);			
			return this;
		});
	};
	
	$.fn.flyweightCustomSelect.defaults = {
	
	};
}(jQuery));
