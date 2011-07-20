/*!
* jQuery Custom Select Manager function
* Copyright 2011, Ray Brooks
* Requires jQuery Core 1.4+ - http://www.jquery.com/
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

/************************************/
/* CUSTOM SELECT MANAGER                        */ 
/************************************/
var customSelectManager = function() {
    var storedInstance = null;
    var fauxSelectTarget = null;
    var selectedIndex = null;
        var searchString = ""; //must be global as needs to persist
        var timer;
    // this is the actual custom select menu. there is only one of these. the function is only called once.
    // it is a div element that we fill with data each time we need it, then position in place and display.
    // it gets reused every time we click a different select element.
    var CustomSelect = function() {
        var that = this;
        this.element = document.createElement('div');
        this.element.style.display = 'none';
        this.element.style.position = 'absolute';
        this.element.className = 'customSelect';
        document.getElementsByTagName('body')[0].appendChild(this.element);
        // add event handler to the page, so when you click anywhere which ISN'T the custom select menu, or a placeholder
        // for one, we close the custom select menu
                $('body, .accordionControl').bind('click keydown focus', function(e) {
            if ((!$(e.target).closest('.ui-selectmenu-menu').length) && (!$(e.target).closest('a.placeholder').length)) {
                storedInstance.close();
            };
        });
    };
    CustomSelect.prototype = {
        open: function(list, xy) {
            // TODO: work out whether to open list UP or DOWN, depending on how much room we have
            // TODO: reset scroll position of list - because there is ony ever one list, it remembers its scroll position
                        selectedIndex = customSelectManager._getOriginalFromFauxSelect($(fauxSelectTarget))[0].selectedIndex - 1;
            customHTML = '</ul>';
            var i = list[0].length;
            while (i--) {
                customHTML = '<li><a data-value="' + list[1][i] + '" href="#">' + list[0][i] + '</a></li>' + customHTML;
            }
            customHTML = '<ul class="ui-selectmenu-menu ui-widget ui-widget-content ui-selectmenu-menu-dropdown ui-corner-bottom" style="visibility:visible;">' + customHTML;
            this.element.innerHTML = customHTML;
            this.element.style.left = xy.left + 'px';
            this.element.style.top = xy.top + 'px';
            this.element.style.display = 'block';
                        var $list = $(this.element);
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
                        this.isOpen = true;
        },
        close: function() {
                        selectedIndex = 0;
            this.element.style.display = 'none';
                        this.isOpen = false;
        }
    };
    return {
        // map select element to an array. the array contains the option texts.
        getData: function(select) {
            var text = $.map($('option', select), function(ele, index) {
                return $(ele).text();
                        });
            var values = $.map($('option', select), function(ele, index) {
                return $(ele).attr("value");
                        });
                        //if value of first option element is empty, chop it out of list, which is unselected value of select
                        if ($(select)[0].options[0].value.length === 0) {
                        text.splice(0, 1);
                        values.splice(0, 1);
                        }
            return [text, values];
        },
        hideAndReplaceOriginalSelect: function(originalSelect) {
            var validation;
            try {
                validation = originalSelect.className.match(/validate\:\([\w\d]+\)/)[0];
            } catch (err) {
                validation = "";
            }
                        var text = $(originalSelect).find("option:eq(0)").text();
                        var $placeHolder = $('<a href="#" aria-owns="' + originalSelect.id + '" class="placeholder ui-selectmenu ui-widget ui-state-default ui-selectmenu-dropdown ui-corner-all ' + validation + '" role="button" href="#" tabindex="0" aria-haspopup="true" id="' + originalSelect.id + '-button"><span class="ui-selectmenu-status">' + text + '</span><span class="ui-selectmenu-icon ui-icon ui-icon-triangle-1-s"></span></a>');
            $(originalSelect).after($placeHolder);
            $(originalSelect).hide();
            return $placeHolder;
        },
        addCustomSelect: function(target) {
            // CustomSelect is a singleton. This function ensures that there is only ever one created/returned
            var customSelect = this.getCustomSelect();
            var $customSelect = $(customSelect.element);
            var that = this;
            // this creates a placeholder link for the initial state of a new custom select control (hard-coded for now...)
            var $placeHolder = this.hideAndReplaceOriginalSelect(target);

            //set text of placeholder to session text, if available

            var selectedOption = -1;
                selectedOption = target.selectedIndex;

            if (selectedOption >= 0) {
                $placeHolder.find(".ui-selectmenu-status").text(target.options[selectedOption].text);
            }

                        // attach event handlers to the placeholder.                    
                        //click is actually synonymous with pressing ENTER, so no need to add keydown behaviour for that
            $placeHolder.bind('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                                //msie7 reports offset incorrectly
                var xy = $placeHolder.offset();
                xy.top += $placeHolder.height();
                // this utility function gets all the options out of the referenced select,
                // then gets their values ansd returns them in an array
                var list = that.getData(target);
                fauxSelectTarget = this;
                                // toggle the custom select menu if enabled
                                if (!$(this).hasClass("disabled")) {
                                        if (!customSelect.isOpen) {                             
                customSelect.open(list, xy);
                                        } else {
                                                customSelect.close();
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
                                                if (customSelect.isOpen) {
                        $customSelect.trigger("select.previous", [target]);
                                                } else {
                                                        $(this).trigger("click");
                                                }
                                                return false;
                        break;
                                        case (e.which === $.ui.keyCode.RIGHT):
                                        case (e.which === $.ui.keyCode.DOWN):
                                                if (customSelect.isOpen) {
                        $customSelect.trigger("select.next", [target]);
                                                } else {
                                                        $(this).trigger("click");
                                                }
                                                return false;
                        break;
                                        case (e.which === $.ui.keyCode.ENTER):
                                        case (e.which === $.ui.keyCode.TAB):
                                                //trigger click on nav
                                                if (customSelect.isOpen) {
                                                        var selectedObj = $customSelect.find("li:eq(" + selectedIndex + ") a");
                                                        if (selectedObj.length > 0) {
                                                                $customSelect.trigger("click", [selectedObj]);
                                                        }
                                                } else {
                                                        if (e.which === $.ui.keyCode.ENTER) {
                                                                $(this).trigger("click");
                                                                return false;
                                                        } else {
                                                                customSelect.close();
                                                        }
                                                }
                                                
                        break;
                                        case (e.which === $.ui.keyCode.ESCAPE):
                                                //close dropdown 
                        customSelect.close();
                                                return false;
                        break;
                                        case (e.which >= 48 && e.which <= 59):
                                        case (e.which >= 65 && e.which <= 90):
                                        case (e.which >= 97 && e.which <= 122):
                                                /* this bit is for scrolling to a particular item in the list */
                                                searchString += String.fromCharCode(e.which);
                                                if (!customSelect.isOpen) {
                                                        $(this).trigger("click");
                                                }
                                                $customSelect.trigger("select.item", [target]);
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
        },
        // this returns a previously created instance of the custom select menu element,
        // or creates a new one and returns that. only one ever exists
        getCustomSelect: function() {
            var that = this;
            if (storedInstance == null) {
                storedInstance = new CustomSelect();
                                var $storedInstance = $(storedInstance.element);
                // this is the event listener for the custom select menu.
                // we are listening for items in the menu being clicked.
                        
                $storedInstance.bind('click', function(e, target) {
                    e.preventDefault();
                    e.stopPropagation();
                                        //we only set target for keyboard nav as events will be triggered on wrapper div, not anchor (as is when clicked)
                                        //we need to check this because the person could theoretically click on the div which the elements are bound to, as opposed to the anchor 
                                        if (e.target.nodeName.toLowerCase() !== "a" && target === undefined) {
                                                return false;
                                        }
                    if (target === undefined) {
                        target = e.target;
                    }
                    var text = $(target).text();
                    var value = $(target).attr("data-value");
                    var $origSelect = customSelectManager._getOriginalFromFauxSelect($(fauxSelectTarget));
                    $origSelect.value = value;
                    $origSelect.find("option").removeAttr("selected");
                    customSelectManager._getOptFromTarget($origSelect, value).attr("selected", "selected");
                    $(fauxSelectTarget).find(".ui-selectmenu-status").text(text);
                                        //kick off the change event bound to the actual select
                    $origSelect.trigger("change");
                    storedInstance.close();
                    selectedIndex = null;
                });
                $storedInstance.bind("select.next", function(e, target) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (selectedIndex === null) { selectedIndex = 0; }
                    var list = that.getData(target);
                    selectedIndex = parseInt(selectedIndex + 1, 10).mod(list[0].length);
                                        customSelectManager._setListToSelectedIndex();
                });
                $storedInstance.bind("select.previous", function(e, target) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (selectedIndex === null) { selectedIndex = 0; }
                    var list = that.getData(target);
                    selectedIndex = parseInt(selectedIndex - 1, 10).mod(list[0].length);
                                        customSelectManager._setListToSelectedIndex();
                                });
                                $storedInstance.bind("select.item", function(e, target) {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        var list = that.getData(target);
                                        var found = false;
                                        //set to -1 so when we add one it searches from the first element in the list
                                        if (selectedIndex === null) {selectedIndex = -1;}
                                        //otherwise searches from the next element in the list
                                        for (var i = 0; i < list[0].length; i++) {
                                                if ($.trim(list[0][i]).substring(0, searchString.length).toString().toUpperCase() === searchString.toString().toUpperCase()) {
                                                        selectedIndex = i;
                                                        i = list[0].length;
                                                        found = true;
                                                }
                                        }
                                        //if it's not found, set to the first index
                                        if (found === false) {
                                                searchString = "";
                                                selectedIndex = 0;
                                        }
                                        customSelectManager._setListToSelectedIndex();                                  
                });
            }
            return storedInstance;
        },
        enable: function($target) {
                        var $fauxTarget = customSelectManager._getFauxSelectFromOriginal($target);
                        $fauxTarget.removeClass("disabled");
                        customSelectManager.resetTabIndexes();
            return;
        },
        disable: function($target) {
                        customSelectManager.reset($target);
                        var $fauxTarget = customSelectManager._getFauxSelectFromOriginal($target);
                        $fauxTarget.addClass("disabled");
                        customSelectManager.resetTabIndexes();
            return;
        },
        value: function($target, value) {
            var $fauxTarget = customSelectManager._getFauxSelectFromOriginal($target);
            var $opt = customSelectManager._getOptFromTarget($target, value);
            $opt.attr("selected", "selected");
            $fauxTarget.find(".ui-selectmenu-status").text($opt.text());
        },
        destroy: function($target) {
            //don't require any functionality here as there is no longer anything to destroy
            return;
        },
        change: function() {
            //don't require any functionality here as each pop-up list is built every time
            return;
        },
        select: function() {
            //is this necessary to ape?
            return;
        },
        index: function() {
            //is this necessary to ape?
            return;
        },
        style: function($target, styles) {
            if (styles.style === "dropdown") {
                var $fauxTarget = customSelectManager._getFauxSelectFromOriginal($target);
                if (!$fauxTarget.length) {
                    customSelectManager.addCustomSelect($target);
                }
            }
            return;
        },
                reset:function($target) {
                        customSelectManager.value($target, $target.find("option:eq(0)").attr("value"));
                        customSelectManager.enable($target);
                },
                resetTabIndexes:function() {
                        $('a:visible:not(.disabled), a:visible:not(.tooltip), input:visible:not("[type=hidden]")').each(function(i) {
                                this.tabIndex = i;
                        });
                },
        _getFauxSelectFromOriginal: function($target) {
            return $("#" + $target.attr("id") + "-button");
        },
        _getOriginalFromFauxSelect: function($target) {
            return $target.prev("select");
        },
        _getOptFromTarget: function($target, value) {
            return $target.find("option[value='" + value + "']");
                },
                _setListToSelectedIndex: function() {
                        if (selectedIndex === null) {selectedIndex = 0;}
                        var $storedInstance = $(storedInstance.element);
                        var $selectedLi = $storedInstance.find("li:eq(" + selectedIndex + ")");
                        $storedInstance.find("ul").scrollTop(0);
                        $storedInstance.find("li a").removeClass("hover");
                        if ($selectedLi.length > 0) {
                                $selectedLi.find("a").addClass("hover");
                                $storedInstance.find("ul").scrollTop($selectedLi.position().top);
        }
                },
                close:function() {
                        var customSelect = this.getCustomSelect();
                        customSelect.close();
    }
        }
}();