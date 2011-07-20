/*!
 * hasScrollBar function
 * Copyright 2011, Pravee Prasad
 * See http://stackoverflow.com/users/183200/praveen-prasad http://stackoverflow.com/questions/2059743/detect-elements-overflow-using-jquery/2060003#2060003 
 */

$.fn.hasScrollBar = function() {
    //note: clientHeight= height of holder
    //scrollHeight= we have content till this height
    var _elm = this;
    var _hasScrollBar = false;
    if ((_elm.clientHeight < _elm.scrollHeight) || (_elm.clientWidth < _elm.scrollWidth)) {
        _hasScrollBar = true;
    }
    return _hasScrollBar;
}
 
 /*!
 * Flyweight jQuery Custom Select plugin 
 * Copyright 2011, Raymond Brooks
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
 
/*Produce modulo correctly */

Number.prototype.mod = function(n) {
	return ((this%n)+n)%n;
};

/*Initialise custom select plugin on document ready*/

$().ready(function() {
        customSelectManager.addCustomSelect($("select"));
	customSelectManager.resetTabIndexes();
});
