# Flyweight jQuery Custom Select
Dual licensed under the MIT or GPL Version 2 licenses.

This plugin implements a flyweight design pattern for jQuery custom select controls. It aims to mimic standard operating system behaviour whilst remaining consistent across platofrm and browser. By only holding one visible control element in memory at one time, it aims to reduce the number of DOM accesses and event binding operations. This can result in significantly reduced page render times on larger forms.
It borrows accessibility design patterns from the Filament Group's jQuery UI Selectmenu keyboard navigable ARIA plugin, currently included with jQuery-UI. It requires jQuery 1.4+ to run and this is the only requirement.

## Features

  * Lightweight
  * Extremely fast
  * Semantic markup
  * Fully customisable keyboard navigation
  * Fully customisable class names
  * Intelligent typeahead [REMOVED in favour of mimicking OS behaviour]
  * Option group support
  * Enable/disable
  * Graceful destroy, original select maintains state
  * Supports PIE.htc
  * Toggle hide first option element (for Please Select, etc) [REMOVED in favour of mimicking OS behaviour]
  * Togglable tabindex support (on by default)
  * Binds to original select change event
  * Javascript only 8KB compressed (2.5KB GZipped)
  * Works in all tested major browsers (FF 3.6/5.1, Chrome 11/12/15, IE 6/7/8/9)
  * Provides Mobile Webkit and Safari experience consistent with desktop

## Todo

  * Label association
  * Rationalise WAI-ARIA roles

## Settings

### alignTo

Takes a string of the selector for a jQuery object. The left offset of the drop down is recalculated based
on the parent's object left offset. The width is increased by the difference between the parent's left offset
and the placeholder's original left offset.

  $(select).flyweightCustomSelect({'alignTo': '.parent'});

## Useful links

  * http://www.filamentgroup.com/lab/jquery_ui_selectmenu_an_aria_accessible_plugin_for_styling_a_html_select/
  * http://jquery.com/
  * A live demonstration may be found at http://rayui.github.com/flyweight-jquery-custom-select/
