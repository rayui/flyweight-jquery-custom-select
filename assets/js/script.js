/*!
 * Flyweight jQuery Custom Select plugin 
 * Copyright 2009 csharptest.net
 * http://stackoverflow.com/questions/1349404/generate-a-string-of-5-random-characters-in-javascript
 */

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ ) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

/*!
 * Flyweight jQuery Custom Select plugin 
 * Copyright 2011, Raymond Brooks
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

/* renderer */

var addselect = function(e) {
	var numSelects = parseInt($("#count").val(), 10),
		$form = $("form"),
		i, j, numItems,
		selectHTML,
		randomString;
	
	e.stopPropagation();
	e.preventDefault();
	
	$form.empty();
	
	for(i = numSelects - 1; i >= 0; i--) {
		selectHTML = '<select id="select-' + i + '" name="select-' + i + '" class="select' + i + '" tabindex="' + (numSelects - i) + '"><option value="' + i + '" selected="selected">fwselect-' + i + '</option>';
		selectHTML += '<optgroup label="' + makeid() + '">';
		
		numItems = parseInt(Math.random() * 10, 10);
		
		for (j = 0; j <= numItems; j++) {
			randomString = makeid();
			selectHTML += '<option value="' + randomString.toUpperCase() + '">' + randomString + '</option>';
		}
		
		selectHTML += '</optgroup><optgroup label="' + makeid() + '">';
		
		numItems = parseInt(Math.random() * 10, 10);
		
		for (j = 0; j <= numItems; j++) {
			randomString = makeid();
			selectHTML += '<option value="' + randomString.toUpperCase() + '">' + randomString + '</option>';
		}
		
		selectHTML += '</optgroup>';
		
		$form.append(selectHTML + '</select>');
	}	
}

var apply = function(e) {
	var numSelects = parseInt($("#count").val(), 10),
		$form = $("form"),
		time,
		options = null;
	
	time = new Date().getTime();
	
	$("select").flyweightCustomSelect(options);
	
	time = new Date().getTime() - time;
	
	$("#time").html("<div><span>Time to render " + numSelects + " custom selects: " + time + " ms</span><span>Average time per select: " + parseInt((time / numSelects), 10) + " ms</span></div>");
};

var destroy = function(e) {
	$("select").flyweightCustomSelect('destroy');
};

var enable = function(e) {
	$("select").flyweightCustomSelect('enable');
};

var disable = function(e) {
	$("select").flyweightCustomSelect('disable');
};

/*Initialise custom select plugin test on document ready*/

$().ready(function() {
	$("#addselect").bind("click", addselect);
	$("#apply").bind("click", apply);
	$("#destroy").bind("click", destroy);
	$("#enable").bind("click", enable);
	$("#disable").bind("click", disable);
	$("#addselect").trigger('click');
	$("#apply").trigger('click');
});
