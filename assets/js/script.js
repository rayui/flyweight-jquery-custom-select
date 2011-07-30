/*!
* Flyweight jQuery Custom Select plugin 
* Copyright 2011, Raymond Brooks
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

/* renderer */

var render = function(e) {
	e.stopPropagation();
	e.preventDefault();
	
	var $form = $("form");
	$form.empty();
	
	var numSelects = parseInt($("#render-count").val(), 10);
	var i = numSelects;
	
	while (i--) {
		var $select = $('<select id="select" name="select' + i + '" class="select' + i + '"><option value="" selected="selected">Please select...</option><option value="MR" >Mr</option><option value="MRS" >Mrs</option><option value="MS" >Ms</option><option value="MISS" >Miss</option><option value="DRM" >Dr – Male</option><option value="DRF" >Dr – Female</option></select>');
		$form.append($select);
	}
	
	var time = new Date().getTime();
	
	$("select").flyweightCustomSelect();
	//$("select").selectmenu();
	
	time = new Date().getTime() - time;
	
	$("form").prepend("<div><span>Time to render " + numSelects + " custom selects: " + time + " ms</span><span>Average time per select: " + parseInt((time / numSelects), 10) + " ms</span></div>");
};

/*Initialise custom select plugin test on document ready*/

$().ready(function() {
	$("#render-flyweight").bind("click", render);
});
