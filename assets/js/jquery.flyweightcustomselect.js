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
		var storedInstance = null;
		var fauxSelectTarget = null;
		var selectedIndex = null;
		var searchString = ""; //must be global as needs to persist
		var timer;

		//dropdown menu constructor
		var flyweightMenu = function() {
			var menu = document.createElement('div');
			var isOpen = false;
			
			var setListToSelectedIndex = function(selectEl) {
				var $menu = $(menu);
				var $selectedLi = $menu.find("li:eq(" + selectEl.selectedIndex + ")");
				$menu.find("ul").scrollTop(0);
				$menu.find("li a").removeClass("hover");
				if ($selectedLi.length > 0) {
					$selectedLi.find("a").addClass("hover");
					$menu.find("ul").scrollTop($selectedLi.position().top);
				}
			}
			
			menu.style.display = 'none';
			menu.style.position = 'absolute';
			menu.className = 'customSelect';
			
			document.getElementsByTagName('body')[0].appendChild(menu);
			
			return {
				open: function(selectEl, list, xy) {
					selectedIndex = select.selectedIndex - 1;
					customHTML = '</ul>';
					var i = list[0].length;
					while (i--) {
						customHTML = '<li><a data-value="' + list[1][i] + '" href="#">' + list[0][i] + '</a></li>' + customHTML;
					}
					customHTML = '<ul class="ui-selectmenu-menu ui-widget ui-widget-content ui-selectmenu-menu-dropdown ui-corner-bottom" style="visibility:visible;">' + customHTML;
					
					menu.innerHTML = customHTML;
					menu.style.left = xy.left + 'px';
					menu.style.top = xy.top + 'px';
					menu.style.display = 'block';
					
					//make jQuery to get rendered width
					var $menu = $(menu);
					var placeholderWidth = $(selectEl).width();
					if (placeholderWidth > $menu.width()) {
						$menu.find("ul").width(placeholderWidth);
						if($menu.find("ul").hasScrollBar()) {
							$menu.find("li").width(placeholderWidth - 17); //arbitrarily set width of scrollbar - varies from OS to OS. i picked an approximate value
						} else {
							$menu.find("li").width(placeholderWidth);
						}       
					}
					setListToSelectedIndex(selectEl);
					
					//ensure fauxSelect is always visible
					if($menu.offset().top + $menu.height() > $(window).height()) {
						var scrollEl = $.browser.webkit ? document.body : "html"; 
						$(scrollEl).animate({scrollTop: $element.offset().top - 100}, 1000);
					}
					
					//set flag
					isOpen = true;
				},
				close: function() {
					selectedIndex = 0;
					menu.style.display = 'none';

					//set flag
					isOpen = false;
				},

			};
		};
		
		/*Produce modulo correctly */		
		var mod = function(m, n) {
			return ((m%n)+n)%n;
		};
		
		/*create placeHolder for original submit */
		var createPlaceholder = function(selectEl) {
			var $selectEl = $(selectEl);
			var text = $selectEl.find("option:eq(0)").text();
			var $placeHolder = $('<a href="#" aria-owns="' + selectEl.id + '" class="placeholder ui-selectmenu ui-widget ui-state-default ui-selectmenu-dropdown ui-corner-all" role="button" href="#" tabindex="0" aria-haspopup="true" id="' + selectEl.id + '-button"><span class="ui-selectmenu-status">' + text + '</span><span class="ui-selectmenu-icon ui-icon ui-icon-triangle-1-s"></span></a>');
			$selectEl.after($placeHolder);
			$selectEl.hide();
			return $placeHolder;
		}
		
		//instantiate single drop down menu
		storedInstance = new flyweightMenu();
		
		// add event handler to the page, so when you click anywhere which ISN'T the custom select menu, or a placeholder
		// for one, we close the custom select menu
		$('body').bind('click keydown focus', function(e) {
		    if ((!$(e.target).closest('.ui-selectmenu-menu').length) && (!$(e.target).closest('a.placeholder').length)) {
			storedInstance.close();
		    };
		});

				
		return this.each(function() {
			var $placeHolder = createPlaceholder(this);
			return this;
		});
	};
	
	$.fn.flyweightCustomSelect.defaults = {
	
	};
})(jQuery);
