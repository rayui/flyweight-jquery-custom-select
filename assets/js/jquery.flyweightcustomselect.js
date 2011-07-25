/*!
* jQuery Custom Select Manager function
* Copyright 2011, Ray Brooks
* Requires jQuery Core 1.4+ - http://www.jquery.com/
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

(function($){
	$.fn.flyweightCustomSelect = function(options) {
		var opts = $.extend({}, $.fn.flyweightCustomSelect.defaults, options);
		
		//need to review the need for these variables in light of sensible model
		var menu = null;
		var searchString = ""; //must be global as needs to persist
		var timer;
		
		/*Produce modulo correctly */		
		var mod = function(m, n) {
			return ((m%n)+n)%n;
		};

		//dropdown menuDiv constructor
		var flyweightMenu = function() {
			//variables to remember which element the last event was fired from
			var placeHolder = null;
			var selectEl = null;
			var isOpen = false;
			var menuDiv, $menuDiv;
			
			// this utility function gets all the options out of the referenced select,
			// then gets their values ansd returns them in an array
			var getSelectDataAsArray = function(selectEl) {
				var text = $.map($('option', selectEl), function(el, index) {
					return $(el).text();
				});
				var values = $.map($('option', selectEl), function(el, index) {
					return $(el).attr("value");
				});
				
				return [text, values];
			};
			
			var setListToSelectedIndex = function(index) {
				//update selecEl value to new index
				var $selectEl = $(selectEl);
				$selectEl.find("option").removeAttr("selected");
				
				selectEl.value = selectEl.options[index].value;
				selectEl.options[index].selected = true;
				
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
			
			var onclick = function(e) {
				e.preventDefault();
				e.stopPropagation();
				
				var selectedAnchor = e.srcElement;
				
				//we only set target for keyboard nav as events will be triggered on wrapper div, not anchor (as is when clicked)
				//we need to check this because the person could theoretically click on the div which the elements are bound to, as opposed to the anchor 
				if (selectedAnchor.nodeName.toLowerCase() !== "a") {
					return false;
				}				
				
				//get index of selected item in list and update the controls
				var value = $(selectedAnchor).attr("data-value");
				var index  = $(selectEl).find("option[value='" + value + "']").index();
				setListToSelectedIndex(index);
				
				//kick off the change event bound to the actual select
				menu.close();
			}
			
			var selectNext = function() {
				//need to think up a more intelligent way of matching elements here so we can take care of items we would like to be hidden
				//we need to match the highlighted anchor data-value to the value of the item in the select
				var index = mod(parseInt(selectEl.selectedIndex + 1, 10) ,selectEl.options.length - 1);
                    		setListToSelectedIndex(index);
			}
			
			var selectPrevious = function() {
				var index = mod(parseInt(selectEl.selectedIndex - 1, 10) ,selectEl.options.length - 1);
                    		setListToSelectedIndex(index);
			}
			
			var init = function() {
				menuDiv = document.createElement('div');

				menuDiv.style.display = 'none';
				menuDiv.style.position = 'absolute';
				menuDiv.className = 'customSelect';
			
				$('body').append(menuDiv);
				$menuDiv = $(menuDiv);
				
				$menuDiv.bind('click', onclick);
			}
			
			//intialise menu object
			init();
			
			return {
				open: function(triggeredPlaceHolder, triggeredSelectEl) {
					
					//set to remember which object triggered open
					placeHolder = triggeredPlaceHolder;
					selectEl = triggeredSelectEl;
					
					//get offset of placeholder for menu position
					//msie7 reports offset incorrectly - VML issue?
					var xy = $(placeHolder).offset();
					xy.top += $(placeHolder).height();
					
					//get data from select
					var list = getSelectDataAsArray(selectEl);
					var i = list[0].length - 1;
					var customHTML = '</ul>';
					
					while (i >= 0) {
						customHTML = '<li><a data-value="' + list[1][i] + '" href="#">' + list[0][i] + '</a></li>' + customHTML;
						i--;
					}
					
					customHTML = '<ul class="ui-selectmenu-menu ui-widget ui-widget-content ui-selectmenu-menu-dropdown ui-corner-bottom" style="visibility:visible;">' + customHTML;
					
					menuDiv.innerHTML = customHTML;
					menuDiv.style.left = xy.left + 'px';
					menuDiv.style.top = xy.top + 'px';
					menuDiv.style.display = 'block';
					
					//make jQuery to get rendered width
					var $menuDiv = $(menuDiv);
					var placeholderWidth = $(selectEl).width();
					if (placeholderWidth > $menuDiv.width()) {
						$menuDiv.find("ul").width(placeholderWidth);
						if($menuDiv.find("ul").hasScrollBar()) {
							$menuDiv.find("li").width(placeholderWidth - 17); //arbitrarily set width of scrollbar - varies from OS to OS. i picked an approximate value
						} else {
							$menuDiv.find("li").width(placeholderWidth);
						}       
					}
					
					setListToSelectedIndex(selectEl.selectedIndex);
					
					//ensure fauxSelect is always visible
					if($menuDiv.offset().top + $menuDiv.height() > $(window).height()) {
						var scrollEl = $.browser.webkit ? document.body : "html"; 
						$(scrollEl).animate({scrollTop: xy.top - 100}, 1000);
					}
					
					//set flag
					isOpen = true;
				},
				close: function() {
					menuDiv.style.display = 'none';

					//set flag
					isOpen = false;
				},
				visible: function() {
					return isOpen;	
				},
				scrollDown: function() {
					selectNext();	
				},
				scrollUp: function() {
					selectPrevious();	
				}
			};
		};
		
		/*create placeHolder for original submit */
		var createPlaceholder = function(selectEl) {
			var text = "";
			
			//set initial text of placeholder
			if (selectEl.selectedIndex >= 0) {
				text = selectEl.options[selectEl.selectedIndex].text;
			} else {
				text = selectEl.options[0].text
			}
			
			var $placeHolder = $('<a href="#" aria-owns="' + selectEl.id + '" class="placeholder ui-selectmenu ui-widget ui-state-default ui-selectmenu-dropdown ui-corner-all" role="button" href="#" tabindex="0" aria-haspopup="true" id="' + selectEl.id + '-button"><span class="ui-selectmenu-status">' + text + '</span><span class="ui-selectmenu-icon ui-icon ui-icon-triangle-1-s"></span></a>');
			
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
					case (e.which === $.ui.keyCode.LEFT):
					case (e.which === $.ui.keyCode.UP):
						if (menu.visible()) {
							menu.scrollUp();
						} else {
							$(this).trigger("click");
						}
						return false;
						break;
					case (e.which === $.ui.keyCode.RIGHT):
					case (e.which === $.ui.keyCode.DOWN):
						if (menu.visible()) {
							menu.scrollDown();
						} else {
							$(this).trigger("click");
						}
						return false;
						break;
					case (e.which === $.ui.keyCode.ENTER):
					case (e.which === $.ui.keyCode.TAB):
						//trigger click on nav
						if (menu.visible()) {
							menu.close();
						} else {
							if (e.which === $.ui.keyCode.ENTER) {
								$(this).trigger("click");
								return false;
							} else {
								menu.close();
							}
						}
									
						break;
					case (e.which === $.ui.keyCode.ESCAPE):
						//close dropdown 
						menu.close();
						return false;
						break;
					case (e.which >= 48 && e.which <= 59):
					case (e.which >= 65 && e.which <= 90):
					case (e.which >= 97 && e.which <= 122):
						/* this bit is for scrolling to a particular item in the list */
						searchString += String.fromCharCode(e.which);
						if (!menu.isOpen) {
							$(this).trigger("click");
						}
						$(menu).trigger("select.item", [selectEl]);
						//now we build a timeout to clear search string after 1 seconds of no input and set upa  new timer in its place
						clearTimeout(timer);
						timer = setTimeout(function() {searchString = "";}, 1000);
						break;
				}
			});
			
			$placeHolder.bind('focus mouseover', function(e) {
				clearTimeout(timer);
				searchString = "";
				$(this).addClass("ui-selectmenu-focus ui-state-hover");
			});
			
			$placeHolder.bind('blur mouseout', function(e) {
				$(this).removeClass("ui-selectmenu-focus ui-state-hover");
			});
			
			return $placeHolder;
		}
		
		//instantiate single drop down menuDiv on run
		if (menu === null) {
			menu = new flyweightMenu();
		}
		
		// add event handler to the page, so when you click anywhere which ISN'T the custom select menuDiv, or a placeholder
		// for one, we close the custom select menuDiv
		$('body').bind('click keydown focus', function(e) {
		    if ((!$(e.target).closest('.ui-selectmenu-menu').length) && (!$(e.target).closest('a.placeholder').length)) {
			menu.close();
		    };
		});

				
		return this.each(function() {
			var $placeHolder = createPlaceholder(this);
			var $menu = $(menu.menuDiv);
			
			return this;
		});
	};
	
	$.fn.flyweightCustomSelect.defaults = {
	
	};
})(jQuery);
