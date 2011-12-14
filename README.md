# Flyweight jQuery Custom Select
Dual licensed under the MIT or GPL Version 2 licenses.

This plugin implements a flyweight design pattern for jQuery custom select controls. It aims to mimic standard operating system behaviour whilst remaining consistent across platofrm and browser. By only holding one visible control element in memory at one time, it aims to reduce the number of DOM accesses and event binding operations. This can result in significantly reduced page render times on larger forms. 
It borrows accessibility design patterns from the Filament Group's jQuery UI Selectmenu keyboard navigable ARIA plugin, currently included with JQuery-UI. It requires jQuery 1.4+ to run.

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
  * Javascript only 8KB compressed
  * Works in all tested major browsers (FF 3.6/5.1, Chrome 11/12/15, IE 6/7/8/9)
  * Provides Mobile Webkit and Safari experience consistent with desktop

## Todo

  * Label association
  * Rationalise WAI-ARIA roles

## Useful links

  * http://www.filamentgroup.com/lab/jquery_ui_selectmenu_an_aria_accessible_plugin_for_styling_a_html_select/
  * http://jquery.com/
  * http://jqueryui.com/
  * A live demonstration may be found at http://rayui.github.com/flyweight-jquery-custom-select/
  
## Disclaimer

This code is currently only a functional prototype and should not be considered production ready code. Please see the unstable branch for the latest commits
