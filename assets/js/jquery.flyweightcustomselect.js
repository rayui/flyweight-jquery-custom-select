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

		//dropdown constructor
		var dropDown = function() {
			var element = document.createElement('div');
			var isOpen = false;
			
			element.style.display = 'none';
			element.style.position = 'absolute';
			element.className = 'customSelect';
			
			document.getElementsByTagName('body')[0].appendChild(element);
			// add event handler to the page, so when you click anywhere which ISN'T the custom select menu, or a placeholder
			// for one, we close the custom select menu
			$('body, .accordionControl').bind('click keydown focus', function(e) {
			    if ((!$(e.target).closest('.ui-selectmenu-menu').length) && (!$(e.target).closest('a.placeholder').length)) {
				storedInstance.close();
			    };
			});
			
			return {
				open: function(list, xy) {
					//selectedIndex = customSelectManager._getOriginalFromFauxSelect($(fauxSelectTarget))[0].selectedIndex - 1;
					customHTML = '</ul>';
					var i = list[0].length;
					while (i--) {
					customHTML = '<li><a data-value="' + list[1][i] + '" href="#">' + list[0][i] + '</a></li>' + customHTML;
					}
					customHTML = '<ul class="ui-selectmenu-menu ui-widget ui-widget-content ui-selectmenu-menu-dropdown ui-corner-bottom" style="visibility:visible;">' + customHTML;
					element.innerHTML = customHTML;
					element.style.left = xy.left + 'px';
					element.style.top = xy.top + 'px';
					element.style.display = 'block';
					var $list = $(element);
					var placeholderWidth = $(fauxSelectTarget).width();
					if (placeholderWidth > $list.width()) {
						$list.find("ul").width(placeholderWidth);
						if($list.find("ul").hasScrollBar()) {
							$list.find("li").width(placeholderWidth - 17); //arbitrarily set width of scrollbar - varies from OS to OS. i picked an approximate value
						} else {
							$list.find("li").width(placeholderWidth);
						}       
					}
					customSelectManager._setListToSelectedIndex();
					//ensure fauxSelect is always visible
					if($list.offset().top + $list.height() > $(window).height()) {
						var scrollEl = $.browser.webkit ? document.body : "html"; 
						$(scrollEl).animate({scrollTop: $list.offset().top - 100}, 1000);
					}
					isOpen = true;
				},
				close: function() {
					selectedIndex = 0;
					element.style.display = 'none';
					isOpen = false;
				}
			};
		};
		
		/*Produce modulo correctly */		
		var mod = function(m, n) {
			return ((m%n)+n)%n;
		};
		
		//instantiate single drop down
		storedInstance = new dropDown();
				
		return this.each(function() {
			console.log();
		});
	};
	
	$.fn.flyweightCustomSelect.defaults = {
	
	};
})(jQuery);
