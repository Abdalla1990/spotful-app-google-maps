//
// jQuery MiniColors: A tiny color picker built on jQuery
//
// Developed by Cory LaViska for A Beautiful Site, LLC
//
// Licensed under the MIT license: http://opensource.org/licenses/MIT
//
(function (factory) {
  if(typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if(typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function ($) {
  'use strict';

  // Defaults
  $.minicolors = {
    defaults: {
      animationSpeed: 50,
      animationEasing: 'swing',
      change: null,
      changeDelay: 0,
      control: 'hue',
      defaultValue: '',
      format: 'hex',
      hide: null,
      hideSpeed: 100,
      inline: false,
      keywords: '',
      letterCase: 'lowercase',
      opacity: false,
      position: 'bottom left',
      show: null,
      showSpeed: 100,
      theme: 'default',
      swatches: []
    }
  };

  // Public methods
  $.extend($.fn, {
    minicolors: function(method, data) {

      switch(method) {
      // Destroy the control
      case 'destroy':
        $(this).each(function() {
          destroy($(this));
        });
        return $(this);

      // Hide the color picker
      case 'hide':
        hide();
        return $(this);

      // Get/set opacity
      case 'opacity':
        // Getter
        if(data === undefined) {
          // Getter
          return $(this).attr('data-opacity');
        } else {
          // Setter
          $(this).each(function() {
            updateFromInput($(this).attr('data-opacity', data));
          });
        }
        return $(this);

      // Get an RGB(A) object based on the current color/opacity
      case 'rgbObject':
        return rgbObject($(this), method === 'rgbaObject');

      // Get an RGB(A) string based on the current color/opacity
      case 'rgbString':
      case 'rgbaString':
        return rgbString($(this), method === 'rgbaString');

      // Get/set settings on the fly
      case 'settings':
        if(data === undefined) {
          return $(this).data('minicolors-settings');
        } else {
          // Setter
          $(this).each(function() {
            var settings = $(this).data('minicolors-settings') || {};
            destroy($(this));
            $(this).minicolors($.extend(true, settings, data));
          });
        }
        return $(this);

      // Show the color picker
      case 'show':
        show($(this).eq(0));
        return $(this);

      // Get/set the hex color value
      case 'value':
        if(data === undefined) {
          // Getter
          return $(this).val();
        } else {
          // Setter
          $(this).each(function() {
            if(typeof(data) === 'object' && data !== 'null') {
              if(data.opacity) {
                $(this).attr('data-opacity', keepWithin(data.opacity, 0, 1));
              }
              if(data.color) {
                $(this).val(data.color);
              }
            } else {
              $(this).val(data);
            }
            updateFromInput($(this));
          });
        }
        return $(this);

      // Initializes the control
      default:
        if(method !== 'create') data = method;
        $(this).each(function() {
          init($(this), data);
        });
        return $(this);

      }

    }
  });

  // Initialize input elements
  function init(input, settings) {
    var minicolors = $('<div class="minicolors" />');
    var defaults = $.minicolors.defaults;
    var size;
    var swatches;
    var swatch;
    var panel;
    var i;

    // Do nothing if already initialized
    if(input.data('minicolors-initialized')) return;

    // Handle settings
    settings = $.extend(true, {}, defaults, settings);

    // The wrapper
    minicolors
    .addClass('minicolors-theme-' + settings.theme)
    .toggleClass('minicolors-with-opacity', settings.opacity);

    // Custom positioning
    if(settings.position !== undefined) {
      $.each(settings.position.split(' '), function() {
        minicolors.addClass('minicolors-position-' + this);
      });
    }

    // Input size
    if(settings.format === 'rgb') {
      size = settings.opacity ? '25' : '20';
    } else {
      size = settings.keywords ? '11' : '7';
    }

    // The input
    input
    .addClass('minicolors-input')
    .data('minicolors-initialized', false)
    .data('minicolors-settings', settings)
    .prop('size', size)
    .wrap(minicolors)
    .after(
      '<div class="minicolors-panel minicolors-slider-' + settings.control + '">' +
      '<div class="minicolors-slider minicolors-sprite">' +
      '<div class="minicolors-picker"></div>' +
      '</div>' +
      '<div class="minicolors-opacity-slider minicolors-sprite">' +
      '<div class="minicolors-picker"></div>' +
      '</div>' +
      '<div class="minicolors-grid minicolors-sprite">' +
      '<div class="minicolors-grid-inner"></div>' +
      '<div class="minicolors-picker"><div></div></div>' +
      '</div>' +
      '</div>'
    );

    // The swatch
    if(!settings.inline) {
      input.after('<span class="minicolors-swatch minicolors-sprite minicolors-input-swatch"><span class="minicolors-swatch-color"></span></span>');
      input.next('.minicolors-input-swatch').on('click', function(event) {
        event.preventDefault();
        input.focus();
      });
    }

    // Prevent text selection in IE
    panel = input.parent().find('.minicolors-panel');
    panel.on('selectstart', function() { return false; }).end();

    // Swatches
    if(settings.swatches && settings.swatches.length !== 0) {
      panel.addClass('minicolors-with-swatches');
      swatches = $('<ul class="minicolors-swatches"></ul>')
      .appendTo(panel);
      for(i = 0; i < settings.swatches.length; ++i) {
        swatch = settings.swatches[i];
        swatch = isRgb(swatch) ? parseRgb(swatch, true) : hex2rgb(parseHex(swatch, true));
        $('<li class="minicolors-swatch minicolors-sprite"><span class="minicolors-swatch-color"></span></li>')
        .appendTo(swatches)
        .data('swatch-color', settings.swatches[i])
        .find('.minicolors-swatch-color')
        .css({
          backgroundColor: rgb2hex(swatch),
          opacity: swatch.a
        });
        settings.swatches[i] = swatch;
      }
    }

    // Inline controls
    if(settings.inline) input.parent().addClass('minicolors-inline');

    updateFromInput(input, false);

    input.data('minicolors-initialized', true);
  }

  // Returns the input back to its original state
  function destroy(input) {
    var minicolors = input.parent();

    // Revert the input element
    input
      .removeData('minicolors-initialized')
      .removeData('minicolors-settings')
      .removeProp('size')
      .removeClass('minicolors-input');

    // Remove the wrap and destroy whatever remains
    minicolors.before(input).remove();
  }

  // Shows the specified dropdown panel
  function show(input) {
    var minicolors = input.parent();
    var panel = minicolors.find('.minicolors-panel');
    var settings = input.data('minicolors-settings');

    // Do nothing if uninitialized, disabled, inline, or already open
    if(
      !input.data('minicolors-initialized') ||
      input.prop('disabled') ||
      minicolors.hasClass('minicolors-inline') ||
      minicolors.hasClass('minicolors-focus')
    ) return;

    hide();

    minicolors.addClass('minicolors-focus');
    panel
    .stop(true, true)
    .fadeIn(settings.showSpeed, function() {
      if(settings.show) settings.show.call(input.get(0));
    });
  }

  // Hides all dropdown panels
  function hide() {
    $('.minicolors-focus').each(function() {
      var minicolors = $(this);
      var input = minicolors.find('.minicolors-input');
      var panel = minicolors.find('.minicolors-panel');
      var settings = input.data('minicolors-settings');

      panel.fadeOut(settings.hideSpeed, function() {
        if(settings.hide) settings.hide.call(input.get(0));
        minicolors.removeClass('minicolors-focus');
      });

    });
  }

  // Moves the selected picker
  function move(target, event, animate) {
    var input = target.parents('.minicolors').find('.minicolors-input');
    var settings = input.data('minicolors-settings');
    var picker = target.find('[class$=-picker]');
    var offsetX = target.offset().left;
    var offsetY = target.offset().top;
    var x = Math.round(event.pageX - offsetX);
    var y = Math.round(event.pageY - offsetY);
    var duration = animate ? settings.animationSpeed : 0;
    var wx, wy, r, phi;

    // Touch support
    if(event.originalEvent.changedTouches) {
      x = event.originalEvent.changedTouches[0].pageX - offsetX;
      y = event.originalEvent.changedTouches[0].pageY - offsetY;
    }

    // Constrain picker to its container
    if(x < 0) x = 0;
    if(y < 0) y = 0;
    if(x > target.width()) x = target.width();
    if(y > target.height()) y = target.height();

    // Constrain color wheel values to the wheel
    if(target.parent().is('.minicolors-slider-wheel') && picker.parent().is('.minicolors-grid')) {
      wx = 75 - x;
      wy = 75 - y;
      r = Math.sqrt(wx * wx + wy * wy);
      phi = Math.atan2(wy, wx);
      if(phi < 0) phi += Math.PI * 2;
      if(r > 75) {
        r = 75;
        x = 75 - (75 * Math.cos(phi));
        y = 75 - (75 * Math.sin(phi));
      }
      x = Math.round(x);
      y = Math.round(y);
    }

    // Move the picker
    if(target.is('.minicolors-grid')) {
      picker
      .stop(true)
      .animate({
        top: y + 'px',
        left: x + 'px'
      }, duration, settings.animationEasing, function() {
        updateFromControl(input, target);
      });
    } else {
      picker
      .stop(true)
      .animate({
        top: y + 'px'
      }, duration, settings.animationEasing, function() {
        updateFromControl(input, target);
      });
    }
  }

  // Sets the input based on the color picker values
  function updateFromControl(input, target) {

    function getCoords(picker, container) {
      var left, top;
      if(!picker.length || !container) return null;
      left = picker.offset().left;
      top = picker.offset().top;

      return {
        x: left - container.offset().left + (picker.outerWidth() / 2),
        y: top - container.offset().top + (picker.outerHeight() / 2)
      };
    }

    var hue, saturation, brightness, x, y, r, phi;
    var hex = input.val();
    var opacity = input.attr('data-opacity');

    // Helpful references
    var minicolors = input.parent();
    var settings = input.data('minicolors-settings');
    var swatch = minicolors.find('.minicolors-input-swatch');

    // Panel objects
    var grid = minicolors.find('.minicolors-grid');
    var slider = minicolors.find('.minicolors-slider');
    var opacitySlider = minicolors.find('.minicolors-opacity-slider');

    // Picker objects
    var gridPicker = grid.find('[class$=-picker]');
    var sliderPicker = slider.find('[class$=-picker]');
    var opacityPicker = opacitySlider.find('[class$=-picker]');

    // Picker positions
    var gridPos = getCoords(gridPicker, grid);
    var sliderPos = getCoords(sliderPicker, slider);
    var opacityPos = getCoords(opacityPicker, opacitySlider);

    // Handle colors
    if(target.is('.minicolors-grid, .minicolors-slider, .minicolors-opacity-slider')) {

      // Determine HSB values
      switch(settings.control) {
      case 'wheel':
        // Calculate hue, saturation, and brightness
        x = (grid.width() / 2) - gridPos.x;
        y = (grid.height() / 2) - gridPos.y;
        r = Math.sqrt(x * x + y * y);
        phi = Math.atan2(y, x);
        if(phi < 0) phi += Math.PI * 2;
        if(r > 75) {
          r = 75;
          gridPos.x = 69 - (75 * Math.cos(phi));
          gridPos.y = 69 - (75 * Math.sin(phi));
        }
        saturation = keepWithin(r / 0.75, 0, 100);
        hue = keepWithin(phi * 180 / Math.PI, 0, 360);
        brightness = keepWithin(100 - Math.floor(sliderPos.y * (100 / slider.height())), 0, 100);
        hex = hsb2hex({
          h: hue,
          s: saturation,
          b: brightness
        });

        // Update UI
        slider.css('backgroundColor', hsb2hex({ h: hue, s: saturation, b: 100 }));
        break;

      case 'saturation':
        // Calculate hue, saturation, and brightness
        hue = keepWithin(parseInt(gridPos.x * (360 / grid.width()), 10), 0, 360);
        saturation = keepWithin(100 - Math.floor(sliderPos.y * (100 / slider.height())), 0, 100);
        brightness = keepWithin(100 - Math.floor(gridPos.y * (100 / grid.height())), 0, 100);
        hex = hsb2hex({
          h: hue,
          s: saturation,
          b: brightness
        });

        // Update UI
        slider.css('backgroundColor', hsb2hex({ h: hue, s: 100, b: brightness }));
        minicolors.find('.minicolors-grid-inner').css('opacity', saturation / 100);
        break;

      case 'brightness':
        // Calculate hue, saturation, and brightness
        hue = keepWithin(parseInt(gridPos.x * (360 / grid.width()), 10), 0, 360);
        saturation = keepWithin(100 - Math.floor(gridPos.y * (100 / grid.height())), 0, 100);
        brightness = keepWithin(100 - Math.floor(sliderPos.y * (100 / slider.height())), 0, 100);
        hex = hsb2hex({
          h: hue,
          s: saturation,
          b: brightness
        });

        // Update UI
        slider.css('backgroundColor', hsb2hex({ h: hue, s: saturation, b: 100 }));
        minicolors.find('.minicolors-grid-inner').css('opacity', 1 - (brightness / 100));
        break;

      default:
        // Calculate hue, saturation, and brightness
        hue = keepWithin(360 - parseInt(sliderPos.y * (360 / slider.height()), 10), 0, 360);
        saturation = keepWithin(Math.floor(gridPos.x * (100 / grid.width())), 0, 100);
        brightness = keepWithin(100 - Math.floor(gridPos.y * (100 / grid.height())), 0, 100);
        hex = hsb2hex({
          h: hue,
          s: saturation,
          b: brightness
        });

        // Update UI
        grid.css('backgroundColor', hsb2hex({ h: hue, s: 100, b: 100 }));
        break;
      }

      // Handle opacity
      if(settings.opacity) {
        opacity = parseFloat(1 - (opacityPos.y / opacitySlider.height())).toFixed(2);
      } else {
        opacity = 1;
      }

      updateInput(input, hex, opacity);
    }
    else {
      // Set swatch color
      swatch.find('span').css({
        backgroundColor: hex,
        opacity: opacity
      });

      // Handle change event
      doChange(input, hex, opacity);
    }
  }

  // Sets the value of the input and does the appropriate conversions
  // to respect settings, also updates the swatch
  function updateInput(input, value, opacity) {
    var rgb;

    // Helpful references
    var minicolors = input.parent();
    var settings = input.data('minicolors-settings');
    var swatch = minicolors.find('.minicolors-input-swatch');

    if(settings.opacity) input.attr('data-opacity', opacity);

    // Set color string
    if(settings.format === 'rgb') {
      // Returns RGB(A) string

      // Checks for input format and does the conversion
      if(isRgb(value)) {
        rgb = parseRgb(value, true);
      }
      else {
        rgb = hex2rgb(parseHex(value, true));
      }

      opacity = input.attr('data-opacity') === '' ? 1 : keepWithin(parseFloat(input.attr('data-opacity')).toFixed(2), 0, 1);
      if(isNaN(opacity) || !settings.opacity) opacity = 1;

      if(input.minicolors('rgbObject').a <= 1 && rgb && settings.opacity) {
        // Set RGBA string if alpha
        value = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + parseFloat(opacity) + ')';
      } else {
        // Set RGB string (alpha = 1)
        value = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
      }
    } else {
      // Returns hex color

      // Checks for input format and does the conversion
      if(isRgb(value)) {
        value = rgbString2hex(value);
      }

      value = convertCase(value, settings.letterCase);
    }

    // Update value from picker
    input.val(value);

    // Set swatch color
    swatch.find('span').css({
      backgroundColor: value,
      opacity: opacity
    });

    // Handle change event
    doChange(input, value, opacity);
  }

  // Sets the color picker values from the input
  function updateFromInput(input, preserveInputValue) {
    var hex, hsb, opacity, keywords, alpha, value, x, y, r, phi;

    // Helpful references
    var minicolors = input.parent();
    var settings = input.data('minicolors-settings');
    var swatch = minicolors.find('.minicolors-input-swatch');

    // Panel objects
    var grid = minicolors.find('.minicolors-grid');
    var slider = minicolors.find('.minicolors-slider');
    var opacitySlider = minicolors.find('.minicolors-opacity-slider');

    // Picker objects
    var gridPicker = grid.find('[class$=-picker]');
    var sliderPicker = slider.find('[class$=-picker]');
    var opacityPicker = opacitySlider.find('[class$=-picker]');

    // Determine hex/HSB values
    if(isRgb(input.val())) {
      // If input value is a rgb(a) string, convert it to hex color and update opacity
      hex = rgbString2hex(input.val());
      alpha = keepWithin(parseFloat(getAlpha(input.val())).toFixed(2), 0, 1);
      if(alpha) {
        input.attr('data-opacity', alpha);
      }
    } else {
      hex = convertCase(parseHex(input.val(), true), settings.letterCase);
    }

    if(!hex){
      hex = convertCase(parseInput(settings.defaultValue, true), settings.letterCase);
    }
    hsb = hex2hsb(hex);

    // Get array of lowercase keywords
    keywords = !settings.keywords ? [] : $.map(settings.keywords.split(','), function(a) {
      return $.trim(a.toLowerCase());
    });

    // Set color string
    if(input.val() !== '' && $.inArray(input.val().toLowerCase(), keywords) > -1) {
      value = convertCase(input.val());
    } else {
      value = isRgb(input.val()) ? parseRgb(input.val()) : hex;
    }

    // Update input value
    if(!preserveInputValue) input.val(value);

    // Determine opacity value
    if(settings.opacity) {
      // Get from data-opacity attribute and keep within 0-1 range
      opacity = input.attr('data-opacity') === '' ? 1 : keepWithin(parseFloat(input.attr('data-opacity')).toFixed(2), 0, 1);
      if(isNaN(opacity)) opacity = 1;
      input.attr('data-opacity', opacity);
      swatch.find('span').css('opacity', opacity);

      // Set opacity picker position
      y = keepWithin(opacitySlider.height() - (opacitySlider.height() * opacity), 0, opacitySlider.height());
      opacityPicker.css('top', y + 'px');
    }

    // Set opacity to zero if input value is transparent
    if(input.val().toLowerCase() === 'transparent') {
      swatch.find('span').css('opacity', 0);
    }

    // Update swatch
    swatch.find('span').css('backgroundColor', hex);

    // Determine picker locations
    switch(settings.control) {
    case 'wheel':
      // Set grid position
      r = keepWithin(Math.ceil(hsb.s * 0.75), 0, grid.height() / 2);
      phi = hsb.h * Math.PI / 180;
      x = keepWithin(75 - Math.cos(phi) * r, 0, grid.width());
      y = keepWithin(75 - Math.sin(phi) * r, 0, grid.height());
      gridPicker.css({
        top: y + 'px',
        left: x + 'px'
      });

      // Set slider position
      y = 150 - (hsb.b / (100 / grid.height()));
      if(hex === '') y = 0;
      sliderPicker.css('top', y + 'px');

      // Update panel color
      slider.css('backgroundColor', hsb2hex({ h: hsb.h, s: hsb.s, b: 100 }));
      break;

    case 'saturation':
      // Set grid position
      x = keepWithin((5 * hsb.h) / 12, 0, 150);
      y = keepWithin(grid.height() - Math.ceil(hsb.b / (100 / grid.height())), 0, grid.height());
      gridPicker.css({
        top: y + 'px',
        left: x + 'px'
      });

      // Set slider position
      y = keepWithin(slider.height() - (hsb.s * (slider.height() / 100)), 0, slider.height());
      sliderPicker.css('top', y + 'px');

      // Update UI
      slider.css('backgroundColor', hsb2hex({ h: hsb.h, s: 100, b: hsb.b }));
      minicolors.find('.minicolors-grid-inner').css('opacity', hsb.s / 100);
      break;

    case 'brightness':
      // Set grid position
      x = keepWithin((5 * hsb.h) / 12, 0, 150);
      y = keepWithin(grid.height() - Math.ceil(hsb.s / (100 / grid.height())), 0, grid.height());
      gridPicker.css({
        top: y + 'px',
        left: x + 'px'
      });

      // Set slider position
      y = keepWithin(slider.height() - (hsb.b * (slider.height() / 100)), 0, slider.height());
      sliderPicker.css('top', y + 'px');

      // Update UI
      slider.css('backgroundColor', hsb2hex({ h: hsb.h, s: hsb.s, b: 100 }));
      minicolors.find('.minicolors-grid-inner').css('opacity', 1 - (hsb.b / 100));
      break;

    default:
      // Set grid position
      x = keepWithin(Math.ceil(hsb.s / (100 / grid.width())), 0, grid.width());
      y = keepWithin(grid.height() - Math.ceil(hsb.b / (100 / grid.height())), 0, grid.height());
      gridPicker.css({
        top: y + 'px',
        left: x + 'px'
      });

      // Set slider position
      y = keepWithin(slider.height() - (hsb.h / (360 / slider.height())), 0, slider.height());
      sliderPicker.css('top', y + 'px');

      // Update panel color
      grid.css('backgroundColor', hsb2hex({ h: hsb.h, s: 100, b: 100 }));
      break;
    }

    // Fire change event, but only if minicolors is fully initialized
    if(input.data('minicolors-initialized')) {
      doChange(input, value, opacity);
    }
  }

  // Runs the change and changeDelay callbacks
  function doChange(input, value, opacity) {
    var settings = input.data('minicolors-settings');
    var lastChange = input.data('minicolors-lastChange');
    var obj, sel, i;

    // Only run if it actually changed
    if(!lastChange || lastChange.value !== value || lastChange.opacity !== opacity) {

      // Remember last-changed value
      input.data('minicolors-lastChange', {
        value: value,
        opacity: opacity
      });

      // Check and select applicable swatch
      if(settings.swatches && settings.swatches.length !== 0) {
        if(!isRgb(value)) {
          obj = hex2rgb(value);
        }
        else {
          obj = parseRgb(value, true);
        }
        sel = -1;
        for(i = 0; i < settings.swatches.length; ++i) {
          if(obj.r === settings.swatches[i].r && obj.g === settings.swatches[i].g && obj.b === settings.swatches[i].b && obj.a === settings.swatches[i].a) {
            sel = i;
            break;
          }
        }

        input.parent().find('.minicolors-swatches .minicolors-swatch').removeClass('selected');
        if(sel !== -1) {
          input.parent().find('.minicolors-swatches .minicolors-swatch').eq(i).addClass('selected');
        }
      }

      // Fire change event
      if(settings.change) {
        if(settings.changeDelay) {
          // Call after a delay
          clearTimeout(input.data('minicolors-changeTimeout'));
          input.data('minicolors-changeTimeout', setTimeout(function() {
            settings.change.call(input.get(0), value, opacity);
          }, settings.changeDelay));
        } else {
          // Call immediately
          settings.change.call(input.get(0), value, opacity);
        }
      }
      input.trigger('change').trigger('input');
    }
  }

  // Generates an RGB(A) object based on the input's value
  function rgbObject(input) {
    var rgb,
      opacity = $(input).attr('data-opacity');
    if( isRgb($(input).val()) ) {
      rgb = parseRgb($(input).val(), true);
    } else {
      var hex = parseHex($(input).val(), true);
      rgb = hex2rgb(hex);
    }
    if( !rgb ) return null;
    if( opacity !== undefined ) $.extend(rgb, { a: parseFloat(opacity) });
    return rgb;
  }

  // Generates an RGB(A) string based on the input's value
  function rgbString(input, alpha) {
    var rgb,
      opacity = $(input).attr('data-opacity');
    if( isRgb($(input).val()) ) {
      rgb = parseRgb($(input).val(), true);
    } else {
      var hex = parseHex($(input).val(), true);
      rgb = hex2rgb(hex);
    }
    if( !rgb ) return null;
    if( opacity === undefined ) opacity = 1;
    if( alpha ) {
      return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + parseFloat(opacity) + ')';
    } else {
      return 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
    }
  }

  // Converts to the letter case specified in settings
  function convertCase(string, letterCase) {
    return letterCase === 'uppercase' ? string.toUpperCase() : string.toLowerCase();
  }

  // Parses a string and returns a valid hex string when possible
  function parseHex(string, expand) {
    string = string.replace(/^#/g, '');
    if(!string.match(/^[A-F0-9]{3,6}/ig)) return '';
    if(string.length !== 3 && string.length !== 6) return '';
    if(string.length === 3 && expand) {
      string = string[0] + string[0] + string[1] + string[1] + string[2] + string[2];
    }
    return '#' + string;
  }

  // Parses a string and returns a valid RGB(A) string when possible
  function parseRgb(string, obj) {
    var values = string.replace(/[^\d,.]/g, '');
    var rgba = values.split(',');

    rgba[0] = keepWithin(parseInt(rgba[0], 10), 0, 255);
    rgba[1] = keepWithin(parseInt(rgba[1], 10), 0, 255);
    rgba[2] = keepWithin(parseInt(rgba[2], 10), 0, 255);
    if(rgba[3]) {
      rgba[3] = keepWithin(parseFloat(rgba[3], 10), 0, 1);
    }

    // Return RGBA object
    if( obj ) {
      if (rgba[3]) {
        return {
          r: rgba[0],
          g: rgba[1],
          b: rgba[2],
          a: rgba[3]
        };
      } else {
        return {
          r: rgba[0],
          g: rgba[1],
          b: rgba[2]
        };
      }
    }

    // Return RGBA string
    if(typeof(rgba[3]) !== 'undefined' && rgba[3] <= 1) {
      return 'rgba(' + rgba[0] + ', ' + rgba[1] + ', ' + rgba[2] + ', ' + rgba[3] + ')';
    } else {
      return 'rgb(' + rgba[0] + ', ' + rgba[1] + ', ' + rgba[2] + ')';
    }

  }

  // Parses a string and returns a valid color string when possible
  function parseInput(string, expand) {
    if(isRgb(string)) {
      // Returns a valid rgb(a) string
      return parseRgb(string);
    } else {
      return parseHex(string, expand);
    }
  }

  // Keeps value within min and max
  function keepWithin(value, min, max) {
    if(value < min) value = min;
    if(value > max) value = max;
    return value;
  }

  // Checks if a string is a valid RGB(A) string
  function isRgb(string) {
    var rgb = string.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? true : false;
  }

  // Function to get alpha from a RGB(A) string
  function getAlpha(rgba) {
    rgba = rgba.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+(\.\d{1,2})?|\.\d{1,2})[\s+]?/i);
    return (rgba && rgba.length === 6) ? rgba[4] : '1';
  }

  // Converts an HSB object to an RGB object
  function hsb2rgb(hsb) {
    var rgb = {};
    var h = Math.round(hsb.h);
    var s = Math.round(hsb.s * 255 / 100);
    var v = Math.round(hsb.b * 255 / 100);
    if(s === 0) {
      rgb.r = rgb.g = rgb.b = v;
    } else {
      var t1 = v;
      var t2 = (255 - s) * v / 255;
      var t3 = (t1 - t2) * (h % 60) / 60;
      if(h === 360) h = 0;
      if(h < 60) { rgb.r = t1; rgb.b = t2; rgb.g = t2 + t3; }
      else if(h < 120) {rgb.g = t1; rgb.b = t2; rgb.r = t1 - t3; }
      else if(h < 180) {rgb.g = t1; rgb.r = t2; rgb.b = t2 + t3; }
      else if(h < 240) {rgb.b = t1; rgb.r = t2; rgb.g = t1 - t3; }
      else if(h < 300) {rgb.b = t1; rgb.g = t2; rgb.r = t2 + t3; }
      else if(h < 360) {rgb.r = t1; rgb.g = t2; rgb.b = t1 - t3; }
      else { rgb.r = 0; rgb.g = 0; rgb.b = 0; }
    }
    return {
      r: Math.round(rgb.r),
      g: Math.round(rgb.g),
      b: Math.round(rgb.b)
    };
  }

  // Converts an RGB string to a hex string
  function rgbString2hex(rgb){
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? '#' +
    ('0' + parseInt(rgb[1],10).toString(16)).slice(-2) +
    ('0' + parseInt(rgb[2],10).toString(16)).slice(-2) +
    ('0' + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
  }

  // Converts an RGB object to a hex string
  function rgb2hex(rgb) {
    var hex = [
      rgb.r.toString(16),
      rgb.g.toString(16),
      rgb.b.toString(16)
    ];
    $.each(hex, function(nr, val) {
      if(val.length === 1) hex[nr] = '0' + val;
    });
    return '#' + hex.join('');
  }

  // Converts an HSB object to a hex string
  function hsb2hex(hsb) {
    return rgb2hex(hsb2rgb(hsb));
  }

  // Converts a hex string to an HSB object
  function hex2hsb(hex) {
    var hsb = rgb2hsb(hex2rgb(hex));
    if(hsb.s === 0) hsb.h = 360;
    return hsb;
  }

  // Converts an RGB object to an HSB object
  function rgb2hsb(rgb) {
    var hsb = { h: 0, s: 0, b: 0 };
    var min = Math.min(rgb.r, rgb.g, rgb.b);
    var max = Math.max(rgb.r, rgb.g, rgb.b);
    var delta = max - min;
    hsb.b = max;
    hsb.s = max !== 0 ? 255 * delta / max : 0;
    if(hsb.s !== 0) {
      if(rgb.r === max) {
        hsb.h = (rgb.g - rgb.b) / delta;
      } else if(rgb.g === max) {
        hsb.h = 2 + (rgb.b - rgb.r) / delta;
      } else {
        hsb.h = 4 + (rgb.r - rgb.g) / delta;
      }
    } else {
      hsb.h = -1;
    }
    hsb.h *= 60;
    if(hsb.h < 0) {
      hsb.h += 360;
    }
    hsb.s *= 100/255;
    hsb.b *= 100/255;
    return hsb;
  }

  // Converts a hex string to an RGB object
  function hex2rgb(hex) {
    hex = parseInt(((hex.indexOf('#') > -1) ? hex.substring(1) : hex), 16);
    return {
      r: hex >> 16,
      g: (hex & 0x00FF00) >> 8,
      b: (hex & 0x0000FF)
    };
  }

  // Handle events
  $([document, top.document])
    // Hide on clicks outside of the control
    .on('mousedown.minicolors touchstart.minicolors', function(event) {
      if(!$(event.target).parents().add(event.target).hasClass('minicolors')) {
        hide();
      }
    })
    // Start moving
    .on('mousedown.minicolors touchstart.minicolors', '.minicolors-grid, .minicolors-slider, .minicolors-opacity-slider', function(event) {
      var target = $(this);
      event.preventDefault();
      $(event.delegateTarget).data('minicolors-target', target);
      move(target, event, true);
    })
    // Move pickers
    .on('mousemove.minicolors touchmove.minicolors', function(event) {
      var target = $(event.delegateTarget).data('minicolors-target');
      if(target) move(target, event);
    })
    // Stop moving
    .on('mouseup.minicolors touchend.minicolors', function() {
      $(this).removeData('minicolors-target');
    })
    // Selected a swatch
    .on('click.minicolors', '.minicolors-swatches li', function(event) {
      event.preventDefault();
      var target = $(this), input = target.parents('.minicolors').find('.minicolors-input'), color = target.data('swatch-color');
      updateInput(input, color, getAlpha(color));
      updateFromInput(input);
    })
    // Show panel when swatch is clicked
    .on('mousedown.minicolors touchstart.minicolors', '.minicolors-input-swatch', function(event) {
      var input = $(this).parent().find('.minicolors-input');
      event.preventDefault();
      show(input);
    })
    // Show on focus
    .on('focus.minicolors', '.minicolors-input', function() {
      var input = $(this);
      if(!input.data('minicolors-initialized')) return;
      show(input);
    })
    // Update value on blur
    .on('blur.minicolors', '.minicolors-input', function() {
      var input = $(this);
      var settings = input.data('minicolors-settings');
      var keywords;
      var hex;
      var rgba;
      var swatchOpacity;
      var value;

      if(!input.data('minicolors-initialized')) return;

      // Get array of lowercase keywords
      keywords = !settings.keywords ? [] : $.map(settings.keywords.split(','), function(a) {
        return $.trim(a.toLowerCase());
      });

      // Set color string
      if(input.val() !== '' && $.inArray(input.val().toLowerCase(), keywords) > -1) {
        value = input.val();
      } else {
        // Get RGBA values for easy conversion
        if(isRgb(input.val())) {
          rgba = parseRgb(input.val(), true);
        } else {
          hex = parseHex(input.val(), true);
          rgba = hex ? hex2rgb(hex) : null;
        }

        // Convert to format
        if(rgba === null) {
          value = settings.defaultValue;
        } else if(settings.format === 'rgb') {
          value = settings.opacity ?
          parseRgb('rgba(' + rgba.r + ',' + rgba.g + ',' + rgba.b + ',' + input.attr('data-opacity') + ')') :
          parseRgb('rgb(' + rgba.r + ',' + rgba.g + ',' + rgba.b + ')');
        } else {
          value = rgb2hex(rgba);
        }
      }

      // Update swatch opacity
      swatchOpacity = settings.opacity ? input.attr('data-opacity') : 1;
      if(value.toLowerCase() === 'transparent') swatchOpacity = 0;
      input
      .closest('.minicolors')
      .find('.minicolors-input-swatch > span')
      .css('opacity', swatchOpacity);

      // Set input value
      input.val(value);

      // Is it blank?
      if(input.val() === '') input.val(parseInput(settings.defaultValue, true));

      // Adjust case
      input.val(convertCase(input.val(), settings.letterCase));

    })
    // Handle keypresses
    .on('keydown.minicolors', '.minicolors-input', function(event) {
      var input = $(this);
      if(!input.data('minicolors-initialized')) return;
      switch(event.keyCode) {
      case 9: // tab
        hide();
        break;
      case 13: // enter
      case 27: // esc
        hide();
        input.blur();
        break;
      }
    })
    // Update on keyup
    .on('keyup.minicolors', '.minicolors-input', function() {
      var input = $(this);
      if(!input.data('minicolors-initialized')) return;
      updateFromInput(input, true);
    })
    // Update on paste
    .on('paste.minicolors', '.minicolors-input', function() {
      var input = $(this);
      if(!input.data('minicolors-initialized')) return;
      setTimeout(function() {
        updateFromInput(input, true);
      }, 1);
    });
}));

/**! hopscotch - v0.2.8
*
* Copyright 2017 LinkedIn Corp. All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
(function(context, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory();
  } else {
    var namespace = 'hopscotch';
    // Browser globals
    if (context[namespace]) {
      // Hopscotch already exists.
      return;
    }
    context[namespace] = factory();
  }
}(this, (function() {
  var Hopscotch,
      HopscotchBubble,
      HopscotchCalloutManager,
      HopscotchI18N,
      customI18N,
      customRenderer,
      customEscape,
      templateToUse = 'bubble_default',
      Sizzle = window.Sizzle || null,
      utils,
      callbacks,
      helpers,
      winLoadHandler,
      defaultOpts,
      winHopscotch,
      undefinedStr      = 'undefined',
      waitingToStart    = false, // is a tour waiting for the document to finish
                                 // loading so that it can start?
      hasJquery         = (typeof jQuery !== undefinedStr),
      hasSessionStorage = false,
      isStorageWritable = false,
      document          = window.document,
      validIdRegEx      = /^[a-zA-Z]+[a-zA-Z0-9_-]*$/,
      rtlMatches        = {
        left: 'right',
        right: 'left'
      };

  // If cookies are disabled, accessing sessionStorage can throw an error.
  // sessionStorage could also throw an error in Safari on write (even though it exists).
  // So, we'll try writing to sessionStorage to verify it's available.
  try {
    if(typeof window.sessionStorage !== undefinedStr){
      hasSessionStorage = true;
      sessionStorage.setItem('hopscotch.test.storage', 'ok');
      sessionStorage.removeItem('hopscotch.test.storage');
      isStorageWritable = true;
    }
  } catch (err) {}

  defaultOpts       = {
    smoothScroll:    true,
    scrollDuration:  1000,
    scrollTopMargin: 200,
    showCloseButton: true,
    showPrevButton:  false,
    showNextButton:  true,
    bubbleWidth:     280,
    bubblePadding:   15,
    arrowWidth:      20,
    skipIfNoElement: true,
    isRtl:           false,
    cookieName:      'hopscotch.tour.state'
  };

  if (!Array.isArray) {
    Array.isArray = function(obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    };
  }

  /**
   * Called when the page is done loading.
   *
   * @private
   */
  winLoadHandler = function() {
    if (waitingToStart) {
      winHopscotch.startTour();
    }
  };

  /**
   * utils
   * =====
   * A set of utility functions, mostly for standardizing to manipulate
   * and extract information from the DOM. Basically these are things I
   * would normally use jQuery for, but I don't want to require it for
   * this framework.
   *
   * @private
   */
  utils = {
    /**
     * addClass
     * ========
     * Adds one or more classes to a DOM element.
     *
     * @private
     */
    addClass: function(domEl, classToAdd) {
      var domClasses,
          classToAddArr,
          setClass,
          i,
          len;

      if (!domEl.className) {
        domEl.className = classToAdd;
      }
      else {
        classToAddArr = classToAdd.split(/\s+/);
        domClasses = ' ' + domEl.className + ' ';
        for (i = 0, len = classToAddArr.length; i < len; ++i) {
          if (domClasses.indexOf(' ' + classToAddArr[i] + ' ') < 0) {
            domClasses += classToAddArr[i] + ' ';
          }
        }
        domEl.className = domClasses.replace(/^\s+|\s+$/g,'');
      }
    },

    /**
     * removeClass
     * ===========
     * Remove one or more classes from a DOM element.
     *
     * @private
     */
    removeClass: function(domEl, classToRemove) {
      var domClasses,
          classToRemoveArr,
          currClass,
          i,
          len;

      classToRemoveArr = classToRemove.split(/\s+/);
      domClasses = ' ' + domEl.className + ' ';
      for (i = 0, len = classToRemoveArr.length; i < len; ++i) {
        domClasses = domClasses.replace(' ' + classToRemoveArr[i] + ' ', ' ');
      }
      domEl.className = domClasses.replace(/^\s+|\s+$/g,'');
    },

    /**
     * hasClass
     * ========
     * Determine if a given DOM element has a class.
     */
    hasClass: function(domEl, classToCheck){
      var classes;

      if(!domEl.className){ return false; }
      classes = ' ' + domEl.className + ' ';
      return (classes.indexOf(' ' + classToCheck + ' ') !== -1);
    },

    /**
     * @private
     */
    getPixelValue: function(val) {
      var valType = typeof val;
      if (valType === 'number') { return val; }
      if (valType === 'string') { return parseInt(val, 10); }
      return 0;
    },

    /**
     * Inspired by Python... returns val if it's defined, otherwise returns the default.
     *
     * @private
     */
    valOrDefault: function(val, valDefault) {
      return typeof val !== undefinedStr ? val : valDefault;
    },

    /**
     * Invokes a single callback represented by an array.
     * Example input: ["my_fn", "arg1", 2, "arg3"]
     * @private
     */
    invokeCallbackArrayHelper: function(arr) {
      // Logic for a single callback
      var fn;
      if (Array.isArray(arr)) {
        fn = helpers[arr[0]];
        if (typeof fn === 'function') {
          return fn.apply(this, arr.slice(1));
        }
      }
    },

    /**
     * Invokes one or more callbacks. Array should have at most one level of nesting.
     * Example input:
     * ["my_fn", "arg1", 2, "arg3"]
     * [["my_fn_1", "arg1", "arg2"], ["my_fn_2", "arg2-1", "arg2-2"]]
     * [["my_fn_1", "arg1", "arg2"], function() { ... }]
     * @private
     */
    invokeCallbackArray: function(arr) {
      var i, len;

      if (Array.isArray(arr)) {
        if (typeof arr[0] === 'string') {
          // Assume there are no nested arrays. This is the one and only callback.
          return utils.invokeCallbackArrayHelper(arr);
        }
        else { // assume an array
          for (i = 0, len = arr.length; i < len; ++i) {
            utils.invokeCallback(arr[i]);
          }
        }
      }
    },

    /**
     * Helper function for invoking a callback, whether defined as a function literal
     * or an array that references a registered helper function.
     * @private
     */
    invokeCallback: function(cb) {
      if (typeof cb === 'function') {
        return cb();
      }
      if (typeof cb === 'string' && helpers[cb]) { // name of a helper
        return helpers[cb]();
      }
      else { // assuming array
        return utils.invokeCallbackArray(cb);
      }
    },

    /**
     * If stepCb (the step-specific helper callback) is passed in, then invoke
     * it first. Then invoke tour-wide helper.
     *
     * @private
     */
    invokeEventCallbacks: function(evtType, stepCb) {
      var cbArr = callbacks[evtType],
          callback,
          fn,
          i,
          len;

      if (stepCb) {
        return this.invokeCallback(stepCb);
      }

      for (i=0, len=cbArr.length; i<len; ++i) {
        this.invokeCallback(cbArr[i].cb);
      }
    },

    /**
     * @private
     */
    getScrollTop: function() {
      var scrollTop;
      if (typeof window.pageYOffset !== undefinedStr) {
        scrollTop = window.pageYOffset;
      }
      else {
        // Most likely IE <=8, which doesn't support pageYOffset
        scrollTop = document.documentElement.scrollTop;
      }
      return scrollTop;
    },

    /**
     * @private
     */
    getScrollLeft: function() {
      var scrollLeft;
      if (typeof window.pageXOffset !== undefinedStr) {
        scrollLeft = window.pageXOffset;
      }
      else {
        // Most likely IE <=8, which doesn't support pageXOffset
        scrollLeft = document.documentElement.scrollLeft;
      }
      return scrollLeft;
    },

    /**
     * @private
     */
    getWindowHeight: function() {
      return window.innerHeight || document.documentElement.clientHeight;
    },

    /**
     * @private
     */
    addEvtListener: function(el, evtName, fn) {
      if(el) {
        return el.addEventListener ? el.addEventListener(evtName, fn, false) : el.attachEvent('on' + evtName, fn);
      }
    },

    /**
     * @private
     */
    removeEvtListener: function(el, evtName, fn) {
      if(el) {
        return el.removeEventListener ? el.removeEventListener(evtName, fn, false) : el.detachEvent('on' + evtName, fn);
      }
    },

    documentIsReady: function() {
      return document.readyState === 'complete';
    },

    /**
     * @private
     */
    evtPreventDefault: function(evt) {
      if (evt.preventDefault) {
        evt.preventDefault();
      }
      else if (event) {
        event.returnValue = false;
      }
    },

    /**
     * @private
     */
    extend: function(obj1, obj2) {
      var prop;
      for (prop in obj2) {
        if (obj2.hasOwnProperty(prop)) {
          obj1[prop] = obj2[prop];
        }
      }
    },

    /**
     * Helper function to get a single target DOM element. We will try to
     * locate the DOM element through several ways, in the following order:
     *
     * 1) Passing the string into document.querySelector
     * 2) Passing the string to jQuery, if it exists
     * 3) Passing the string to Sizzle, if it exists
     * 4) Calling document.getElementById if it is a plain id
     *
     * Default case is to assume the string is a plain id and call
     * document.getElementById on it.
     *
     * @private
     */
    getStepTargetHelper: function(target){
      var result = document.getElementById(target);

      //Backwards compatibility: assume the string is an id
      if (result) {
        return result;
      }
      if (hasJquery) {
        result = jQuery(target);
        return result.length ? result[0] : null;
      }
      if (Sizzle) {
        result = new Sizzle(target);
        return result.length ? result[0] : null;
      }
      if (document.querySelector) {
        try {
          return document.querySelector(target);
        } catch (err) {}
      }
      // Regex test for id. Following the HTML 4 spec for valid id formats.
      // (http://www.w3.org/TR/html4/types.html#type-id)
      if (/^#[a-zA-Z][\w-_:.]*$/.test(target)) {
        return document.getElementById(target.substring(1));
      }

      return null;
    },

    /**
     * Given a step, returns the target DOM element associated with it. It is
     * recommended to only assign one target per step. However, there are
     * some use cases which require multiple step targets to be supplied. In
     * this event, we will use the first target in the array that we can
     * locate on the page. See the comments for getStepTargetHelper for more
     * information.
     *
     * @private
     */
    getStepTarget: function(step) {
      var queriedTarget;

      if (!step || !step.target) {
        return null;
      }

      if (typeof step.target === 'string') {
        //Just one target to test. Check and return its results.
        return utils.getStepTargetHelper(step.target);
      }
      else if (Array.isArray(step.target)) {
        // Multiple items to check. Check each and return the first success.
        // Assuming they are all strings.
        var i,
            len;

        for (i = 0, len = step.target.length; i < len; i++){
          if (typeof step.target[i] === 'string') {
            queriedTarget = utils.getStepTargetHelper(step.target[i]);

            if (queriedTarget) {
              return queriedTarget;
            }
          }
        }
        return null;
      }

      // Assume that the step.target is a DOM element
      return step.target;
    },

    /**
     * Convenience method for getting an i18n string. Returns custom i18n value
     * or the default i18n value if no custom value exists.
     *
     * @private
     */
    getI18NString: function(key) {
      return customI18N[key] || HopscotchI18N[key];
    },

    // Tour session persistence for multi-page tours. Uses HTML5 sessionStorage if available, then
    // falls back to using cookies.
    //
    // The following cookie-related logic is borrowed from:
    // http://www.quirksmode.org/js/cookies.html

    /**
     * @private
     */
    setState: function(name,value,days) {
      var expires = '',
          date;

      if (hasSessionStorage && isStorageWritable) {
        try{
          sessionStorage.setItem(name, value);
        }
        catch(err){
          isStorageWritable = false;
          this.setState(name, value, days);
        }
      }
      else {
        if(hasSessionStorage){
          //Clear out existing sessionStorage key so the new value we set to cookie gets read.
          //(If we're here, we've run into an error while trying to write to sessionStorage).
          sessionStorage.removeItem(name);
        }
        if (days) {
          date = new Date();
          date.setTime(date.getTime()+(days*24*60*60*1000));
          expires = '; expires='+date.toGMTString();
        }
        document.cookie = name+'='+value+expires+'; path=/';
      }
    },

    /**
     * @private
     */
    getState: function(name) {
      var nameEQ = name + '=',
          ca = document.cookie.split(';'),
          i,
          c,
          state;

      //return value from session storage if we have it
      if (hasSessionStorage) {
        state = sessionStorage.getItem(name);
        if(state){
          return state;
        }
      }

      //else, try cookies
      for(i=0;i < ca.length;i++) {
        c = ca[i];
        while (c.charAt(0)===' ') {c = c.substring(1,c.length);}
        if (c.indexOf(nameEQ) === 0) {
          state = c.substring(nameEQ.length,c.length);
          break;
        }
      }

      return state;
    },

    /**
     * @private
     */
    clearState: function(name) {
      if (hasSessionStorage) {
        sessionStorage.removeItem(name);
      }
      else {
        this.setState(name,'',-1);
      }
    },

    /**
     * Originally called it orientation, but placement is more intuitive.
     * Allowing both for now for backwards compatibility.
     * @private
     */
    normalizePlacement: function(step) {
      if (!step.placement && step.orientation) {
        step.placement = step.orientation;
      }
    },

    /**
     * If step is right-to-left enabled, flip the placement and xOffset, but only once.
     * @private
     */
    flipPlacement: function(step){
      if(step.isRtl && !step._isFlipped){
        var props = ['orientation', 'placement'], prop, i;
        if(step.xOffset){
          step.xOffset = -1 * this.getPixelValue(step.xOffset);
        }
        for(i in props){
          prop = props[i];
          if(step.hasOwnProperty(prop) && rtlMatches.hasOwnProperty(step[prop])) {
            step[prop] = rtlMatches[step[prop]];
          }
        }
        step._isFlipped = true;
      }
    }
  };

  utils.addEvtListener(window, 'load', winLoadHandler);

  callbacks = {
    next:  [],
    prev:  [],
    start: [],
    end:   [],
    show:  [],
    error: [],
    close: []
  };

  /**
   * helpers
   * =======
   * A map of functions to be used as callback listeners. Functions are
   * added to and removed from the map using the functions
   * Hopscotch.registerHelper() and Hopscotch.unregisterHelper().
   */
  helpers = {};

  HopscotchI18N = {
    stepNums: null,
    nextBtn: 'Next',
    prevBtn: 'Back',
    doneBtn: 'Done',
    skipBtn: 'Skip',
    closeTooltip: 'Close'
  };

  customI18N = {}; // Developer's custom i18n strings goes here.

  /**
   * HopscotchBubble
   *
   * @class The HopscotchBubble class represents the view of a bubble. This class is also used for Hopscotch callouts.
   */
  HopscotchBubble = function(opt) {
    this.init(opt);
  };

  HopscotchBubble.prototype = {
    isShowing: false,

    currStep: undefined,

    /**
     * setPosition
     *
     * Sets the position of the bubble using the bounding rectangle of the
     * target element and the orientation and offset information specified by
     * the JSON.
     */
    setPosition: function(step) {
      var bubbleBoundingHeight,
          bubbleBoundingWidth,
          boundingRect,
          top,
          left,
          arrowOffset,
          verticalLeftPosition,
          targetEl     = utils.getStepTarget(step),
          el           = this.element,
          arrowEl      = this.arrowEl,
          arrowPos     = step.isRtl ? 'right' : 'left';

      utils.flipPlacement(step);
      utils.normalizePlacement(step);

      bubbleBoundingWidth = el.offsetWidth;
      bubbleBoundingHeight = el.offsetHeight;
      utils.removeClass(el, 'fade-in-down fade-in-up fade-in-left fade-in-right');

      // SET POSITION
      boundingRect = targetEl.getBoundingClientRect();

      verticalLeftPosition = step.isRtl ? boundingRect.right - bubbleBoundingWidth : boundingRect.left;

      if (step.placement === 'top') {
        top = (boundingRect.top - bubbleBoundingHeight) - this.opt.arrowWidth;
        left = verticalLeftPosition;
      }
      else if (step.placement === 'bottom') {
        top = boundingRect.bottom + this.opt.arrowWidth;
        left = verticalLeftPosition;
      }
      else if (step.placement === 'left') {
        top = boundingRect.top;
        left = boundingRect.left - bubbleBoundingWidth - this.opt.arrowWidth;
      }
      else if (step.placement === 'right') {
        top = boundingRect.top;
        left = boundingRect.right + this.opt.arrowWidth;
      }
      else {
        throw new Error('Bubble placement failed because step.placement is invalid or undefined!');
      }

      // SET (OR RESET) ARROW OFFSETS
      if (step.arrowOffset !== 'center') {
        arrowOffset = utils.getPixelValue(step.arrowOffset);
      }
      else {
        arrowOffset = step.arrowOffset;
      }
      if (!arrowOffset) {
        arrowEl.style.top = '';
        arrowEl.style[arrowPos] = '';
      }
      else if (step.placement === 'top' || step.placement === 'bottom') {
        arrowEl.style.top = '';
        if (arrowOffset === 'center') {
          arrowEl.style[arrowPos] = Math.floor((bubbleBoundingWidth / 2) - arrowEl.offsetWidth/2) + 'px';
        }
        else {
          // Numeric pixel value
          arrowEl.style[arrowPos] = arrowOffset + 'px';
        }
      }
      else if (step.placement === 'left' || step.placement === 'right') {
        arrowEl.style[arrowPos] = '';
        if (arrowOffset === 'center') {
          arrowEl.style.top = Math.floor((bubbleBoundingHeight / 2) - arrowEl.offsetHeight/2) + 'px';
        }
        else {
          // Numeric pixel value
          arrowEl.style.top = arrowOffset + 'px';
        }
      }

      // HORIZONTAL OFFSET
      if (step.xOffset === 'center') {
        left = (boundingRect.left + targetEl.offsetWidth/2) - (bubbleBoundingWidth / 2);
      }
      else {
        left += utils.getPixelValue(step.xOffset);
      }
      // VERTICAL OFFSET
      if (step.yOffset === 'center') {
        top = (boundingRect.top + targetEl.offsetHeight/2) - (bubbleBoundingHeight / 2);
      }
      else {
        top += utils.getPixelValue(step.yOffset);
      }

      // ADJUST TOP FOR SCROLL POSITION
      if (!step.fixedElement) {
        top += utils.getScrollTop();
        left += utils.getScrollLeft();
      }

      // ACCOUNT FOR FIXED POSITION ELEMENTS
      el.style.position = (step.fixedElement ? 'fixed' : 'absolute');

      el.style.top = top + 'px';
      el.style.left = left + 'px';
    },

    /**
     * Renders the bubble according to the step JSON.
     *
     * @param {Object} step Information defining how the bubble should look.
     * @param {Number} idx The index of the step in the tour. Not used for callouts.
     * @param {Function} callback Function to be invoked after rendering is finished.
     */
    render: function(step, idx, callback) {
      var el = this.element,
          tourSpecificRenderer,
          customTourData,
          unsafe,
          currTour,
          totalSteps,
          totalStepsI18n,
          nextBtnText,
          isLast,
          i,
          opts;

      // Cache current step information.
      if (step) {
        this.currStep = step;
      }
      else if (this.currStep) {
        step = this.currStep;
      }

      // Check current tour for total number of steps and custom render data
      if(this.opt.isTourBubble){
        currTour = winHopscotch.getCurrTour();
        if(currTour){
          customTourData = currTour.customData;
          tourSpecificRenderer = currTour.customRenderer;
          step.isRtl = step.hasOwnProperty('isRtl') ? step.isRtl :
            (currTour.hasOwnProperty('isRtl') ? currTour.isRtl : this.opt.isRtl);
          unsafe = currTour.unsafe;
          if(Array.isArray(currTour.steps)){
            totalSteps = currTour.steps.length;
            totalStepsI18n = this._getStepI18nNum(this._getStepNum(totalSteps - 1));
            isLast = (this._getStepNum(idx) === this._getStepNum(totalSteps - 1));
          }
        }
      }else{
        customTourData = step.customData;
        tourSpecificRenderer = step.customRenderer;
        unsafe = step.unsafe;
        step.isRtl = step.hasOwnProperty('isRtl') ? step.isRtl : this.opt.isRtl;
      }

      // Determine label for next button
      if(isLast){
        nextBtnText = utils.getI18NString('doneBtn');
      } else if(step.showSkip) {
        nextBtnText = utils.getI18NString('skipBtn');
      } else {
        nextBtnText = utils.getI18NString('nextBtn');
      }

      utils.flipPlacement(step);
      utils.normalizePlacement(step);

      this.placement = step.placement;

      // Setup the configuration options we want to pass along to the template
      opts = {
        i18n: {
          prevBtn: utils.getI18NString('prevBtn'),
          nextBtn: nextBtnText,
          closeTooltip: utils.getI18NString('closeTooltip'),
          stepNum: this._getStepI18nNum(this._getStepNum(idx)),
          numSteps: totalStepsI18n
        },
        buttons:{
          showPrev: (utils.valOrDefault(step.showPrevButton, this.opt.showPrevButton) && (this._getStepNum(idx) > 0)),
          showNext: utils.valOrDefault(step.showNextButton, this.opt.showNextButton),
          showCTA: utils.valOrDefault((step.showCTAButton && step.ctaLabel), false),
          ctaLabel: step.ctaLabel,
          showClose: utils.valOrDefault(this.opt.showCloseButton, true)
        },
        step:{
          num: idx,
          isLast: utils.valOrDefault(isLast, false),
          title: (step.title || ''),
          content: (step.content || ''),
          isRtl: step.isRtl,
          placement: step.placement,
          padding: utils.valOrDefault(step.padding, this.opt.bubblePadding),
          width: utils.getPixelValue(step.width) || this.opt.bubbleWidth,
          customData: (step.customData || {})
        },
        tour:{
          isTour: this.opt.isTourBubble,
          numSteps: totalSteps,
          unsafe: utils.valOrDefault(unsafe, false),
          customData: (customTourData || {})
        }
      };

      // Render the bubble's content.
      // Use tour renderer if available, then the global customRenderer if defined.
      if(typeof tourSpecificRenderer === 'function'){
        el.innerHTML = tourSpecificRenderer(opts);
      }
      else if(typeof tourSpecificRenderer === 'string'){
        if(!winHopscotch.templates || (typeof winHopscotch.templates[tourSpecificRenderer] !== 'function')){
          throw new Error('Bubble rendering failed - template "' + tourSpecificRenderer + '" is not a function.');
        }
        el.innerHTML = winHopscotch.templates[tourSpecificRenderer](opts);
      }
      else if(customRenderer){
        el.innerHTML = customRenderer(opts);
      }
      else{
        if(!winHopscotch.templates || (typeof winHopscotch.templates[templateToUse] !== 'function')){
          throw new Error('Bubble rendering failed - template "' + templateToUse + '" is not a function.');
        }
        el.innerHTML = winHopscotch.templates[templateToUse](opts);
      }

      // Find arrow among new child elements.
      children = el.children;
      numChildren = children.length;
      for (i = 0; i < numChildren; i++){
        node = children[i];

        if(utils.hasClass(node, 'hopscotch-arrow')){
          this.arrowEl = node;
        }
      }

      // Set z-index and arrow placement
      el.style.zIndex = (typeof step.zindex === 'number') ? step.zindex : '';
      this._setArrow(step.placement);

      // Set bubble positioning
      // Make sure we're using visibility:hidden instead of display:none for height/width calculations.
      this.hide(false);
      this.setPosition(step);

      // only want to adjust window scroll for non-fixed elements
      if (callback) {
        callback(!step.fixedElement);
      }

      return this;
    },
    /**
     * Get step number considering steps that were skipped because their target wasn't found
     *
     * @private
     */
    _getStepNum: function(idx) {
      var skippedStepsCount = 0,
          stepIdx,
          skippedSteps = winHopscotch.getSkippedStepsIndexes(),
          i,
          len = skippedSteps.length;
      //count number of steps skipped before current step
      for(i = 0; i < len; i++) {
        stepIdx = skippedSteps[i];
        if(stepIdx<idx) {
          skippedStepsCount++;
        }
      }
      return idx - skippedStepsCount;
    },
    /**
     * Get the I18N step number for the current step.
     *
     * @private
     */
    _getStepI18nNum: function(idx) {
      var stepNumI18N = utils.getI18NString('stepNums');
      if (stepNumI18N && idx < stepNumI18N.length) {
        idx = stepNumI18N[idx];
      }
      else {
        idx = idx + 1;
      }
      return idx;
    },

    /**
     * Sets which side the arrow is on.
     *
     * @private
     */
    _setArrow: function(placement) {
      utils.removeClass(this.arrowEl, 'down up right left');

      // Whatever the orientation is, we want to arrow to appear
      // "opposite" of the orientation. E.g., a top orientation
      // requires a bottom arrow.
      if (placement === 'top') {
        utils.addClass(this.arrowEl, 'down');
      }
      else if (placement === 'bottom') {
        utils.addClass(this.arrowEl, 'up');
      }
      else if (placement === 'left') {
        utils.addClass(this.arrowEl, 'right');
      }
      else if (placement === 'right') {
        utils.addClass(this.arrowEl, 'left');
      }
    },

    /**
     * @private
     */
    _getArrowDirection: function() {
      if (this.placement === 'top') {
        return 'down';
      }
      if (this.placement === 'bottom') {
        return 'up';
      }
      if (this.placement === 'left') {
        return 'right';
      }
      if (this.placement === 'right') {
        return 'left';
      }
    },

    show: function() {
      var self      = this,
          fadeClass = 'fade-in-' + this._getArrowDirection(),
          fadeDur   = 1000;

      utils.removeClass(this.element, 'hide');
      utils.addClass(this.element, fadeClass);
      setTimeout(function() {
        utils.removeClass(self.element, 'invisible');
      }, 50);
      setTimeout(function() {
        utils.removeClass(self.element, fadeClass);
      }, fadeDur);
      this.isShowing = true;
      return this;
    },

    hide: function(remove) {
      var el = this.element;

      remove = utils.valOrDefault(remove, true);
      el.style.top = '';
      el.style.left = '';

      // display: none
      if (remove) {
        utils.addClass(el, 'hide');
        utils.removeClass(el, 'invisible');
      }
      // opacity: 0
      else {
        utils.removeClass(el, 'hide');
        utils.addClass(el, 'invisible');
      }
      utils.removeClass(el, 'animate fade-in-up fade-in-down fade-in-right fade-in-left');
      this.isShowing = false;
      return this;
    },

    destroy: function() {
      var el = this.element;

      if (el) {
        el.parentNode.removeChild(el);
      }
      utils.removeEvtListener(el, 'click', this.clickCb);
    },

    _handleBubbleClick: function(evt){
      var action;

      // Override evt for IE8 as IE8 doesn't pass event but binds it to window
      evt = evt || window.event; // get window.event if argument is falsy (in IE)

      // get srcElement if target is falsy (IE)
      var targetElement = evt.target || evt.srcElement;

      //Recursively look up the parent tree until we find a match
      //with one of the classes we're looking for, or the triggering element.
      function findMatchRecur(el){
        /* We're going to make the assumption that we're not binding
         * multiple event classes to the same element.
         * (next + previous = wait... err... what?)
         *
         * In the odd event we end up with an element with multiple
         * possible matches, the following priority order is applied:
         * hopscotch-cta, hopscotch-next, hopscotch-prev, hopscotch-close
         */
         if(el === evt.currentTarget){ return null; }
         if(utils.hasClass(el, 'hopscotch-cta')){ return 'cta'; }
         if(utils.hasClass(el, 'hopscotch-next')){ return 'next'; }
         if(utils.hasClass(el, 'hopscotch-prev')){ return 'prev'; }
         if(utils.hasClass(el, 'hopscotch-close')){ return 'close'; }
         /*else*/ return findMatchRecur(el.parentElement);
      }

      action = findMatchRecur(targetElement);

      //Now that we know what action we should take, let's take it.
      if (action === 'cta'){
        if (!this.opt.isTourBubble) {
          // This is a callout. Close the callout when CTA is clicked.
          winHopscotch.getCalloutManager().removeCallout(this.currStep.id);
        }
        // Call onCTA callback if one is provided
        if (this.currStep.onCTA) {
          utils.invokeCallback(this.currStep.onCTA);
        }
      }
      else if (action === 'next'){
        winHopscotch.nextStep(true);
      }
      else if (action === 'prev'){
        winHopscotch.prevStep(true);
      }
      else if (action === 'close'){
        if (this.opt.isTourBubble){
          var currStepNum   = winHopscotch.getCurrStepNum(),
              currTour      = winHopscotch.getCurrTour(),
              doEndCallback = (currStepNum === currTour.steps.length-1);

          utils.invokeEventCallbacks('close');

          winHopscotch.endTour(true, doEndCallback);
        } else {
          if (this.opt.onClose) {
            utils.invokeCallback(this.opt.onClose);
          }
          if (this.opt.id && !this.opt.isTourBubble) {
            // Remove via the HopscotchCalloutManager.
            // removeCallout() calls HopscotchBubble.destroy internally.
            winHopscotch.getCalloutManager().removeCallout(this.opt.id);
          }
          else {
            this.destroy();
          }
        }

        utils.evtPreventDefault(evt);
      }
      //Otherwise, do nothing. We didn't click on anything relevant.
    },

    init: function(initOpt) {
      var el              = document.createElement('div'),
          self            = this,
          resizeCooldown  = false, // for updating after window resize
          onWinResize,
          appendToBody,
          children,
          numChildren,
          node,
          i,
          currTour,
          opt;

      //Register DOM element for this bubble.
      this.element = el;

      //Merge bubble options with defaults.
      opt = {
        showPrevButton: defaultOpts.showPrevButton,
        showNextButton: defaultOpts.showNextButton,
        bubbleWidth:    defaultOpts.bubbleWidth,
        bubblePadding:  defaultOpts.bubblePadding,
        arrowWidth:     defaultOpts.arrowWidth,
        isRtl:          defaultOpts.isRtl,
        showNumber:     true,
        isTourBubble:   true
      };
      initOpt = (typeof initOpt === undefinedStr ? {} : initOpt);
      utils.extend(opt, initOpt);
      this.opt = opt;

      //Apply classes to bubble. Add "animated" for fade css animation
      el.className = 'hopscotch-bubble animated';
      if (!opt.isTourBubble) {
        utils.addClass(el, 'hopscotch-callout no-number');
      } else {
        currTour = winHopscotch.getCurrTour();
        if(currTour){
          utils.addClass(el, 'tour-' + currTour.id);
        }
      }

      /**
       * Not pretty, but IE8 doesn't support Function.bind(), so I'm
       * relying on closures to keep a handle of "this".
       * Reset position of bubble when window is resized
       *
       * @private
       */
      onWinResize = function() {
        if (resizeCooldown || !self.isShowing) {
          return;
        }

        resizeCooldown = true;
        setTimeout(function() {
          self.setPosition(self.currStep);
          resizeCooldown = false;
        }, 100);
      };

      //Add listener to reset bubble position on window resize
      utils.addEvtListener(window, 'resize', onWinResize);

      //Create our click callback handler and keep a
      //reference to it for later.
      this.clickCb = function(evt){
        self._handleBubbleClick(evt);
      };
      utils.addEvtListener(el, 'click', this.clickCb);

      //Hide the bubble by default
      this.hide();

      //Finally, append our new bubble to body once the DOM is ready.
      if (utils.documentIsReady()) {
        document.body.appendChild(el);
      }
      else {
        // Moz, webkit, Opera
        if (document.addEventListener) {
          appendToBody = function() {
            document.removeEventListener('DOMContentLoaded', appendToBody);
            window.removeEventListener('load', appendToBody);

            document.body.appendChild(el);
          };

          document.addEventListener('DOMContentLoaded', appendToBody, false);
        }
        // IE
        else {
          appendToBody = function() {
            if (document.readyState === 'complete') {
              document.detachEvent('onreadystatechange', appendToBody);
              window.detachEvent('onload', appendToBody);
              document.body.appendChild(el);
            }
          };

          document.attachEvent('onreadystatechange', appendToBody);
        }
        utils.addEvtListener(window, 'load', appendToBody);
      }
    }
  };

  /**
   * HopscotchCalloutManager
   *
   * @class Manages the creation and destruction of single callouts.
   * @constructor
   */
  HopscotchCalloutManager = function() {
    var callouts = {},
        calloutOpts = {};

    /**
     * createCallout
     *
     * Creates a standalone callout. This callout has the same API
     * as a Hopscotch tour bubble.
     *
     * @param {Object} opt The options for the callout. For the most
     * part, these are the same options as you would find in a tour
     * step.
     */
    this.createCallout = function(opt) {
      var callout;

      if (opt.id) {
        if(!validIdRegEx.test(opt.id)) {
          throw new Error('Callout ID is using an invalid format. Use alphanumeric, underscores, and/or hyphens only. First character must be a letter.');
        }
        if (callouts[opt.id]) {
          throw new Error('Callout by that id already exists. Please choose a unique id.');
        }
        if (!utils.getStepTarget(opt)) {
          throw new Error('Must specify existing target element via \'target\' option.');
        }
        opt.showNextButton = opt.showPrevButton = false;
        opt.isTourBubble = false;
        callout = new HopscotchBubble(opt);
        callouts[opt.id] = callout;
        calloutOpts[opt.id] = opt;
        callout.render(opt, null, function() {
          callout.show();
          if (opt.onShow) {
            utils.invokeCallback(opt.onShow);
          }
        });
      }
      else {
        throw new Error('Must specify a callout id.');
      }
      return callout;
    };

    /**
     * getCallout
     *
     * Returns a callout by its id.
     *
     * @param {String} id The id of the callout to fetch.
     * @returns {Object} HopscotchBubble
     */
    this.getCallout = function(id) {
      return callouts[id];
    };

    /**
     * removeAllCallouts
     *
     * Removes all existing callouts.
     */
    this.removeAllCallouts = function() {
      var calloutId;

      for (calloutId in callouts) {
        if (callouts.hasOwnProperty(calloutId)) {
          this.removeCallout(calloutId);
        }
      }
    };

    /**
     * removeCallout
     *
     * Removes an existing callout by id.
     *
     * @param {String} id The id of the callout to remove.
     */
    this.removeCallout = function(id) {
      var callout = callouts[id];

      callouts[id] = null;
      calloutOpts[id] = null;
      if (!callout) { return; }

      callout.destroy();
    };

    /**
     * refreshCalloutPositions
     *
     * Refresh the positions for all callouts known by the
     * callout manager. Typically you'll use
     * hopscotch.refreshBubblePosition() to refresh ALL
     * bubbles instead of calling this directly.
     */
    this.refreshCalloutPositions = function(){
      var calloutId,
          callout,
          opts;

      for (calloutId in callouts) {
        if (callouts.hasOwnProperty(calloutId) && calloutOpts.hasOwnProperty(calloutId)) {
          callout = callouts[calloutId];
          opts = calloutOpts[calloutId];
          if(callout && opts){
            callout.setPosition(opts);
          }
        }
      }
    };
  };

  /**
   * Hopscotch
   *
   * @class Creates the Hopscotch object. Used to manage tour progress and configurations.
   * @constructor
   * @param {Object} initOptions Options to be passed to `configure()`.
   */
  Hopscotch = function(initOptions) {
    var self       = this, // for targetClickNextFn
        bubble,
        calloutMgr,
        opt,
        currTour,
        currStepNum,
        skippedSteps = {},
        cookieTourId,
        cookieTourStep,
        cookieSkippedSteps = [],
        _configure,

    /**
     * getBubble
     *
     * Singleton accessor function for retrieving or creating bubble object.
     *
     * @private
     * @param setOptions {Boolean} when true, transfers configuration options to the bubble
     * @returns {Object} HopscotchBubble
     */
    getBubble = function(setOptions) {
      if (!bubble || !bubble.element || !bubble.element.parentNode) {
        bubble = new HopscotchBubble(opt);
      }
      if (setOptions) {
        utils.extend(bubble.opt, {
          bubblePadding:   getOption('bubblePadding'),
          bubbleWidth:     getOption('bubbleWidth'),
          showNextButton:  getOption('showNextButton'),
          showPrevButton:  getOption('showPrevButton'),
          showCloseButton: getOption('showCloseButton'),
          arrowWidth:      getOption('arrowWidth'),
          isRtl:           getOption('isRtl')
        });
      }
      return bubble;
    },

    /**
     * Destroy the bubble currently associated with Hopscotch.
     * This is done when we end the current tour.
     *
     * @private
     */
    destroyBubble = function() {
      if(bubble){
        bubble.destroy();
        bubble = null;
      }
    },

    /**
     * Convenience method for getting an option. Returns custom config option
     * or the default config option if no custom value exists.
     *
     * @private
     * @param name {String} config option name
     * @returns {Object} config option value
     */
    getOption = function(name) {
      if (typeof opt === 'undefined') {
        return defaultOpts[name];
      }
      return utils.valOrDefault(opt[name], defaultOpts[name]);
    },

    /**
     * getCurrStep
     *
     * @private
     * @returns {Object} the step object corresponding to the current value of currStepNum
     */
    getCurrStep = function() {
      var step;

      if (!currTour || currStepNum < 0 || currStepNum >= currTour.steps.length) {
        step = null;
      }
      else {
        step = currTour.steps[currStepNum];
      }

      return step;
    },

    /**
     * Used for nextOnTargetClick
     *
     * @private
     */
    targetClickNextFn = function() {
      self.nextStep();
    },

    /**
     * adjustWindowScroll
     *
     * Checks if the bubble or target element is partially or completely
     * outside of the viewport. If it is, adjust the window scroll position
     * to bring it back into the viewport.
     *
     * @private
     * @param {Function} cb Callback to invoke after done scrolling.
     */
    adjustWindowScroll = function(cb) {
      var bubble         = getBubble(),

          // Calculate the bubble element top and bottom position
          bubbleEl       = bubble.element,
          bubbleTop      = utils.getPixelValue(bubbleEl.style.top),
          bubbleBottom   = bubbleTop + utils.getPixelValue(bubbleEl.offsetHeight),

          // Calculate the target element top and bottom position
          targetEl       = utils.getStepTarget(getCurrStep()),
          targetBounds   = targetEl.getBoundingClientRect(),
          targetElTop    = targetBounds.top + utils.getScrollTop(),
          targetElBottom = targetBounds.bottom + utils.getScrollTop(),

          // The higher of the two: bubble or target
          targetTop      = (bubbleTop < targetElTop) ? bubbleTop : targetElTop,
          // The lower of the two: bubble or target
          targetBottom   = (bubbleBottom > targetElBottom) ? bubbleBottom : targetElBottom,

          // Calculate the current viewport top and bottom
          windowTop      = utils.getScrollTop(),
          windowBottom   = windowTop + utils.getWindowHeight(),

          // This is our final target scroll value.
          scrollToVal    = targetTop - getOption('scrollTopMargin'),

          scrollEl,
          yuiAnim,
          yuiEase,
          direction,
          scrollIncr,
          scrollTimeout,
          scrollTimeoutFn;

      // Target and bubble are both visible in viewport
      if (targetTop >= windowTop && (targetTop <= windowTop + getOption('scrollTopMargin') || targetBottom <= windowBottom)) {
        if (cb) { cb(); } // HopscotchBubble.show
      }

      // Abrupt scroll to scroll target
      else if (!getOption('smoothScroll')) {
        window.scrollTo(0, scrollToVal);

        if (cb) { cb(); } // HopscotchBubble.show
      }

      // Smooth scroll to scroll target
      else {
        // Use YUI if it exists
        if (typeof YAHOO             !== undefinedStr &&
            typeof YAHOO.env         !== undefinedStr &&
            typeof YAHOO.env.ua      !== undefinedStr &&
            typeof YAHOO.util        !== undefinedStr &&
            typeof YAHOO.util.Scroll !== undefinedStr) {
          scrollEl = YAHOO.env.ua.webkit ? document.body : document.documentElement;
          yuiEase = YAHOO.util.Easing ? YAHOO.util.Easing.easeOut : undefined;
          yuiAnim = new YAHOO.util.Scroll(scrollEl, {
            scroll: { to: [0, scrollToVal] }
          }, getOption('scrollDuration')/1000, yuiEase);
          yuiAnim.onComplete.subscribe(cb);
          yuiAnim.animate();
        }

        // Use jQuery if it exists
        else if (hasJquery) {
          jQuery('body, html').animate({ scrollTop: scrollToVal }, getOption('scrollDuration'), cb);
        }

        // Use my crummy setInterval scroll solution if we're using plain, vanilla Javascript.
        else {
          if (scrollToVal < 0) {
            scrollToVal = 0;
          }

          // 48 * 10 == 480ms scroll duration
          // make it slightly less than CSS transition duration because of
          // setInterval overhead.
          // To increase or decrease duration, change the divisor of scrollIncr.
          direction = (windowTop > targetTop) ? -1 : 1; // -1 means scrolling up, 1 means down
          scrollIncr = Math.abs(windowTop - scrollToVal) / (getOption('scrollDuration')/10);
          scrollTimeoutFn = function() {
            var scrollTop = utils.getScrollTop(),
                scrollTarget = scrollTop + (direction * scrollIncr);

            if ((direction > 0 && scrollTarget >= scrollToVal) ||
                (direction < 0 && scrollTarget <= scrollToVal)) {
              // Overshot our target. Just manually set to equal the target
              // and clear the interval
              scrollTarget = scrollToVal;
              if (cb) { cb(); } // HopscotchBubble.show
              window.scrollTo(0, scrollTarget);
              return;
            }

            window.scrollTo(0, scrollTarget);

            if (utils.getScrollTop() === scrollTop) {
              // Couldn't scroll any further.
              if (cb) { cb(); } // HopscotchBubble.show
              return;
            }

            // If we reached this point, that means there's still more to scroll.
            setTimeout(scrollTimeoutFn, 10);
          };

          scrollTimeoutFn();
        }
      }
    },

    /**
     * goToStepWithTarget
     *
     * Helper function to increment the step number until a step is found where
     * the step target exists or until we reach the end/beginning of the tour.
     *
     * @private
     * @param {Number} direction Either 1 for incrementing or -1 for decrementing
     * @param {Function} cb The callback function to be invoked when the step has been found
     */
    goToStepWithTarget = function(direction, cb) {
      var target,
          step,
          goToStepFn;

      if (currStepNum + direction >= 0 &&
          currStepNum + direction < currTour.steps.length) {

        currStepNum += direction;
        step = getCurrStep();

        goToStepFn = function() {
          target = utils.getStepTarget(step);

          if (target) {
            //this step was previously skipped, but now its target exists,
            //remove this step from skipped steps set
            if(skippedSteps[currStepNum]) {
              delete skippedSteps[currStepNum];
            }
            // We're done! Return the step number via the callback.
            cb(currStepNum);
          }
          else {
            //mark this step as skipped, since its target wasn't found
            skippedSteps[currStepNum] = true;
            // Haven't found a valid target yet. Recursively call
            // goToStepWithTarget.
            utils.invokeEventCallbacks('error');
            goToStepWithTarget(direction, cb);
          }
        };

        if (step.delay) {
          setTimeout(goToStepFn, step.delay);
        }
        else {
          goToStepFn();
        }
      }
      else {
        cb(-1); // signal that we didn't find any step with a valid target
      }
    },

    /**
     * changeStep
     *
     * Helper function to change step by going forwards or backwards 1.
     * nextStep and prevStep are publicly accessible wrappers for this function.
     *
     * @private
     * @param {Boolean} doCallbacks Flag for invoking onNext or onPrev callbacks
     * @param {Number} direction Either 1 for "next" or -1 for "prev"
     */
    changeStep = function(doCallbacks, direction) {
      var bubble = getBubble(),
          self = this,
          step,
          origStep,
          wasMultiPage,
          changeStepCb;

      bubble.hide();

      doCallbacks = utils.valOrDefault(doCallbacks, true);

      step = getCurrStep();

      if (step.nextOnTargetClick) {
        // Detach the listener when tour is moving to a different step
        utils.removeEvtListener(utils.getStepTarget(step), 'click', targetClickNextFn);
      }

      origStep = step;
      if (direction > 0) {
        wasMultiPage = origStep.multipage;
      }
      else {
        wasMultiPage = (currStepNum > 0 && currTour.steps[currStepNum-1].multipage);
      }

      /**
       * Callback for goToStepWithTarget
       *
       * @private
       */
      changeStepCb = function(stepNum) {
        var doShowFollowingStep;

        if (stepNum === -1) {
          // Wasn't able to find a step with an existing element. End tour.
          return this.endTour(true);
        }

        if (doCallbacks) {
          if (direction > 0) {
            doShowFollowingStep = utils.invokeEventCallbacks('next', origStep.onNext);
          }
          else {
            doShowFollowingStep = utils.invokeEventCallbacks('prev', origStep.onPrev);
          }
        }

        // If the state of the tour is updated in a callback, assume the client
        // doesn't want to go to next step since they specifically updated.
        if (stepNum !== currStepNum) {
          return;
        }

        if (wasMultiPage) {
          // Update state for the next page
           setStateHelper();

          // Next step is on a different page, so no need to attempt to render it.
          return;
        }

        doShowFollowingStep = utils.valOrDefault(doShowFollowingStep, true);

        // If the onNext/onPrev callback returned false, halt the tour and
        // don't show the next step.
        if (doShowFollowingStep) {
          this.showStep(stepNum);
        }
        else {
          // Halt tour (but don't clear state)
          this.endTour(false);
        }
      };

      if (!wasMultiPage && getOption('skipIfNoElement')) {
        goToStepWithTarget(direction, function(stepNum) {
          changeStepCb.call(self, stepNum);
        });
      }
      else if (currStepNum + direction >= 0 && currStepNum + direction < currTour.steps.length) {
        // only try incrementing once, and invoke error callback if no target is found
        currStepNum += direction;
        step = getCurrStep();
        if (!utils.getStepTarget(step) && !wasMultiPage) {
          utils.invokeEventCallbacks('error');
          return this.endTour(true, false);
        }
        changeStepCb.call(this, currStepNum);
      } else if (currStepNum + direction === currTour.steps.length) {
        return this.endTour();
      }

      return this;
    },

    /**
     * loadTour
     *
     * Loads, but does not display, tour.
     *
     * @private
     * @param tour The tour JSON object
     */
    loadTour = function(tour) {
      var tmpOpt = {},
          prop,
          tourState,
          tourStateValues;

      // Set tour-specific configurations
      for (prop in tour) {
        if (tour.hasOwnProperty(prop) &&
            prop !== 'id' &&
            prop !== 'steps') {
          tmpOpt[prop] = tour[prop];
        }
      }

      //this.resetDefaultOptions(); // reset all options so there are no surprises
      // TODO check number of config properties of tour
      _configure.call(this, tmpOpt, true);

      // Get existing tour state, if it exists.
      tourState = utils.getState(getOption('cookieName'));
      if (tourState) {
        tourStateValues     = tourState.split(':');
        cookieTourId        = tourStateValues[0]; // selecting tour is not supported by this framework.
        cookieTourStep      = tourStateValues[1];

        if(tourStateValues.length > 2) {
          cookieSkippedSteps = tourStateValues[2].split(',');
        }

        cookieTourStep    = parseInt(cookieTourStep, 10);
      }

      return this;
    },

    /**
     * Find the first step to show for a tour. (What is the first step with a
     * target on the page?)
     */
    findStartingStep = function(startStepNum, savedSkippedSteps, cb) {
      var step,
          target;

      currStepNum = startStepNum || 0;
      skippedSteps = savedSkippedSteps || {};
      step        = getCurrStep();
      target      = utils.getStepTarget(step);

      if (target) {
        // First step had an existing target.
        cb(currStepNum);
        return;
      }

      if (!target) {
        // Previous target doesn't exist either. The user may have just
        // clicked on a link that wasn't part of the tour. Another possibility is that
        // the user clicked on the correct link, but the target is just missing for
        // whatever reason. In either case, we should just advance until we find a step
        // that has a target on the page or end the tour if we can't find such a step.
        utils.invokeEventCallbacks('error');

        //this step was skipped, since its target does not exist
        skippedSteps[currStepNum] = true;

        if (getOption('skipIfNoElement')) {
          goToStepWithTarget(1, cb);
          return;
        }
        else {
          currStepNum = -1;
          cb(currStepNum);
        }
      }
    },

    showStepHelper = function(stepNum) {
      var step         = currTour.steps[stepNum],
          bubble       = getBubble(),
          targetEl     = utils.getStepTarget(step);

      function showBubble() {
        bubble.show();
        utils.invokeEventCallbacks('show', step.onShow);
      }

      if (currStepNum !== stepNum && getCurrStep().nextOnTargetClick) {
        // Detach the listener when tour is moving to a different step
        utils.removeEvtListener(utils.getStepTarget(getCurrStep()), 'click', targetClickNextFn);
      }

      // Update bubble for current step
      currStepNum = stepNum;

      bubble.hide(false);

      bubble.render(step, stepNum, function(adjustScroll) {
        // when done adjusting window scroll, call showBubble helper fn
        if (adjustScroll) {
          adjustWindowScroll(showBubble);
        }
        else {
          showBubble();
        }

        // If we want to advance to next step when user clicks on target.
        if (step.nextOnTargetClick) {
          utils.addEvtListener(targetEl, 'click', targetClickNextFn);
        }
      });

      setStateHelper();
    },

    setStateHelper = function() {
      var cookieVal = currTour.id + ':' + currStepNum,
        skipedStepIndexes = winHopscotch.getSkippedStepsIndexes();

      if(skipedStepIndexes && skipedStepIndexes.length > 0) {
        cookieVal += ':' + skipedStepIndexes.join(',');
      }

      utils.setState(getOption('cookieName'), cookieVal, 1);
    },

    /**
     * init
     *
     * Initializes the Hopscotch object.
     *
     * @private
     */
    init = function(initOptions) {
      if (initOptions) {
        //initOptions.cookieName = initOptions.cookieName || 'hopscotch.tour.state';
        this.configure(initOptions);
      }
    };

    /**
     * getCalloutManager
     *
     * Gets the callout manager.
     *
     * @returns {Object} HopscotchCalloutManager
     *
     */
    this.getCalloutManager = function() {
      if (typeof calloutMgr === undefinedStr) {
        calloutMgr = new HopscotchCalloutManager();
      }

      return calloutMgr;
    };

    /**
     * startTour
     *
     * Begins the tour.
     *
     * @param {Object} tour The tour JSON object
     * @stepNum {Number} stepNum __Optional__ The step number to start from
     * @returns {Object} Hopscotch
     *
     */
    this.startTour = function(tour, stepNum) {
      var bubble,
          currStepNum,
          skippedSteps = {},
          self = this;

      // loadTour if we are calling startTour directly. (When we call startTour
      // from window onLoad handler, we'll use currTour)
      if (!currTour) {
        
        // Sanity check! Is there a tour?
        if(!tour){
          throw new Error('Tour data is required for startTour.');
        }

        // Check validity of tour ID. If invalid, throw an error.
        if(!tour.id || !validIdRegEx.test(tour.id)) {
          throw new Error('Tour ID is using an invalid format. Use alphanumeric, underscores, and/or hyphens only. First character must be a letter.');
        }

        currTour = tour;
        loadTour.call(this, tour);

      }

      if (typeof stepNum !== undefinedStr) {
        if (stepNum >= currTour.steps.length) {
          throw new Error('Specified step number out of bounds.');
        }
        currStepNum = stepNum;
      }

      // If document isn't ready, wait for it to finish loading.
      // (so that we can calculate positioning accurately)
      if (!utils.documentIsReady()) {
        waitingToStart = true;
        return this;
      }

      if (typeof currStepNum === "undefined" && currTour.id === cookieTourId && typeof cookieTourStep !== undefinedStr) {
        currStepNum = cookieTourStep;
        if(cookieSkippedSteps.length > 0){
          for(var i = 0, len = cookieSkippedSteps.length; i < len; i++) {
            skippedSteps[cookieSkippedSteps[i]] = true;
          }
        }
      }
      else if (!currStepNum) {
        currStepNum = 0;
      }

      // Find the current step we should begin the tour on, and then actually start the tour.
      findStartingStep(currStepNum, skippedSteps, function(stepNum) {
        var target = (stepNum !== -1) && utils.getStepTarget(currTour.steps[stepNum]);

        if (!target) {
          // Should we trigger onEnd callback? Let's err on the side of caution
          // and not trigger it. Don't want weird stuff happening on a page that
          // wasn't meant for the tour. Up to the developer to fix their tour.
          self.endTour(false, false);
          return;
        }

        utils.invokeEventCallbacks('start');

        bubble = getBubble();
        // TODO: do we still need this call to .hide()? No longer using opt.animate...
        // Leaving it in for now to play it safe
        bubble.hide(false); // make invisible for boundingRect calculations when opt.animate == true

        self.isActive = true;

        if (!utils.getStepTarget(getCurrStep())) {
          // First step element doesn't exist
          utils.invokeEventCallbacks('error');
          if (getOption('skipIfNoElement')) {
            self.nextStep(false);
          }
        }
        else {
          self.showStep(stepNum);
        }
      });

      return this;
    };

    /**
     * showStep
     *
     * Skips to a specific step and renders the corresponding bubble.
     *
     * @stepNum {Number} stepNum The step number to show
     * @returns {Object} Hopscotch
     */
    this.showStep = function(stepNum) {
      var step = currTour.steps[stepNum],
          prevStepNum = currStepNum;
      if(!utils.getStepTarget(step)) {
        currStepNum = stepNum;
        utils.invokeEventCallbacks('error');
        currStepNum = prevStepNum;
        return;
      }

      if (step.delay) {
        setTimeout(function() {
          showStepHelper(stepNum);
        }, step.delay);
      }
      else {
        showStepHelper(stepNum);
      }
      return this;
    };

    /**
     * prevStep
     *
     * Jump to the previous step.
     *
     * @param {Boolean} doCallbacks Flag for invoking onPrev callback. Defaults to true.
     * @returns {Object} Hopscotch
     */
    this.prevStep = function(doCallbacks) {
      changeStep.call(this, doCallbacks, -1);
      return this;
    };

    /**
     * nextStep
     *
     * Jump to the next step.
     *
     * @param {Boolean} doCallbacks Flag for invoking onNext callback. Defaults to true.
     * @returns {Object} Hopscotch
     */
    this.nextStep = function(doCallbacks) {
      changeStep.call(this, doCallbacks, 1);
      return this;
    };

    /**
     * endTour
     *
     * Cancels out of an active tour.
     *
     * @param {Boolean} clearState Flag for clearing state. Defaults to true.
     * @param {Boolean} doCallbacks Flag for invoking 'onEnd' callbacks. Defaults to true.
     * @returns {Object} Hopscotch
     */
    this.endTour = function(clearState, doCallbacks) {
      var bubble     = getBubble(),
        currentStep;

      clearState     = utils.valOrDefault(clearState, true);
      doCallbacks    = utils.valOrDefault(doCallbacks, true);

      //remove event listener if current step had it added
      if(currTour) {
        currentStep = getCurrStep();
        if(currentStep && currentStep.nextOnTargetClick) {
          utils.removeEvtListener(utils.getStepTarget(currentStep), 'click', targetClickNextFn);
        }
      }

      currStepNum    = 0;
      cookieTourStep = undefined;

      bubble.hide();
      if (clearState) {
        utils.clearState(getOption('cookieName'));
      }
      if (this.isActive) {
        this.isActive = false;

        if (currTour && doCallbacks) {
          utils.invokeEventCallbacks('end');
        }
      }

      this.removeCallbacks(null, true);
      this.resetDefaultOptions();
      destroyBubble();

      currTour = null;

      return this;
    };

    /**
     * getCurrTour
     *
     * @return {Object} The currently loaded tour.
     */
    this.getCurrTour = function() {
      return currTour;
    };

    /**
     * getCurrTarget
     *
     * @return {Object} The currently visible target.
     */
    this.getCurrTarget = function() {
      return utils.getStepTarget(getCurrStep());
    };

    /**
     * getCurrStepNum
     *
     * @return {number} The current zero-based step number.
     */
    this.getCurrStepNum = function() {
      return currStepNum;
    };

    /**
     * getSkippedStepsIndexes
     *
     * @return {Array} Array of skipped step indexes
     */
    this.getSkippedStepsIndexes = function() {
      var skippedStepsIdxArray = [],
         stepIds;

      for(stepIds in skippedSteps){
        skippedStepsIdxArray.push(stepIds);
      }

      return skippedStepsIdxArray;
    };

    /**
     * refreshBubblePosition
     *
     * Tell hopscotch that the position of the current tour element changed
     * and the bubble therefore needs to be redrawn. Also refreshes position
     * of all Hopscotch Callouts on the page.
     *
     * @returns {Object} Hopscotch
     */
    this.refreshBubblePosition = function() {
      var currStep = getCurrStep();
      if(currStep){
        getBubble().setPosition(currStep);
      }
      this.getCalloutManager().refreshCalloutPositions();
      return this;
    };

    /**
     * listen
     *
     * Adds a callback for one of the event types. Valid event types are:
     *
     * @param {string} evtType "start", "end", "next", "prev", "show", "close", or "error"
     * @param {Function} cb The callback to add.
     * @param {Boolean} isTourCb Flag indicating callback is from a tour definition.
     *    For internal use only!
     * @returns {Object} Hopscotch
     */
    this.listen = function(evtType, cb, isTourCb) {
      if (evtType) {
        callbacks[evtType].push({ cb: cb, fromTour: isTourCb });
      }
      return this;
    };

    /**
     * unlisten
     *
     * Removes a callback for one of the event types, e.g. 'start', 'next', etc.
     *
     * @param {string} evtType "start", "end", "next", "prev", "show", "close", or "error"
     * @param {Function} cb The callback to remove.
     * @returns {Object} Hopscotch
     */
    this.unlisten = function(evtType, cb) {
      var evtCallbacks = callbacks[evtType],
          i,
          len;

      for (i = 0, len = evtCallbacks.length; i < len; ++i) {
        if (evtCallbacks[i].cb === cb) {
          evtCallbacks.splice(i, 1);
        }
      }
      return this;
    };

    /**
     * removeCallbacks
     *
     * Remove callbacks for hopscotch events. If tourOnly is set to true, only
     * removes callbacks specified by a tour (callbacks set by external calls
     * to hopscotch.configure or hopscotch.listen will not be removed). If
     * evtName is null or undefined, callbacks for all events will be removed.
     *
     * @param {string} evtName Optional Event name for which we should remove callbacks
     * @param {boolean} tourOnly Optional flag to indicate we should only remove callbacks added
     *    by a tour. Defaults to false.
     * @returns {Object} Hopscotch
     */
    this.removeCallbacks = function(evtName, tourOnly) {
      var cbArr,
          i,
          len,
          evt;

      // If evtName is null or undefined, remove callbacks for all events.
      for (evt in callbacks) {
        if (!evtName || evtName === evt) {
          if (tourOnly) {
            cbArr = callbacks[evt];
            for (i=0, len=cbArr.length; i < len; ++i) {
              if (cbArr[i].fromTour) {
                cbArr.splice(i--, 1);
                --len;
              }
            }
          }
          else {
            callbacks[evt] = [];
          }
        }
      }
      return this;
    };

    /**
     * registerHelper
     * ==============
     * Registers a helper function to be used as a callback function.
     *
     * @param {String} id The id of the function.
     * @param {Function} id The callback function.
     */
    this.registerHelper = function(id, fn) {
      if (typeof id === 'string' && typeof fn === 'function') {
        helpers[id] = fn;
      }
    };

    this.unregisterHelper = function(id) {
      helpers[id] = null;
    };

    this.invokeHelper = function(id) {
      var args = [],
          i,
          len;

      for (i = 1, len = arguments.length; i < len; ++i) {
        args.push(arguments[i]);
      }
      if (helpers[id]) {
        helpers[id].call(null, args);
      }
    };

    /**
     * setCookieName
     *
     * Sets the cookie name (or sessionStorage name, if supported) used for multi-page
     * tour persistence.
     *
     * @param {String} name The cookie name
     * @returns {Object} Hopscotch
     */
    this.setCookieName = function(name) {
      opt.cookieName = name;
      return this;
    };

    /**
     * resetDefaultOptions
     *
     * Resets all configuration options to default.
     *
     * @returns {Object} Hopscotch
     */
    this.resetDefaultOptions = function() {
      opt = {};
      return this;
    };

    /**
     * resetDefaultI18N
     *
     * Resets all i18n.
     *
     * @returns {Object} Hopscotch
     */
    this.resetDefaultI18N = function() {
      customI18N = {};
      return this;
    };

    /**
     * hasState
     *
     * Returns state from a previous tour run, if it exists.
     *
     * @returns {String} State of previous tour run, or empty string if none exists.
     */
    this.getState = function() {
      return utils.getState(getOption('cookieName'));
    };

    /**
     * _configure
     *
     * @see this.configure
     * @private
     * @param options
     * @param {Boolean} isTourOptions Should be set to true when setting options from a tour definition.
     */
    _configure = function(options, isTourOptions) {
      var bubble,
          events = ['next', 'prev', 'start', 'end', 'show', 'error', 'close'],
          eventPropName,
          callbackProp,
          i,
          len;

      if (!opt) {
        this.resetDefaultOptions();
      }

      utils.extend(opt, options);

      if (options) {
        utils.extend(customI18N, options.i18n);
      }

      for (i = 0, len = events.length; i < len; ++i) {
        // At this point, options[eventPropName] may have changed from an array
        // to a function.
        eventPropName = 'on' + events[i].charAt(0).toUpperCase() + events[i].substring(1);
        if (options[eventPropName]) {
          this.listen(events[i],
                      options[eventPropName],
                      isTourOptions);
        }
      }

      bubble = getBubble(true);

      return this;
    };

    /**
     * configure
     *
     * <pre>
     * VALID OPTIONS INCLUDE...
     *
     * - bubbleWidth:     Number   - Default bubble width. Defaults to 280.
     * - bubblePadding:   Number   - DEPRECATED. Default bubble padding. Defaults to 15.
     * - smoothScroll:    Boolean  - should the page scroll smoothly to the next
     *                               step? Defaults to TRUE.
     * - scrollDuration:  Number   - Duration of page scroll. Only relevant when
     *                               smoothScroll is set to true. Defaults to
     *                               1000ms.
     * - scrollTopMargin: NUMBER   - When the page scrolls, how much space should there
     *                               be between the bubble/targetElement and the top
     *                               of the viewport? Defaults to 200.
     * - showCloseButton: Boolean  - should the tour bubble show a close (X) button?
     *                               Defaults to TRUE.
     * - showPrevButton:  Boolean  - should the bubble have the Previous button?
     *                               Defaults to FALSE.
     * - showNextButton:  Boolean  - should the bubble have the Next button?
     *                               Defaults to TRUE.
     * - arrowWidth:      Number   - Default arrow width. (space between the bubble
     *                               and the targetEl) Used for bubble position
     *                               calculation. Only use this option if you are
     *                               using your own custom CSS. Defaults to 20.
     * - skipIfNoElement  Boolean  - If a specified target element is not found,
     *                               should we skip to the next step? Defaults to
     *                               TRUE.
     * - onNext:          Function - A callback to be invoked after every click on
     *                               a "Next" button.
     * - isRtl:           Boolean  - Set to true when instantiating in a right-to-left
     *                               language environment, or if mirrored positioning is
     *                               needed.
     *                               Defaults to FALSE.
     *
     * - i18n:            Object   - For i18n purposes. Allows you to change the
     *                               text of button labels and step numbers.
     * - i18n.stepNums:   Array\<String\> - Provide a list of strings to be shown as
     *                               the step number, based on index of array. Unicode
     *                               characters are supported. (e.g., ['&#x4e00;',
     *                               '&#x4e8c;', '&#x4e09;']) If there are more steps
     *                               than provided numbers, Arabic numerals
     *                               ('4', '5', '6', etc.) will be used as default.
     * // =========
     * // CALLBACKS
     * // =========
     * - onNext:          Function - Invoked after every click on a "Next" button.
     * - onPrev:          Function - Invoked after every click on a "Prev" button.
     * - onStart:         Function - Invoked when the tour is started.
     * - onEnd:           Function - Invoked when the tour ends.
     * - onClose:         Function - Invoked when the user closes the tour before finishing.
     * - onError:         Function - Invoked when the specified target element doesn't exist on the page.
     *
     * // ====
     * // I18N
     * // ====
     * i18n:              OBJECT      - For i18n purposes. Allows you to change the text
     *                                  of button labels and step numbers.
     * i18n.nextBtn:      STRING      - Label for next button
     * i18n.prevBtn:      STRING      - Label for prev button
     * i18n.doneBtn:      STRING      - Label for done button
     * i18n.skipBtn:      STRING      - Label for skip button
     * i18n.closeTooltip: STRING      - Text for close button tooltip
     * i18n.stepNums:   ARRAY<STRING> - Provide a list of strings to be shown as
     *                                  the step number, based on index of array. Unicode
     *                                  characters are supported. (e.g., ['&#x4e00;',
     *                                  '&#x4e8c;', '&#x4e09;']) If there are more steps
     *                                  than provided numbers, Arabic numerals
     *                                  ('4', '5', '6', etc.) will be used as default.
     * </pre>
     *
     * @example hopscotch.configure({ scrollDuration: 1000, scrollTopMargin: 150 });
     * @example
     * hopscotch.configure({
     *   scrollTopMargin: 150,
     *   onStart: function() {
     *     alert("Have fun!");
     *   },
     *   i18n: {
     *     nextBtn: 'Forward',
     *     prevBtn: 'Previous'
     *     closeTooltip: 'Quit'
     *   }
     * });
     *
     * @param {Object} options A hash of configuration options.
     * @returns {Object} Hopscotch
     */
    this.configure = function(options) {
      return _configure.call(this, options, false);
    };

    /**
     * Set the template that should be used for rendering Hopscotch bubbles.
     * If a string, it's assumed your template is available in the
     * hopscotch.templates namespace.
     *
     * @param {String|Function(obj)} The template to use for rendering.
     * @returns {Object} The Hopscotch object (for chaining).
     */
    this.setRenderer = function(render){
      var typeOfRender = typeof render;

      if(typeOfRender === 'string'){
        templateToUse = render;
        customRenderer = undefined;
      }
      else if(typeOfRender === 'function'){
        customRenderer = render;
      }
      return this;
    };

    /**
     * Sets the escaping method to be used by JST templates.
     *
     * @param {Function} - The escape method to use.
     * @returns {Object} The Hopscotch object (for chaining).
     */
    this.setEscaper = function(esc){
      if (typeof esc === 'function'){
        customEscape = esc;
      }
      return this;
    };

    init.call(this, initOptions);
  };

  winHopscotch = new Hopscotch();

// Template includes, placed inside a closure to ensure we don't
// end up declaring our shim globally.
(function(){
var _ = {};
/*
 * Adapted from the Underscore.js framework. Check it out at
 * https://github.com/jashkenas/underscore
 */
_.escape = function(str){
  if(customEscape){ return customEscape(str); }
  
  if(str == null) return '';
  return ('' + str).replace(new RegExp('[&<>"\']', 'g'), function(match){
    if(match == '&'){ return '&amp;' }
    if(match == '<'){ return '&lt;' }
    if(match == '>'){ return '&gt;' }
    if(match == '"'){ return '&quot;' }
    if(match == "'"){ return '&#x27;' }
  });
}

this["templates"] = this["templates"] || {};

this["templates"]["bubble_default"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }


  function optEscape(str, unsafe){
    if(unsafe){
      return _.escape(str);
    }
    return str;
  }
;
__p += '\n';

var i18n = data.i18n;
var buttons = data.buttons;
var step = data.step;
var tour = data.tour;
;
__p += '\n<div class="hopscotch-bubble-container" style="width: ' +
((__t = ( step.width )) == null ? '' : __t) +
'px; padding: ' +
((__t = ( step.padding )) == null ? '' : __t) +
'px;">\n  ';
 if(tour.isTour){ ;
__p += '<span class="hopscotch-bubble-number">' +
((__t = ( i18n.stepNum )) == null ? '' : __t) +
'</span>';
 } ;
__p += '\n  <div class="hopscotch-bubble-content">\n    ';
 if(step.title !== ''){ ;
__p += '<h3 class="hopscotch-title">' +
((__t = ( optEscape(step.title, tour.unsafe) )) == null ? '' : __t) +
'</h3>';
 } ;
__p += '\n    ';
 if(step.content  !== ''){ ;
__p += '<div class="hopscotch-content">' +
((__t = ( optEscape(step.content, tour.unsafe) )) == null ? '' : __t) +
'</div>';
 } ;
__p += '\n  </div>\n  <div class="hopscotch-actions">\n    ';
 if(buttons.showPrev){ ;
__p += '<button class="hopscotch-nav-button prev hopscotch-prev">' +
((__t = ( i18n.prevBtn )) == null ? '' : __t) +
'</button>';
 } ;
__p += '\n    ';
 if(buttons.showCTA){ ;
__p += '<button class="hopscotch-nav-button next hopscotch-cta">' +
((__t = ( buttons.ctaLabel )) == null ? '' : __t) +
'</button>';
 } ;
__p += '\n    ';
 if(buttons.showNext){ ;
__p += '<button class="hopscotch-nav-button next hopscotch-next">' +
((__t = ( i18n.nextBtn )) == null ? '' : __t) +
'</button>';
 } ;
__p += '\n  </div>\n  ';
 if(buttons.showClose){ ;
__p += '<button class="hopscotch-bubble-close hopscotch-close">' +
((__t = ( i18n.closeTooltip )) == null ? '' : __t) +
'</button>';
 } ;
__p += '\n</div>\n<div class="hopscotch-bubble-arrow-container hopscotch-arrow">\n  <div class="hopscotch-bubble-arrow-border"></div>\n  <div class="hopscotch-bubble-arrow"></div>\n</div>\n';
return __p
};
}.call(winHopscotch));

  return winHopscotch;

})));
/*
@license textAngular
Author : Austin Anderson
License : 2013 MIT
Version 1.5.16

See README.md or https://github.com/fraywing/textAngular/wiki for requirements and use.
*/

/*
Commonjs package manager support (eg componentjs).
*/


"use strict";// NOTE: textAngularVersion must match the Gruntfile.js 'setVersion' task.... and have format v/d+./d+./d+
var textAngularVersion = 'v1.5.16';   // This is automatically updated during the build process to the current release!


// IE version detection - http://stackoverflow.com/questions/4169160/javascript-ie-detection-why-not-use-simple-conditional-comments
// We need this as IE sometimes plays funny tricks with the contenteditable.
// ----------------------------------------------------------
// If you're not in IE (or IE version is less than 5) then:
// ie === undefined
// If you're in IE (>=5) then you can determine which version:
// ie === 7; // IE7
// Thus, to detect IE:
// if (ie) {}
// And to detect the version:
// ie === 6 // IE6
// ie > 7 // IE8, IE9, IE10 ...
// ie < 9 // Anything less than IE9
// ----------------------------------------------------------
/* istanbul ignore next: untestable browser check */
var _browserDetect = {
	ie: (function(){
		var undef,
			v = 3,
			div = document.createElement('div'),
			all = div.getElementsByTagName('i');

		while (
			div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
			all[0]
		);

		return v > 4 ? v : undef;
	}()),
	webkit: /AppleWebKit\/([\d.]+)/i.test(navigator.userAgent),
	isFirefox: navigator.userAgent.toLowerCase().indexOf('firefox') > -1
};

// Global to textAngular to measure performance where needed
/* istanbul ignore next: untestable browser check */
var performance = performance || {};
/* istanbul ignore next: untestable browser check */
performance.now = (function() {
	return performance.now       ||
		performance.mozNow    ||
		performance.msNow     ||
		performance.oNow      ||
		performance.webkitNow ||
		function() { return new Date().getTime(); };
})();
// usage is:
// var t0 = performance.now();
// doSomething();
// var t1 = performance.now();
// console.log('Took', (t1 - t0).toFixed(4), 'milliseconds to do something!');
//

// turn html into pure text that shows visiblity
function stripHtmlToText(html)
{
	var tmp = document.createElement("DIV");
	tmp.innerHTML = html;
	var res = tmp.textContent || tmp.innerText || '';
	res.replace('\u200B', ''); // zero width space
	res = res.trim();
	return res;
}
// get html
function getDomFromHtml(html)
{
	var tmp = document.createElement("DIV");
	tmp.innerHTML = html;
	return tmp;
}


// Global to textAngular REGEXP vars for block and list elements.

var BLOCKELEMENTS = /^(address|article|aside|audio|blockquote|canvas|center|dd|div|dl|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|header|hgroup|hr|noscript|ol|output|p|pre|section|table|tfoot|ul|video)$/i;
var LISTELEMENTS = /^(ul|li|ol)$/i;
// updated VALIDELEMENTS to include #text and span so that we can use nodeName instead of tagName
var VALIDELEMENTS = /^(#text|span|address|article|aside|audio|blockquote|canvas|center|dd|div|dl|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|header|hgroup|hr|noscript|ol|output|p|pre|section|table|tfoot|ul|video|li)$/i;


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim#Compatibility
/* istanbul ignore next: trim shim for older browsers */
if (!String.prototype.trim) {
	String.prototype.trim = function () {
		return this.replace(/^\s+|\s+$/g, '');
	};
}

/*
	Custom stylesheet for the placeholders rules.
	Credit to: http://davidwalsh.name/add-rules-stylesheets
*/
var sheet, addCSSRule, removeCSSRule, _addCSSRule, _removeCSSRule, _getRuleIndex;
/* istanbul ignore else: IE <8 test*/
if(_browserDetect.ie > 8 || _browserDetect.ie === undefined){
	var _sheets = document.styleSheets;
	/* istanbul ignore next: preference for stylesheet loaded externally */
	for(var i = 0; i < _sheets.length; i++){
		if(_sheets[i].media.length === 0 || _sheets[i].media.mediaText.match(/(all|screen)/ig)){
			if(_sheets[i].href){
				if(_sheets[i].href.match(/textangular\.(min\.|)css/ig)){
					sheet = _sheets[i];
					break;
				}
			}
		}
	}
	/* istanbul ignore next: preference for stylesheet loaded externally */
	if(!sheet){
		// this sheet is used for the placeholders later on.
		sheet = (function() {
			// Create the <style> tag
			var style = document.createElement("style");
			/* istanbul ignore else : WebKit hack :( */
			if(_browserDetect.webkit) style.appendChild(document.createTextNode(""));

			// Add the <style> element to the page, add as first so the styles can be overridden by custom stylesheets
			document.getElementsByTagName('head')[0].appendChild(style);

			return style.sheet;
		})();
	}

	// use as: addCSSRule("header", "float: left");
	addCSSRule = function(selector, rules) {
		return _addCSSRule(sheet, selector, rules);
	};
	_addCSSRule = function(_sheet, selector, rules){
		var insertIndex;
		var insertedRule;
		// This order is important as IE 11 has both cssRules and rules but they have different lengths - cssRules is correct, rules gives an error in IE 11
		/* istanbul ignore next: browser catches */
		if(_sheet.cssRules) insertIndex = Math.max(_sheet.cssRules.length - 1, 0);
		else if(_sheet.rules) insertIndex = Math.max(_sheet.rules.length - 1, 0);

		/* istanbul ignore else: untestable IE option */
		if(_sheet.insertRule) {
			_sheet.insertRule(selector + "{" + rules + "}", insertIndex);
		}
		else {
			_sheet.addRule(selector, rules, insertIndex);
		}
		/* istanbul ignore next: browser catches */
		if(sheet.rules) insertedRule = sheet.rules[insertIndex];
		else if(sheet.cssRules) insertedRule = sheet.cssRules[insertIndex];
		// return the inserted stylesheet rule
		return insertedRule;
	};

	_getRuleIndex = function(rule, rules) {
		var i, ruleIndex;
		for (i=0; i < rules.length; i++) {
			/* istanbul ignore else: check for correct rule */
			if (rules[i].cssText === rule.cssText) {
				ruleIndex = i;
				break;
			}
		}
		return ruleIndex;
	};

	removeCSSRule = function(rule){
		_removeCSSRule(sheet, rule);
	};
	/* istanbul ignore next: tests are browser specific */
	_removeCSSRule = function(sheet, rule){
		var rules = sheet.cssRules || sheet.rules;
		if(!rules || rules.length === 0) return;
		var ruleIndex = _getRuleIndex(rule, rules);
		if(sheet.removeRule){
			sheet.removeRule(ruleIndex);
		}else{
			sheet.deleteRule(ruleIndex);
		}
	};
}

angular.module('textAngular.factories', [])
.factory('taBrowserTag', [function(){
    return function(tag){
        /* istanbul ignore next: ie specific test */
        if(!tag) return (_browserDetect.ie <= 8)? 'P' : 'p';
        else if(tag === '') return (_browserDetect.ie === undefined)? 'div' : (_browserDetect.ie <= 8)? 'P' : 'p';
        else return (_browserDetect.ie <= 8)? tag.toUpperCase() : tag;
    };
}]).factory('taApplyCustomRenderers', ['taCustomRenderers', 'taDOM', function(taCustomRenderers, taDOM){
    return function(val){
        var element = angular.element('<div></div>');
        element[0].innerHTML = val;

        angular.forEach(taCustomRenderers, function(renderer){
            var elements = [];
            // get elements based on what is defined. If both defined do secondary filter in the forEach after using selector string
            if(renderer.selector && renderer.selector !== '')
                elements = element.find(renderer.selector);
            /* istanbul ignore else: shouldn't fire, if it does we're ignoring everything */
            else if(renderer.customAttribute && renderer.customAttribute !== '')
                elements = taDOM.getByAttribute(element, renderer.customAttribute);
            // process elements if any found
            angular.forEach(elements, function(_element){
                _element = angular.element(_element);
                if(renderer.selector && renderer.selector !== '' && renderer.customAttribute && renderer.customAttribute !== ''){
                    if(_element.attr(renderer.customAttribute) !== undefined) renderer.renderLogic(_element);
                } else renderer.renderLogic(_element);
            });
        });

        return element[0].innerHTML;
    };
}]).factory('taFixChrome', function(){
    // get whaterever rubbish is inserted in chrome
    // should be passed an html string, returns an html string
    var taFixChrome = function(html, keepStyles){
        if(!html || !angular.isString(html) || html.length <= 0) return html;
        // grab all elements with a style attibute
        // a betterSpanMatch matches only a style=... with matching quotes
        // this captures the whole:
        // 'style="background-color: rgb(255, 255, 255);"'
        var betterSpanMatch = /style\s?=\s?(["'])(?:(?=(\\?))\2.)*?\1/ig;
        // where the original spanMatch = /<([^>\/]+?)style=("([^\"]+)"|'([^']+)')([^>]*)>/ig;
        // captures too much and includes the front tag!
        var spanMatch = /<([^>\/]+?)style=("([^\"]+)"|'([^']+)')([^>]*)>/ig;
        var appleConvertedSpaceMatch = /<span class="Apple-converted-space">([^<]+)<\/span>/ig;
        var match, styleVal, appleSpaceVal, newTag, finalHtml = '', lastIndex = 0;
        // remove all the Apple-converted-space spans and replace with the content of the span
        //console.log('before:', html);
        /* istanbul ignore next: apple-contereted-space span match */
        while(match = appleConvertedSpaceMatch.exec(html)){
            appleSpaceVal = match[1];
            appleSpaceVal = appleSpaceVal.replace(/&nbsp;/ig, ' ');
            finalHtml += html.substring(lastIndex, match.index) + appleSpaceVal;
            lastIndex = match.index + match[0].length;
        }
        /* istanbul ignore next: apple-contereted-space span has matched */
        if (lastIndex) {
            // modified....
            finalHtml += html.substring(lastIndex);
            html=finalHtml;
            finalHtml='';
            lastIndex=0;
        }
        /////////////////////////////////////////////////////////////
        //
        // Allow control of this modification
        // taKeepStyles: False - removes these modification
        //
        // taFixChrome removes the following styles:
        //    font-family: inherit;
        //    line-height: <number>
        //    color: inherit;
        //    color: rgb( <rgb-component>#{3} )
        //    background-color: rgb( <rgb-component>#{3} )
        //
        /////////////////////////////////////////////////////////////
        if (!keepStyles) {
            while (match = betterSpanMatch.exec(html)) {
                finalHtml += html.substring(lastIndex, match.index-1);
                styleVal = match[0];
                // test for chrome inserted junk
                match = /font-family: inherit;|line-height: 1.[0-9]{3,12};|color: inherit; line-height: 1.1;|color: rgb\(\d{1,3}, \d{1,3}, \d{1,3}\);|background-color: rgb\(\d{1,3}, \d{1,3}, \d{1,3}\);/gi.exec(styleVal);
                if (match) {
                    styleVal = styleVal.replace(/( |)font-family: inherit;|( |)line-height: 1.[0-9]{3,12};|( |)color: inherit;|( |)color: rgb\(\d{1,3}, \d{1,3}, \d{1,3}\);|( |)background-color: rgb\(\d{1,3}, \d{1,3}, \d{1,3}\);/ig, '');
                    //console.log(styleVal, styleVal.length);
                    if (styleVal.length > 8) {
                        finalHtml += ' ' + styleVal;
                    }
                } else {
                    finalHtml += ' ' + styleVal;
                }
                lastIndex = betterSpanMatch.lastIndex;
            }
            finalHtml += html.substring(lastIndex);
        }
        //console.log('final:', finalHtml);
        // only replace when something has changed, else we get focus problems on inserting lists
        if(lastIndex > 0){
            // replace all empty strings
            var fe = finalHtml.replace(/<span\s?>(.*?)<\/span>(<br(\/|)>|)/ig, '$1');
            return fe;
        } else return html;
    };
    return taFixChrome;
}).factory('taSanitize', ['$sanitize', function taSanitizeFactory($sanitize){

    var convert_infos = [
        {
            property: 'font-weight',
            values: [ 'bold' ],
            tag: 'b'
        },
        {
            property: 'font-style',
            values: [ 'italic' ],
            tag: 'i'
        }
    ];

    var styleMatch = [];
    for(var i = 0; i < convert_infos.length; i++){
        var _partialStyle = '(' + convert_infos[i].property + ':\\s*(';
        for(var j = 0; j < convert_infos[i].values.length; j++){
            /* istanbul ignore next: not needed to be tested yet */
            if(j > 0) _partialStyle += '|';
            _partialStyle += convert_infos[i].values[j];
        }
        _partialStyle += ');)';
        styleMatch.push(_partialStyle);
    }
    var styleRegexString = '(' + styleMatch.join('|') + ')';

    function wrapNested(html, wrapTag) {
        var depth = 0;
        var lastIndex = 0;
        var match;
        var tagRegex = /<[^>]*>/ig;
        while(match = tagRegex.exec(html)){
            lastIndex = match.index;
            if(match[0].substr(1, 1) === '/'){
                if(depth === 0) break;
                else depth--;
            }else depth++;
        }
        return wrapTag +
            html.substring(0, lastIndex) +
            // get the start tags reversed - this is safe as we construct the strings with no content except the tags
            angular.element(wrapTag)[0].outerHTML.substring(wrapTag.length) +
            html.substring(lastIndex);
    }

    function transformLegacyStyles(html){
        if(!html || !angular.isString(html) || html.length <= 0) return html;
        var i;
        var styleElementMatch = /<([^>\/]+?)style=("([^"]+)"|'([^']+)')([^>]*)>/ig;
        var match, subMatch, styleVal, newTag, lastNewTag = '', newHtml, finalHtml = '', lastIndex = 0;
        while(match = styleElementMatch.exec(html)){
            // one of the quoted values ' or "
            /* istanbul ignore next: quotations match */
            styleVal = match[3] || match[4];
            var styleRegex = new RegExp(styleRegexString, 'i');
            // test for style values to change
            if(angular.isString(styleVal) && styleRegex.test(styleVal)){
                // remove build tag list
                newTag = '';
                // init regex here for exec
                var styleRegexExec = new RegExp(styleRegexString, 'ig');
                // find relevand tags and build a string of them
                while(subMatch = styleRegexExec.exec(styleVal)){
                    for(i = 0; i < convert_infos.length; i++){
                        if(!!subMatch[(i*2) + 2]){
                            newTag += '<' + convert_infos[i].tag + '>';
                        }
                    }
                }
                // recursively find more legacy styles in html before this tag and after the previous match (if any)
                newHtml = transformLegacyStyles(html.substring(lastIndex, match.index));
                // build up html
                if(lastNewTag.length > 0){
                    finalHtml += wrapNested(newHtml, lastNewTag);
                }else finalHtml += newHtml;
                // grab the style val without the transformed values
                styleVal = styleVal.replace(new RegExp(styleRegexString, 'ig'), '');
                // build the html tag
                finalHtml += '<' + match[1].trim();
                if(styleVal.length > 0) finalHtml += ' style="' + styleVal + '"';
                finalHtml += match[5] + '>';
                // update the start index to after this tag
                lastIndex = match.index + match[0].length;
                lastNewTag = newTag;
            }
        }
        if(lastNewTag.length > 0){
            finalHtml += wrapNested(html.substring(lastIndex), lastNewTag);
        }
        else finalHtml += html.substring(lastIndex);
        return finalHtml;
    }

    function transformLegacyAttributes(html){
        if(!html || !angular.isString(html) || html.length <= 0) return html;
        // replace all align='...' tags with text-align attributes
        var attrElementMatch = /<([^>\/]+?)align=("([^"]+)"|'([^']+)')([^>]*)>/ig;
        var match, finalHtml = '', lastIndex = 0;
        // match all attr tags
        while(match = attrElementMatch.exec(html)){
            // add all html before this tag
            finalHtml += html.substring(lastIndex, match.index);
            // record last index after this tag
            lastIndex = match.index + match[0].length;
            // construct tag without the align attribute
            var newTag = '<' + match[1] + match[5];
            // add the style attribute
            if(/style=("([^"]+)"|'([^']+)')/ig.test(newTag)){
                /* istanbul ignore next: quotations match */
                newTag = newTag.replace(/style=("([^"]+)"|'([^']+)')/i, 'style="$2$3 text-align:' + (match[3] || match[4]) + ';"');
            }else{
                /* istanbul ignore next: quotations match */
                newTag += ' style="text-align:' + (match[3] || match[4]) + ';"';
            }
            newTag += '>';
            // add to html
            finalHtml += newTag;
        }
        // return with remaining html
        return finalHtml + html.substring(lastIndex);
    }

    // use precompiled regexp for speed
    var rsb1 = new RegExp(/<span id="selectionBoundary_\d+_\d+" class="rangySelectionBoundary">[^<>]+?<\/span>/ig);
    var rsb2 = new RegExp(/<span class="rangySelectionBoundary" id="selectionBoundary_\d+_\d+">[^<>]+?<\/span>/ig);
    var rsb3 = new RegExp(/<span id="selectionBoundary_\d+_\d+" class="rangySelectionBoundary".*?>[^<>]+?<\/span>/ig);

    return function taSanitize(unsafe, oldsafe, ignore){
        // unsafe html should NEVER built into a DOM object via angular.element. This allows XSS to be inserted and run.
        if ( !ignore ) {
            try {
                unsafe = transformLegacyStyles(unsafe);
            } catch (e) {
            }
        }

        // unsafe and oldsafe should be valid HTML strings
        // any exceptions (lets say, color for example) should be made here but with great care
        // setup unsafe element for modification
        unsafe = transformLegacyAttributes(unsafe);

        // we had an issue in the past, where we dumped a whole bunch of <span>'s into the content...
        // so we remove them here
        // IN A FUTURE release this can be removed after all have updated through release 1.5.9
        if (unsafe) {
            try {
                unsafe = unsafe.replace(rsb1, '');
                unsafe = unsafe.replace(rsb2, '');
                unsafe = unsafe.replace(rsb1, '');
                unsafe = unsafe.replace(rsb3, '');
            } catch (e) {
            }
        }

        var safe;
        try {
            safe = $sanitize(unsafe);
            // do this afterwards, then the $sanitizer should still throw for bad markup
            if(ignore) safe = unsafe;
        } catch (e){
            safe = oldsafe || '';
        }

        // Do processing for <pre> tags, removing tabs and return carriages outside of them

        var _preTags = safe.match(/(<pre[^>]*>.*?<\/pre[^>]*>)/ig);
        var processedSafe = safe.replace(/(&#(9|10);)*/ig, '');
        var re = /<pre[^>]*>.*?<\/pre[^>]*>/ig;
        var index = 0;
        var lastIndex = 0;
        var origTag;
        safe = '';
        while((origTag = re.exec(processedSafe)) !== null && index < _preTags.length){
            safe += processedSafe.substring(lastIndex, origTag.index) + _preTags[index];
            lastIndex = origTag.index + origTag[0].length;
            index++;
        }
        return safe + processedSafe.substring(lastIndex);
    };
}]).factory('taToolExecuteAction', ['$q', '$log', function($q, $log){
    // this must be called on a toolScope or instance
    return function(editor){
        if(editor !== undefined) this.$editor = function(){ return editor; };
        var deferred = $q.defer(),
            promise = deferred.promise,
            _editor = this.$editor();
        // pass into the action the deferred function and also the function to reload the current selection if rangy available
        var result;
        try{
            result = this.action(deferred, _editor.startAction());
            // We set the .finally callback here to make sure it doesn't get executed before any other .then callback.
            promise['finally'](function(){
                _editor.endAction.call(_editor);
            });
        }catch(exc){
            $log.error(exc);
        }
        if(result || result === undefined){
            // if true or undefined is returned then the action has finished. Otherwise the deferred action will be resolved manually.
            deferred.resolve();
        }
    };
}]);

angular.module('textAngular.DOM', ['textAngular.factories'])
.factory('taExecCommand', ['taSelection', 'taBrowserTag', '$document', function(taSelection, taBrowserTag, $document){
    var listToDefault = function(listElement, defaultWrap){
        var $target, i;
        // if all selected then we should remove the list
        // grab all li elements and convert to taDefaultWrap tags
        var children = listElement.find('li');
        for(i = children.length - 1; i >= 0; i--){
            $target = angular.element('<' + defaultWrap + '>' + children[i].innerHTML + '</' + defaultWrap + '>');
            listElement.after($target);
        }
        listElement.remove();
        taSelection.setSelectionToElementEnd($target[0]);
    };
    var listElementToSelfTag = function(list, listElement, selfTag, bDefault, defaultWrap){
        var $target, i;
        // if all selected then we should remove the list
        // grab all li elements
        var priorElement;
        var nextElement;
        var children = list.find('li');
        var foundIndex;
        for (i = 0; i<children.length; i++) {
            if (children[i].outerHTML === listElement[0].outerHTML) {
                // found it...
                foundIndex = i;
                if (i>0) {
                    priorElement = children[i-1];
                }
                if (i+1<children.length) {
                    nextElement = children[i+1];
                }
                break;
            }
        }
        //console.log('listElementToSelfTag', list, listElement, selfTag, bDefault, priorElement, nextElement);
        // un-list the listElement
        var html = '';
        if (bDefault) {
            html += '<' + defaultWrap + '>' + listElement[0].innerHTML + '</' + defaultWrap + '>';
        } else {
            html += '<' + taBrowserTag(selfTag) + '>';
            html += '<li>' + listElement[0].innerHTML + '</li>';
            html += '</' + taBrowserTag(selfTag) + '>';
        }
        $target = angular.element(html);
        //console.log('$target', $target[0]);
        if (!priorElement) {
            // this is the first the list, so we just remove it...
            listElement.remove();
            list.after(angular.element(list[0].outerHTML));
            list.after($target);
            list.remove();
            taSelection.setSelectionToElementEnd($target[0]);
            return;
        } else if (!nextElement) {
            // this is the last in the list, so we just remove it..
            listElement.remove();
            list.after($target);
            taSelection.setSelectionToElementEnd($target[0]);
        } else {
            var p = list.parent();
            // okay it was some where in the middle... so we need to break apart the list...
            var html1 = '';
            var listTag = list[0].nodeName.toLowerCase();
            html1 += '<' + listTag + '>';
            for(i = 0; i < foundIndex; i++){
                html1 += '<li>' + children[i].innerHTML + '</li>';
            }
            html1 += '</' + listTag + '>';
            var html2 = '';
            html2 += '<' + listTag + '>';
            for(i = foundIndex+1; i < children.length; i++){
                html2 += '<li>' + children[i].innerHTML + '</li>';
            }
            html2 += '</' + listTag + '>';
            //console.log(html1, $target[0], html2);
            list.after(angular.element(html2));
            list.after($target);
            list.after(angular.element(html1));
            list.remove();
            //console.log('parent ******XXX*****', p[0]);
            taSelection.setSelectionToElementEnd($target[0]);
        }
    };
    var listElementsToSelfTag = function(list, listElements, selfTag, bDefault, defaultWrap){
        var $target, i, j, p;
        // grab all li elements
        var priorElement;
        var afterElement;
        //console.log('list:', list, 'listElements:', listElements, 'selfTag:', selfTag, 'bDefault:', bDefault);
        var children = list.find('li');
        var foundIndexes = [];
        for (i = 0; i<children.length; i++) {
            for (j = 0; j<listElements.length; j++) {
                if (children[i].isEqualNode(listElements[j])) {
                    // found it...
                    foundIndexes[j] = i;
                }
            }
        }
        if (foundIndexes[0] > 0) {
            priorElement = children[foundIndexes[0] - 1];
        }
        if (foundIndexes[listElements.length-1] + 1 < children.length) {
            afterElement = children[foundIndexes[listElements.length-1] + 1];
        }
        //console.log('listElementsToSelfTag', list, listElements, selfTag, bDefault, !priorElement, !afterElement, foundIndexes[listElements.length-1], children.length);
        // un-list the listElements
        var html = '';
        if (bDefault) {
            for (j = 0; j < listElements.length; j++) {
                html += '<' + defaultWrap + '>' + listElements[j].innerHTML + '</' + defaultWrap + '>';
                listElements[j].remove();
            }
        } else {
            html += '<' + taBrowserTag(selfTag) + '>';
            for (j = 0; j < listElements.length; j++) {
                html += listElements[j].outerHTML;
                listElements[j].remove();
            }
            html += '</' + taBrowserTag(selfTag) + '>';
        }
        $target = angular.element(html);
        if (!priorElement) {
            // this is the first the list, so we just remove it...
            list.after(angular.element(list[0].outerHTML));
            list.after($target);
            list.remove();
            taSelection.setSelectionToElementEnd($target[0]);
            return;
        } else if (!afterElement) {
            // this is the last in the list, so we just remove it..
            list.after($target);
            taSelection.setSelectionToElementEnd($target[0]);
            return;
        } else {
            // okay it was some where in the middle... so we need to break apart the list...
            var html1 = '';
            var listTag = list[0].nodeName.toLowerCase();
            html1 += '<' + listTag + '>';
            for(i = 0; i < foundIndexes[0]; i++){
                html1 += '<li>' + children[i].innerHTML + '</li>';
            }
            html1 += '</' + listTag + '>';
            var html2 = '';
            html2 += '<' + listTag + '>';
            for(i = foundIndexes[listElements.length-1]+1; i < children.length; i++){
                html2 += '<li>' + children[i].innerHTML + '</li>';
            }
            html2 += '</' + listTag + '>';
            list.after(angular.element(html2));
            list.after($target);
            list.after(angular.element(html1));
            list.remove();
            //console.log('parent ******YYY*****', list.parent()[0]);
            taSelection.setSelectionToElementEnd($target[0]);
        }
    };
    var selectLi = function(liElement){
        if(/(<br(|\/)>)$/i.test(liElement.innerHTML.trim())) taSelection.setSelectionBeforeElement(angular.element(liElement).find("br")[0]);
        else taSelection.setSelectionToElementEnd(liElement);
    };
    var listToList = function(listElement, newListTag){
        var $target = angular.element('<' + newListTag + '>' + listElement[0].innerHTML + '</' + newListTag + '>');
        listElement.after($target);
        listElement.remove();
        selectLi($target.find('li')[0]);
    };
    var childElementsToList = function(elements, listElement, newListTag){
        var html = '';
        for(var i = 0; i < elements.length; i++){
            html += '<' + taBrowserTag('li') + '>' + elements[i].innerHTML + '</' + taBrowserTag('li') + '>';
        }
        var $target = angular.element('<' + newListTag + '>' + html + '</' + newListTag + '>');
        listElement.after($target);
        listElement.remove();
        selectLi($target.find('li')[0]);
    };
    var turnBlockIntoBlocks = function(element, options) {
        for(var i = 0; i<element.childNodes.length; i++) {
            var _n = element.childNodes[i];
            /* istanbul ignore next - more complex testing*/
            if (_n.tagName && _n.tagName.match(BLOCKELEMENTS)) {
                turnBlockIntoBlocks(_n, options);
            }
        }
        /* istanbul ignore next - very rare condition that we do not test*/
        if (element.parentNode === null) {
            // nothing left to do..
            return element;
        }
        /* istanbul ignore next - not sure have to test this */
        if (options === '<br>'){
            return element;
        }
        else {
            var $target = angular.element(options);
            $target[0].innerHTML = element.innerHTML;
            element.parentNode.insertBefore($target[0], element);
            element.parentNode.removeChild(element);
            return $target;
        }
    };
    return function(taDefaultWrap, topNode){
        // NOTE: here we are dealing with the html directly from the browser and not the html the user sees.
        // IF you want to modify the html the user sees, do it when the user does a switchView
        taDefaultWrap = taBrowserTag(taDefaultWrap);
        return function(command, showUI, options, defaultTagAttributes){
            var i, $target, html, _nodes, next, optionsTagName, selectedElement, ourSelection;
            var defaultWrapper = angular.element('<' + taDefaultWrap + '>');
            try{
                if (taSelection.getSelection) {
                    ourSelection = taSelection.getSelection();
                }
                selectedElement = taSelection.getSelectionElement();
                // special checks and fixes when we are selecting the whole container
                var __h, _innerNode;
                /* istanbul ignore next */
                if (selectedElement.tagName !== undefined) {
                    if (selectedElement.tagName.toLowerCase() === 'div' &&
                        /taTextElement.+/.test(selectedElement.id) &&
                        ourSelection && ourSelection.start &&
                        ourSelection.start.offset === 1 &&
                        ourSelection.end.offset === 1) {
                        // opps we are actually selecting the whole container!
                        //console.log('selecting whole container!');
                        __h = selectedElement.innerHTML;
                        if (/<br>/i.test(__h)) {
                            // Firefox adds <br>'s and so we remove the <br>
                            __h = __h.replace(/<br>/i, '&#8203;');  // no space-space
                        }
                        if (/<br\/>/i.test(__h)) {
                            // Firefox adds <br/>'s and so we remove the <br/>
                            __h = __h.replace(/<br\/>/i, '&#8203;');  // no space-space
                        }
                        // remove stacked up <span>'s
                        if (/<span>(<span>)+/i.test(__h)) {
                            __h = __.replace(/<span>(<span>)+/i, '<span>');
                        }
                        // remove stacked up </span>'s
                        if (/<\/span>(<\/span>)+/i.test(__h)) {
                            __h = __.replace(/<\/span>(<\/span>)+/i, '<\/span>');
                        }
                        if (/<span><\/span>/i.test(__h)) {
                            // if we end up with a <span></span> here we remove it...
                            __h = __h.replace(/<span><\/span>/i, '');
                        }
                        //console.log('inner whole container', selectedElement.childNodes);
                        _innerNode = '<div>' + __h + '</div>';
                        selectedElement.innerHTML = _innerNode;
                        taSelection.setSelectionToElementEnd(selectedElement.childNodes[0]);
                        selectedElement = taSelection.getSelectionElement();
                    } else if (selectedElement.tagName.toLowerCase() === 'span' &&
                        ourSelection && ourSelection.start &&
                        ourSelection.start.offset === 1 &&
                        ourSelection.end.offset === 1) {
                        // just a span -- this is a problem...
                        //console.log('selecting span!');
                        __h = selectedElement.innerHTML;
                        if (/<br>/i.test(__h)) {
                            // Firefox adds <br>'s and so we remove the <br>
                            __h = __h.replace(/<br>/i, '&#8203;');  // no space-space
                        }
                        if (/<br\/>/i.test(__h)) {
                            // Firefox adds <br/>'s and so we remove the <br/>
                            __h = __h.replace(/<br\/>/i, '&#8203;');  // no space-space
                        }
                        // remove stacked up <span>'s
                        if (/<span>(<span>)+/i.test(__h)) {
                            __h = __.replace(/<span>(<span>)+/i, '<span>');
                        }
                        // remove stacked up </span>'s
                        if (/<\/span>(<\/span>)+/i.test(__h)) {
                            __h = __.replace(/<\/span>(<\/span>)+/i, '<\/span>');
                        }
                        if (/<span><\/span>/i.test(__h)) {
                            // if we end up with a <span></span> here we remove it...
                            __h = __h.replace(/<span><\/span>/i, '');
                        }
                        //console.log('inner span', selectedElement.childNodes);
                        // we wrap this in a <div> because otherwise the browser get confused when we attempt to select the whole node
                        // and the focus is not set correctly no matter what we do
                        _innerNode = '<div>' + __h + '</div>';
                        selectedElement.innerHTML = _innerNode;
                        taSelection.setSelectionToElementEnd(selectedElement.childNodes[0]);
                        selectedElement = taSelection.getSelectionElement();
                        //console.log(selectedElement.innerHTML);
                    } else if (selectedElement.tagName.toLowerCase() === 'p' &&
                        ourSelection && ourSelection.start &&
                        ourSelection.start.offset === 1 &&
                        ourSelection.end.offset === 1) {
                        //console.log('p special');
                        // we need to remove the </br> that firefox adds!
                        __h = selectedElement.innerHTML;
                        if (/<br>/i.test(__h)) {
                            // Firefox adds <br>'s and so we remove the <br>
                            __h = __h.replace(/<br>/i, '&#8203;');  // no space-space
                            selectedElement.innerHTML = __h;
                        }
                    } else if (selectedElement.tagName.toLowerCase() === 'li' &&
                        ourSelection && ourSelection.start &&
                        ourSelection.start.offset === ourSelection.end.offset) {
                        // we need to remove the </br> that firefox adds!
                        __h = selectedElement.innerHTML;
                        if (/<br>/i.test(__h)) {
                            // Firefox adds <br>'s and so we remove the <br>
                            __h = __h.replace(/<br>/i, '');  // nothing
                            selectedElement.innerHTML = __h;
                        }
                    }
                }
            }catch(e){}
            //console.log('************** selectedElement:', selectedElement);
            /* istanbul ignore if: */
            if (!selectedElement){return;}
            var $selected = angular.element(selectedElement);
            var tagName = (selectedElement && selectedElement.tagName && selectedElement.tagName.toLowerCase()) ||
                /* istanbul ignore next: */ "";
            if(command.toLowerCase() === 'insertorderedlist' || command.toLowerCase() === 'insertunorderedlist'){
                var selfTag = taBrowserTag((command.toLowerCase() === 'insertorderedlist')? 'ol' : 'ul');
                var selectedElements = taSelection.getOnlySelectedElements();
                //console.log('PPPPPPPPPPPPP', tagName, selfTag, selectedElements, tagName.match(BLOCKELEMENTS), $selected.hasClass('ta-bind'), $selected.parent()[0].tagName);
                if (selectedElements.length>1 && (tagName === 'ol' ||  tagName === 'ul' )) {
                    return listElementsToSelfTag($selected, selectedElements, selfTag, selfTag===tagName, taDefaultWrap);
                }
                if(tagName === selfTag){
                    // if all selected then we should remove the list
                    // grab all li elements and convert to taDefaultWrap tags
                    //console.log('tagName===selfTag');
                    if ($selected[0].childNodes.length !== selectedElements.length && selectedElements.length===1) {
                        $selected = angular.element(selectedElements[0]);
                        return listElementToSelfTag($selected.parent(), $selected, selfTag, true, taDefaultWrap);
                    } else {
                        return listToDefault($selected, taDefaultWrap);
                    }
                }else if(tagName === 'li' &&
                    $selected.parent()[0].tagName.toLowerCase() === selfTag &&
                    $selected.parent().children().length === 1){
                    // catch for the previous statement if only one li exists
                    return listToDefault($selected.parent(), taDefaultWrap);
                }else if(tagName === 'li' &&
                    $selected.parent()[0].tagName.toLowerCase() !== selfTag &&
                    $selected.parent().children().length === 1){
                    // catch for the previous statement if only one li exists
                    return listToList($selected.parent(), selfTag);
                }else if(tagName.match(BLOCKELEMENTS) && !$selected.hasClass('ta-bind')){
                    // if it's one of those block elements we have to change the contents
                    // if it's a ol/ul we are changing from one to the other
                    if (selectedElements.length) {
                        if ($selected[0].childNodes.length !== selectedElements.length && selectedElements.length===1) {
                            //console.log('&&&&&&&&&&&&&&& --------- &&&&&&&&&&&&&&&&', selectedElements[0], $selected[0].childNodes);
                            $selected = angular.element(selectedElements[0]);
                            return listElementToSelfTag($selected.parent(), $selected, selfTag, selfTag===tagName, taDefaultWrap);
                        }
                    }
                    if(tagName === 'ol' || tagName === 'ul'){
                        // now if this is a set of selected elements... behave diferently
                        return listToList($selected, selfTag);
                    }else{
                        var childBlockElements = false;
                        angular.forEach($selected.children(), function(elem){
                            if(elem.tagName.match(BLOCKELEMENTS)) {
                                childBlockElements = true;
                            }
                        });
                        if(childBlockElements){
                            return childElementsToList($selected.children(), $selected, selfTag);
                        }else{
                            return childElementsToList([angular.element('<div>' + selectedElement.innerHTML + '</div>')[0]], $selected, selfTag);
                        }
                    }
                }else if(tagName.match(BLOCKELEMENTS)){
                    // if we get here then the contents of the ta-bind are selected
                    _nodes = taSelection.getOnlySelectedElements();
                    //console.log('_nodes', _nodes, tagName);
                    if(_nodes.length === 0){
                        // here is if there is only text in ta-bind ie <div ta-bind>test content</div>
                        $target = angular.element('<' + selfTag + '><li>' + selectedElement.innerHTML + '</li></' + selfTag + '>');
                        $selected.html('');
                        $selected.append($target);
                    }else if(_nodes.length === 1 && (_nodes[0].tagName.toLowerCase() === 'ol' || _nodes[0].tagName.toLowerCase() === 'ul')){
                        if(_nodes[0].tagName.toLowerCase() === selfTag){
                            // remove
                            return listToDefault(angular.element(_nodes[0]), taDefaultWrap);
                        }else{
                            return listToList(angular.element(_nodes[0]), selfTag);
                        }
                    }else{
                        html = '';
                        var $nodes = [];
                        for(i = 0; i < _nodes.length; i++){
                            /* istanbul ignore else: catch for real-world can't make it occur in testing */
                            if(_nodes[i].nodeType !== 3){
                                var $n = angular.element(_nodes[i]);
                                /* istanbul ignore if: browser check only, phantomjs doesn't return children nodes but chrome at least does */
                                if(_nodes[i].tagName.toLowerCase() === 'li') continue;
                                else if(_nodes[i].tagName.toLowerCase() === 'ol' || _nodes[i].tagName.toLowerCase() === 'ul'){
                                    html += $n[0].innerHTML; // if it's a list, add all it's children
                                }else if(_nodes[i].tagName.toLowerCase() === 'span' && (_nodes[i].childNodes[0].tagName.toLowerCase() === 'ol' || _nodes[i].childNodes[0].tagName.toLowerCase() === 'ul')){
                                    html += $n[0].childNodes[0].innerHTML; // if it's a list, add all it's children
                                }else{
                                    html += '<' + taBrowserTag('li') + '>' + $n[0].innerHTML + '</' + taBrowserTag('li') + '>';
                                }
                                $nodes.unshift($n);
                            }
                        }
                        //console.log('$nodes', $nodes);
                        $target = angular.element('<' + selfTag + '>' + html + '</' + selfTag + '>');
                        $nodes.pop().replaceWith($target);
                        angular.forEach($nodes, function($node){ $node.remove(); });
                    }
                    taSelection.setSelectionToElementEnd($target[0]);
                    return;
                }
            }else if(command.toLowerCase() === 'formatblock'){
                optionsTagName = options.toLowerCase().replace(/[<>]/ig, '');
                if(optionsTagName.trim() === 'default') {
                    optionsTagName = taDefaultWrap;
                    options = '<' + taDefaultWrap + '>';
                }
                if(tagName === 'li') {
                    $target = $selected.parent();
                }
                else {
                    $target = $selected;
                }
                // find the first blockElement
                while(!$target[0].tagName || !$target[0].tagName.match(BLOCKELEMENTS) && !$target.parent().attr('contenteditable')){
                    $target = $target.parent();
                    /* istanbul ignore next */
                    tagName = ($target[0].tagName || '').toLowerCase();
                }
                if(tagName === optionsTagName){
                    // $target is wrap element
                    _nodes = $target.children();
                    var hasBlock = false;
                    for(i = 0; i < _nodes.length; i++){
                        hasBlock = hasBlock || _nodes[i].tagName.match(BLOCKELEMENTS);
                    }
                    if(hasBlock){
                        $target.after(_nodes);
                        next = $target.next();
                        $target.remove();
                        $target = next;
                    }else{
                        defaultWrapper.append($target[0].childNodes);
                        $target.after(defaultWrapper);
                        $target.remove();
                        $target = defaultWrapper;
                    }
                }else if($target.parent()[0].tagName.toLowerCase() === optionsTagName &&
                    !$target.parent().hasClass('ta-bind')){
                    //unwrap logic for parent
                    var blockElement = $target.parent();
                    var contents = blockElement.contents();
                    for(i = 0; i < contents.length; i ++){
                        /* istanbul ignore next: can't test - some wierd thing with how phantomjs works */
                        if(blockElement.parent().hasClass('ta-bind') && contents[i].nodeType === 3){
                            defaultWrapper = angular.element('<' + taDefaultWrap + '>');
                            defaultWrapper[0].innerHTML = contents[i].outerHTML;
                            contents[i] = defaultWrapper[0];
                        }
                        blockElement.parent()[0].insertBefore(contents[i], blockElement[0]);
                    }
                    blockElement.remove();
                }else if(tagName.match(LISTELEMENTS)){
                    // wrapping a list element
                    $target.wrap(options);
                }else{
                    // default wrap behaviour
                    _nodes = taSelection.getOnlySelectedElements();
                    if(_nodes.length === 0) {
                        // no nodes at all....
                        _nodes = [$target[0]];
                    }
                    // find the parent block element if any of the nodes are inline or text
                    for(i = 0; i < _nodes.length; i++){
                        if(_nodes[i].nodeType === 3 || !_nodes[i].tagName.match(BLOCKELEMENTS)){
                            while(_nodes[i].nodeType === 3 || !_nodes[i].tagName || !_nodes[i].tagName.match(BLOCKELEMENTS)){
                                _nodes[i] = _nodes[i].parentNode;
                            }
                        }
                    }
                    // remove any duplicates from the array of _nodes!
                    _nodes = _nodes.filter(function(value, index, self) {
                        return self.indexOf(value) === index;
                    });
                    // remove all whole taTextElement if it is here... unless it is the only element!
                    if (_nodes.length>1) {
                        _nodes = _nodes.filter(function (value, index, self) {
                            return !(value.nodeName.toLowerCase() === 'div' && /^taTextElement/.test(value.id));
                        });
                    }
                    if(angular.element(_nodes[0]).hasClass('ta-bind')){
                        $target = angular.element(options);
                        $target[0].innerHTML = _nodes[0].innerHTML;
                        _nodes[0].innerHTML = $target[0].outerHTML;
                    }else if(optionsTagName === 'blockquote'){
                        // blockquotes wrap other block elements
                        html = '';
                        for(i = 0; i < _nodes.length; i++){
                            html += _nodes[i].outerHTML;
                        }
                        $target = angular.element(options);
                        $target[0].innerHTML = html;
                        _nodes[0].parentNode.insertBefore($target[0],_nodes[0]);
                        for(i = _nodes.length - 1; i >= 0; i--){
                            /* istanbul ignore else:  */
                            if (_nodes[i].parentNode) _nodes[i].parentNode.removeChild(_nodes[i]);
                        }
                    } else /* istanbul ignore next: not tested since identical to blockquote */
                    if (optionsTagName === 'pre' && taSelection.getStateShiftKey()) {
                        //console.log('shift pre', _nodes);
                        // pre wrap other block elements
                        html = '';
                        for (i = 0; i < _nodes.length; i++) {
                            html += _nodes[i].outerHTML;
                        }
                        $target = angular.element(options);
                        $target[0].innerHTML = html;
                        _nodes[0].parentNode.insertBefore($target[0], _nodes[0]);
                        for (i = _nodes.length - 1; i >= 0; i--) {
                            /* istanbul ignore else:  */
                            if (_nodes[i].parentNode) _nodes[i].parentNode.removeChild(_nodes[i]);
                        }
                    }
                    else {
                        //console.log(optionsTagName, _nodes);
                        // regular block elements replace other block elements
                        for (i = 0; i < _nodes.length; i++) {
                            var newBlock = turnBlockIntoBlocks(_nodes[i], options);
                            if (_nodes[i] === $target[0]) {
                                $target = angular.element(newBlock);
                            }
                        }
                    }
                }
                taSelection.setSelectionToElementEnd($target[0]);
                // looses focus when we have the whole container selected and no text!
                // refocus on the shown display element, this fixes a bug when using firefox
                $target[0].focus();
                return;
            }else if(command.toLowerCase() === 'createlink'){
                /* istanbul ignore next: firefox specific fix */
                if (tagName === 'a') {
                    // already a link!!! we are just replacing it...
                    taSelection.getSelectionElement().href = options;
                    return;
                }
                var tagBegin = '<a href="' + options + '" target="' +
                        (defaultTagAttributes.a.target ? defaultTagAttributes.a.target : '') +
                        '">',
                    tagEnd = '</a>',
                    _selection = taSelection.getSelection();
                if(_selection.collapsed){
                    //console.log('collapsed');
                    // insert text at selection, then select then just let normal exec-command run
                    taSelection.insertHtml(tagBegin + options + tagEnd, topNode);
                }else if(rangy.getSelection().getRangeAt(0).canSurroundContents()){
                    var node = angular.element(tagBegin + tagEnd)[0];
                    rangy.getSelection().getRangeAt(0).surroundContents(node);
                }
                return;
            }else if(command.toLowerCase() === 'inserthtml'){
                //console.log('inserthtml');
                taSelection.insertHtml(options, topNode);
                return;
            }
            try{
                $document[0].execCommand(command, showUI, options);
            }catch(e){}
        };
    };
}]).service('taSelection', ['$document', 'taDOM', '$log',
/* istanbul ignore next: all browser specifics and PhantomJS dosen't seem to support half of it */
function($document, taDOM, $log){
    // need to dereference the document else the calls don't work correctly
    var _document = $document[0];
    var bShiftState;
    var brException = function (element, offset) {
        /* check if selection is a BR element at the beginning of a container. If so, get
        * the parentNode instead.
        * offset should be zero in this case. Otherwise, return the original
        * element.
        */
        if (element.tagName && element.tagName.match(/^br$/i) && offset === 0 && !element.previousSibling) {
            return {
                element: element.parentNode,
                offset: 0
            };
        } else {
            return {
                element: element,
                offset: offset
            };
        }
    };
    var api = {
        getSelection: function(){
            var range;
            try {
                // catch any errors from rangy and ignore the issue
                range = rangy.getSelection().getRangeAt(0);
            } catch(e) {
                //console.info(e);
                return undefined;
            }
            var container = range.commonAncestorContainer;
            var selection = {
                start: brException(range.startContainer, range.startOffset),
                end: brException(range.endContainer, range.endOffset),
                collapsed: range.collapsed
            };
            // This has problems under Firefox.
            // On Firefox with
            // <p>Try me !</p>
            // <ul>
            // <li>line 1</li>
            // <li>line 2</li>
            // </ul>
            // <p>line 3</p>
            // <ul>
            // <li>line 4</li>
            // <li>line 5</li>
            // </ul>
            // <p>Hello textAngular</p>
            // WITH the cursor after the 3 on line 3, it gets the commonAncestorContainer as:
            // <TextNode textContent='line 3'>
            // AND Chrome gets the commonAncestorContainer as:
            // <p>line 3</p>
            //
            // Check if the container is a text node and return its parent if so
            // unless this is the whole taTextElement.  If so we return the textNode
            if (container.nodeType === 3) {
                if (container.parentNode.nodeName.toLowerCase() === 'div' &&
                    /^taTextElement/.test(container.parentNode.id)) {
                    // textNode where the parent is the whole <div>!!!
                    //console.log('textNode ***************** container:', container);
                } else {
                    container = container.parentNode;
                }
            }
            if (container.nodeName.toLowerCase() === 'div' &&
                /^taTextElement/.test(container.id)) {
                //console.log('*********taTextElement************');
                //console.log('commonAncestorContainer:', container);
                selection.start.element = container.childNodes[selection.start.offset];
                selection.end.element = container.childNodes[selection.end.offset];
                selection.container = container;
            } else {
                if (container.parentNode === selection.start.element ||
                    container.parentNode === selection.end.element) {
                    selection.container = container.parentNode;
                } else {
                    selection.container = container;
                }
            }
            //console.log('***selection container:', selection.container.nodeName, selection.start.offset, selection.container);
            return selection;
        },
        // if we use the LEFT_ARROW and we are at the special place <span>&#65279;</span> we move the cursor over by one...
        // Chrome and Firefox behave differently so so fix this for Firefox here.  No adjustment needed for Chrome.
        updateLeftArrowKey: function(element) {
            var range = rangy.getSelection().getRangeAt(0);
            if (range && range.collapsed) {
                var _nodes = api.getFlattenedDom(range);
                if (!_nodes.findIndex) return;
                var _node = range.startContainer;
                var indexStartContainer = _nodes.findIndex(function(element, index){
                    if (element.node===_node) return true;
                    var _indexp = element.parents.indexOf(_node);
                    return (_indexp !== -1);
                });
                var m;
                var nextNodeToRight;
                //console.log('indexStartContainer', indexStartContainer, _nodes.length, 'startContainer:', _node, _node === _nodes[indexStartContainer].node);
                _nodes.forEach(function (n, i) {
                    //console.log(i, n.node);
                    n.parents.forEach(function (nn, j){
                        //console.log(i, j, nn);
                    });
                });
                if (indexStartContainer+1 < _nodes.length) {
                    // we need the node just after this startContainer
                    // so we can check and see it this is a special place
                    nextNodeToRight = _nodes[indexStartContainer+1].node;
                    //console.log(nextNodeToRight, range.startContainer);
                }
                //console.log('updateLeftArrowKey', range.startOffset, range.startContainer.textContent);
                // this first section handles the case for Chrome browser
                // if the first character of the nextNode is a \ufeff we know that we are just before the special span...
                // and so we most left by one character
                if (nextNodeToRight && nextNodeToRight.textContent) {
                    m = /^\ufeff([^\ufeff]*)$/.exec(nextNodeToRight.textContent);
                    if (m) {
                        // we are before the special node with begins with a \ufeff character
                        //console.log('LEFT ...found it...', 'startOffset:', range.startOffset, m[0].length, m[1].length);
                        // no need to change anything in this case
                        return;
                    }
                }
                var nextNodeToLeft;
                if (indexStartContainer > 0) {
                    // we need the node just after this startContainer
                    // so we can check and see it this is a special place
                    nextNodeToLeft = _nodes[indexStartContainer-1].node;
                    //console.log(nextNodeToLeft, nextNodeToLeft);
                }
                if (range.startOffset === 0 && nextNodeToLeft) {
                    //console.log(nextNodeToLeft, range.startOffset, nextNodeToLeft.textContent);
                    m = /^\ufeff([^\ufeff]*)$/.exec(nextNodeToLeft.textContent);
                    if (m) {
                        //console.log('LEFT &&&&&&&&&&&&&&&&&&&...found it...&&&&&&&&&&&', nextNodeToLeft, m[0].length, m[1].length);
                        // move over to the left my one -- Firefox triggers this case
                        api.setSelectionToElementEnd(nextNodeToLeft);
                        return;
                    }
                }
            }
            return;
        },
        // if we use the RIGHT_ARROW and we are at the special place <span>&#65279;</span> we move the cursor over by one...
        updateRightArrowKey: function(element) {
            // we do not need to make any adjustments here, so we ignore all this code
            if (false) {
                var range = rangy.getSelection().getRangeAt(0);
                if (range && range.collapsed) {
                    var _nodes = api.getFlattenedDom(range);
                    if (!_nodes.findIndex) return;
                    var _node = range.startContainer;
                    var indexStartContainer = _nodes.findIndex(function (element, index) {
                        if (element.node === _node) return true;
                        var _indexp = element.parents.indexOf(_node);
                        return (_indexp !== -1);
                    });
                    var _sel;
                    var i;
                    var m;

                    // if the last character is a \ufeff we know that we are just before the special span...
                    // and so we most right by one character
                    var indexFound = _nodes.findIndex(function (n, index) {
                        if (n.textContent) {
                            var m = /^\ufeff([^\ufeff]*)$/.exec(n.textContent);
                            if (m) {
                                return true;
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    });
                    if (indexFound === -1) {
                        return;
                    }
                    //console.log(indexFound, range.startContainer, range.startOffset);
                    _node = _nodes[indexStartContainer];
                    //console.log('indexStartContainer', indexStartContainer);
                    if (_node && _node.textContent) {
                        m = /^\ufeff([^\ufeff]*)$/.exec(_node.textContent);
                        if (m && range.startOffset - 1 === m[1].length) {
                            //console.log('RIGHT found it...&&&&&&&&&&&', range.startOffset);
                            // no need to make any adjustment
                            return;
                        }
                    }
                    //console.log(range.startOffset);
                    if (_nodes && range.startOffset === 0) {
                        indexStartContainer = _nodes.indexOf(range.startContainer);
                        if (indexStartContainer !== -1 && indexStartContainer > 0) {
                            _node = _nodes[indexStartContainer - 1];
                            if (_node.textContent) {
                                m = /\ufeff([^\ufeff]*)$/.exec(_node.textContent);
                                if (m && true || range.startOffset === m[1].length + 1) {
                                    //console.log('RIGHT &&&&&&&&&&&&&&&&&&&...found it...&&&&&&&&&&&', range.startOffset, m[1].length);
                                    // no need to make any adjustment
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        },
        getFlattenedDom: function(range) {
            var parent = range.commonAncestorContainer.parentNode;
            if (!parent) {
                return range.commonAncestorContainer.childNodes;
            }
            var nodes = Array.prototype.slice.call(parent.childNodes); // converts NodeList to Array
            var indexStartContainer = nodes.indexOf(range.startContainer);
            // make sure that we have a big enough set of nodes
            if (indexStartContainer+1 < nodes.length && indexStartContainer > 0) {
                // we are good
                // we can go down one node or up one node
            } else {
                if (parent.parentNode) {
                    parent = parent.parentNode;
                }
            }
            // now walk the parent
            nodes = [];
            function addNodes(_set) {
                if (_set.node.childNodes.length) {
                    var childNodes = Array.prototype.slice.call(_set.node.childNodes); // converts NodeList to Array
                    childNodes.forEach(function(n) {
                        var _t = _set.parents.slice();
                        if (_t.slice(-1)[0]!==_set.node) {
                            _t.push(_set.node);
                        }
                        addNodes({parents: _t, node: n});
                    });
                } else {
                    nodes.push({parents: _set.parents, node: _set.node});
                }
            }
            addNodes({parents: [parent], node: parent});
            return nodes;
        },
        getOnlySelectedElements: function(){
            var range = rangy.getSelection().getRangeAt(0);
            var container = range.commonAncestorContainer;
            // Node.TEXT_NODE === 3
            // Node.ELEMENT_NODE === 1
            // Node.COMMENT_NODE === 8
            // Check if the container is a text node and return its parent if so
            container = container.nodeType === 3 ? container.parentNode : container;
            // get the nodes in the range that are ELEMENT_NODE and are children of the container
            // in this range...
            return range.getNodes([1], function(node){
                return node.parentNode === container;
            });
        },
        // this includes the container element if all children are selected
        getAllSelectedElements: function(){
            var range = rangy.getSelection().getRangeAt(0);
            var container = range.commonAncestorContainer;
            // Node.TEXT_NODE === 3
            // Node.ELEMENT_NODE === 1
            // Node.COMMENT_NODE === 8
            // Check if the container is a text node and return its parent if so
            container = container.nodeType === 3 ? container.parentNode : container;
            // get the nodes in the range that are ELEMENT_NODE and are children of the container
            // in this range...
            var selectedNodes = range.getNodes([1], function(node){
                return node.parentNode === container;
            });
            var innerHtml = container.innerHTML;
            // remove the junk that rangy has put down
            innerHtml = innerHtml.replace(/<span id=.selectionBoundary[^>]+>\ufeff?<\/span>/ig, '');
            //console.log(innerHtml);
            //console.log(range.toHtml());
            //console.log(innerHtml === range.toHtml());
            if (innerHtml === range.toHtml() &&
                // not the whole taTextElement
                (!(container.nodeName.toLowerCase() === 'div' &&  /^taTextElement/.test(container.id)))
            ) {
                var arr = [];
                for(var i = selectedNodes.length; i--; arr.unshift(selectedNodes[i]));
                selectedNodes = arr;
                selectedNodes.push(container);
                //$log.debug(selectedNodes);
            }
            return selectedNodes;
        },
        // Some basic selection functions
        getSelectionElement: function () {
            var s = api.getSelection();
            if (s) {
                return api.getSelection().container;
            } else {
                return undefined;
            }
        },
        setSelection: function(elStart, elEnd, start, end){
            var range = rangy.createRange();

            range.setStart(elStart, start);
            range.setEnd(elEnd, end);

            rangy.getSelection().setSingleRange(range);
        },
        setSelectionBeforeElement: function (el){
            var range = rangy.createRange();

            range.selectNode(el);
            range.collapse(true);

            rangy.getSelection().setSingleRange(range);
        },
        setSelectionAfterElement: function (el){
            var range = rangy.createRange();

            range.selectNode(el);
            range.collapse(false);

            rangy.getSelection().setSingleRange(range);
        },
        setSelectionToElementStart: function (el){
            var range = rangy.createRange();

            range.selectNodeContents(el);
            range.collapse(true);

            rangy.getSelection().setSingleRange(range);
        },
        setSelectionToElementEnd: function (el){
            var range = rangy.createRange();

            range.selectNodeContents(el);
            range.collapse(false);
            if(el.childNodes && el.childNodes[el.childNodes.length - 1] && el.childNodes[el.childNodes.length - 1].nodeName === 'br'){
                range.startOffset = range.endOffset = range.startOffset - 1;
            }
            rangy.getSelection().setSingleRange(range);
        },
        setStateShiftKey: function(bS) {
            bShiftState = bS;
        },
        getStateShiftKey: function() {
            return bShiftState;
        },
        // from http://stackoverflow.com/questions/6690752/insert-html-at-caret-in-a-contenteditable-div
        // topNode is the contenteditable normally, all manipulation MUST be inside this.
        insertHtml: function(html, topNode){
            var parent, secondParent, _childI, nodes, i, lastNode, _tempFrag;
            var element = angular.element("<div>" + html + "</div>");
            var range = rangy.getSelection().getRangeAt(0);
            var frag = _document.createDocumentFragment();
            var children = element[0].childNodes;
            var isInline = true;

            if(children.length > 0){
                // NOTE!! We need to do the following:
                // check for blockelements - if they exist then we have to split the current element in half (and all others up to the closest block element) and insert all children in-between.
                // If there are no block elements, or there is a mixture we need to create textNodes for the non wrapped text (we don't want them spans messing up the picture).
                nodes = [];
                for(_childI = 0; _childI < children.length; _childI++){
                    var _cnode = children[_childI];
                    if (_cnode.nodeName.toLowerCase() === 'p' &&
                        _cnode.innerHTML.trim() === '') { // empty p element
                        continue;
                    }
                    /****************
                     *  allow any text to be inserted...
                    if((   _cnode.nodeType === 3 &&
                           _cnode.nodeValue === '\ufeff'[0] &&
                           _cnode.nodeValue.trim() === '') // empty no-space space element
                        ) {
                        // no change to isInline
                        nodes.push(_cnode);
                        continue;
                    }
                    if(_cnode.nodeType === 3 &&
                         _cnode.nodeValue.trim() === '') { // empty text node
                        continue;
                    }
                    *****************/
                    isInline = isInline && !BLOCKELEMENTS.test(_cnode.nodeName);
                    nodes.push(_cnode);
                }
                for(var _n = 0; _n < nodes.length; _n++) {
                    lastNode = frag.appendChild(nodes[_n]);
                }
                if( !isInline &&
                    range.collapsed &&
                    /^(|<br(|\/)>)$/i.test(range.startContainer.innerHTML) ) {
                    range.selectNode(range.startContainer);
                }
            }else{
                isInline = true;
                // paste text of some sort
                lastNode = frag = _document.createTextNode(html);
            }

            // Other Edge case - selected data spans multiple blocks.
            if(isInline){
                range.deleteContents();
            }else{ // not inline insert
                if(range.collapsed && range.startContainer !== topNode){
                    if(range.startContainer.innerHTML && range.startContainer.innerHTML.match(/^<[^>]*>$/i)){
                        // this log is to catch when innerHTML is something like `<img ...>`
                        parent = range.startContainer;
                        if(range.startOffset === 1){
                            // before single tag
                            range.setStartAfter(parent);
                            range.setEndAfter(parent);
                        }else{
                            // after single tag
                            range.setStartBefore(parent);
                            range.setEndBefore(parent);
                        }
                    }else{
                        // split element into 2 and insert block element in middle
                        if(range.startContainer.nodeType === 3 && range.startContainer.parentNode !== topNode){ // if text node
                            parent = range.startContainer.parentNode;
                            secondParent = parent.cloneNode();
                            // split the nodes into two lists - before and after, splitting the node with the selection into 2 text nodes.
                            taDOM.splitNodes(parent.childNodes, parent, secondParent, range.startContainer, range.startOffset);

                            // Escape out of the inline tags like b
                            while(!VALIDELEMENTS.test(parent.nodeName)){
                                angular.element(parent).after(secondParent);
                                parent = parent.parentNode;
                                var _lastSecondParent = secondParent;
                                secondParent = parent.cloneNode();
                                // split the nodes into two lists - before and after, splitting the node with the selection into 2 text nodes.
                                taDOM.splitNodes(parent.childNodes, parent, secondParent, _lastSecondParent);
                            }
                        }else{
                            parent = range.startContainer;
                            secondParent = parent.cloneNode();
                            taDOM.splitNodes(parent.childNodes, parent, secondParent, undefined, undefined, range.startOffset);
                        }

                        angular.element(parent).after(secondParent);
                        // put cursor to end of inserted content
                        //console.log('setStartAfter', parent);
                        range.setStartAfter(parent);
                        range.setEndAfter(parent);

                        if(/^(|<br(|\/)>)$/i.test(parent.innerHTML.trim())){
                            range.setStartBefore(parent);
                            range.setEndBefore(parent);
                            angular.element(parent).remove();
                        }
                        if(/^(|<br(|\/)>)$/i.test(secondParent.innerHTML.trim())) angular.element(secondParent).remove();
                        if(parent.nodeName.toLowerCase() === 'li'){
                            _tempFrag = _document.createDocumentFragment();
                            for(i = 0; i < frag.childNodes.length; i++){
                                element = angular.element('<li>');
                                taDOM.transferChildNodes(frag.childNodes[i], element[0]);
                                taDOM.transferNodeAttributes(frag.childNodes[i], element[0]);
                                _tempFrag.appendChild(element[0]);
                            }
                            frag = _tempFrag;
                            if(lastNode){
                                lastNode = frag.childNodes[frag.childNodes.length - 1];
                                lastNode = lastNode.childNodes[lastNode.childNodes.length - 1];
                            }
                        }
                    }
                }else{
                    range.deleteContents();
                }
            }

            range.insertNode(frag);
            if(lastNode){
                api.setSelectionToElementEnd(lastNode);
            }
        }

        /* NOT FUNCTIONAL YET
         // under Firefox, we may have a selection that needs to be normalized
         isSelectionContainerWhole_taTextElement: function (){
         var range = rangy.getSelection().getRangeAt(0);
         var container = range.commonAncestorContainer;
         if (container.nodeName.toLowerCase() === 'div' &&
         /^taTextElement/.test(container.id)) {
         // container is the whole taTextElement
         return true;
         }
         return false;
         },
         setNormalizedSelection: function (){
         var range = rangy.getSelection().getRangeAt(0);
         var container = range.commonAncestorContainer;
         console.log(range);
         console.log(container.childNodes);
         if (range.collapsed) {
         // we know what to do...
         console.log(container.childNodes[range.startOffset]);
         api.setSelectionToElementStart(container.childNodes[range.startOffset]);
         }
         },
         */
    };
    return api;
}]).service('taDOM', function(){
    var taDOM = {
        // recursive function that returns an array of angular.elements that have the passed attribute set on them
        getByAttribute: function(element, attribute){
            var resultingElements = [];
            var childNodes = element.children();
            if(childNodes.length){
                angular.forEach(childNodes, function(child){
                    resultingElements = resultingElements.concat(taDOM.getByAttribute(angular.element(child), attribute));
                });
            }
            if(element.attr(attribute) !== undefined) resultingElements.push(element);
            return resultingElements;
        },

        transferChildNodes: function(source, target){
            // clear out target
            target.innerHTML = '';
            while(source.childNodes.length > 0) target.appendChild(source.childNodes[0]);
            return target;
        },

        splitNodes: function(nodes, target1, target2, splitNode, subSplitIndex, splitIndex){
            if(!splitNode && isNaN(splitIndex)) throw new Error('taDOM.splitNodes requires a splitNode or splitIndex');
            var startNodes = document.createDocumentFragment();
            var endNodes = document.createDocumentFragment();
            var index = 0;

            while(nodes.length > 0 && (isNaN(splitIndex) || splitIndex !== index) && nodes[0] !== splitNode){
                startNodes.appendChild(nodes[0]); // this removes from the nodes array (if proper childNodes object.
                index++;
            }

            if(!isNaN(subSplitIndex) && subSplitIndex >= 0 && nodes[0]){
                startNodes.appendChild(document.createTextNode(nodes[0].nodeValue.substring(0, subSplitIndex)));
                nodes[0].nodeValue = nodes[0].nodeValue.substring(subSplitIndex);
            }
            while(nodes.length > 0) endNodes.appendChild(nodes[0]);

            taDOM.transferChildNodes(startNodes, target1);
            taDOM.transferChildNodes(endNodes, target2);
        },

        transferNodeAttributes: function(source, target){
            for(var i = 0; i < source.attributes.length; i++) target.setAttribute(source.attributes[i].name, source.attributes[i].value);
            return target;
        }
    };
    return taDOM;
});

angular.module('textAngular.validators', [])
.directive('taMaxText', function(){
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl){
            var max = parseInt(scope.$eval(attrs.taMaxText));
            if (isNaN(max)){
                throw('Max text must be an integer');
            }
            attrs.$observe('taMaxText', function(value){
                max = parseInt(value);
                if (isNaN(max)){
                    throw('Max text must be an integer');
                }
                if (ctrl.$dirty){
                    ctrl.$validate();
                }
            });
            ctrl.$validators.taMaxText = function(viewValue){
                var source = angular.element('<div/>');
                source.html(viewValue);
                return source.text().length <= max;
            };
        }
    };
}).directive('taMinText', function(){
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl){
            var min = parseInt(scope.$eval(attrs.taMinText));
            if (isNaN(min)){
                throw('Min text must be an integer');
            }
            attrs.$observe('taMinText', function(value){
                min = parseInt(value);
                if (isNaN(min)){
                    throw('Min text must be an integer');
                }
                if (ctrl.$dirty){
                    ctrl.$validate();
                }
            });
            ctrl.$validators.taMinText = function(viewValue){
                var source = angular.element('<div/>');
                source.html(viewValue);
                return !source.text().length || source.text().length >= min;
            };
        }
    };
});
angular.module('textAngular.taBind', ['textAngular.factories', 'textAngular.DOM'])
.service('_taBlankTest', [function(){
    return function(_blankVal){
        // we radically restructure this code.
        // what was here before was incredibly fragile.
        // What we do now is to check that the html is non-blank visually
        // which we check by looking at html->text
        if(!_blankVal) return true;
        // find first non-tag match - ie start of string or after tag that is not whitespace
        // var t0 = performance.now();
        // Takes a small fraction of a mSec to do this...
        var _text_ = stripHtmlToText(_blankVal);
        // var t1 = performance.now();
        // console.log('Took', (t1 - t0).toFixed(4), 'milliseconds to generate:');
        if (_text_=== '') {
            // img generates a visible item so it is not blank!
            if (/<img[^>]+>/.test(_blankVal)) {
                return false;
            }
            return true;
        } else {
            return false;
        }
    };
}])
.directive('taButton', [function(){
    return {
        link: function(scope, element, attrs){
            element.attr('unselectable', 'on');
            element.on('mousedown', function(e, eventData){
                /* istanbul ignore else: this is for catching the jqLite testing*/
                if(eventData) angular.extend(e, eventData);
                // this prevents focusout from firing on the editor when clicking toolbar buttons
                e.preventDefault();
                return false;
            });
        }
    };
}])
.directive('taBind', [
        'taSanitize', '$timeout', '$document', 'taFixChrome', 'taBrowserTag',
        'taSelection', 'taSelectableElements', 'taApplyCustomRenderers', 'taOptions',
        '_taBlankTest', '$parse', 'taDOM', 'textAngularManager',
        function(
            taSanitize, $timeout, $document, taFixChrome, taBrowserTag,
            taSelection, taSelectableElements, taApplyCustomRenderers, taOptions,
            _taBlankTest, $parse, taDOM, textAngularManager){
    // Uses for this are textarea or input with ng-model and ta-bind='text'
    // OR any non-form element with contenteditable="contenteditable" ta-bind="html|text" ng-model
    return {
        priority: 2, // So we override validators correctly
        require: ['ngModel','?ngModelOptions'],
        link: function(scope, element, attrs, controller){
            var ngModel = controller[0];
            var ngModelOptions = controller[1] || {};
            // the option to use taBind on an input or textarea is required as it will sanitize all input into it correctly.
            var _isContentEditable = element.attr('contenteditable') !== undefined && element.attr('contenteditable');
            var _isInputFriendly = _isContentEditable || element[0].tagName.toLowerCase() === 'textarea' || element[0].tagName.toLowerCase() === 'input';
            var _isReadonly = false;
            var _focussed = false;
            var _skipRender = false;
            var _disableSanitizer = attrs.taUnsafeSanitizer || taOptions.disableSanitizer;
            var _keepStyles = attrs.taKeepStyles || taOptions.keepStyles;
            var _lastKey;
            // see http://www.javascripter.net/faq/keycodes.htm for good information
            // NOTE Mute On|Off 173 (Opera MSIE Safari Chrome) 181 (Firefox)
            // BLOCKED_KEYS are special keys...
            // Tab, pause/break, CapsLock, Esc, Page Up, End, Home,
            // Left arrow, Up arrow, Right arrow, Down arrow, Insert, Delete,
            // f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12
            // NumLock, ScrollLock
            var BLOCKED_KEYS = /^(9|19|20|27|33|34|35|36|37|38|39|40|45|112|113|114|115|116|117|118|119|120|121|122|123|144|145)$/i;
            // UNDO_TRIGGER_KEYS - spaces, enter, delete, backspace, all punctuation
            // Backspace, Enter, Space, Delete, (; :) (Firefox), (= +) (Firefox),
            // Numpad +, Numpad -, (; :), (= +),
            // (, <), (- _), (. >), (/ ?), (` ~), ([ {), (\ |), (] }), (' ")
            // NOTE - Firefox: 173 = (- _) -- adding this to UNDO_TRIGGER_KEYS
            var UNDO_TRIGGER_KEYS = /^(8|13|32|46|59|61|107|109|173|186|187|188|189|190|191|192|219|220|221|222)$/i;
            var _pasteHandler;

            // defaults to the paragraph element, but we need the line-break or it doesn't allow you to type into the empty element
            // non IE is '<p><br/></p>', ie is '<p></p>' as for once IE gets it correct...
            var _defaultVal, _defaultTest;

            var _CTRL_KEY = 0x0001;
            var _META_KEY = 0x0002;
            var _ALT_KEY = 0x0004;
            var _SHIFT_KEY = 0x0008;
            // KEYCODEs we use
            var _ENTER_KEYCODE = 13;
            var _SHIFT_KEYCODE = 16;
            var _TAB_KEYCODE = 9;
            var _LEFT_ARROW_KEYCODE = 37;
            var _RIGHT_ARROW_KEYCODE = 39;
            // map events to special keys...
            // mappings is an array of maps from events to specialKeys as declared in textAngularSetup
            var _keyMappings = [
                //		ctrl/command + z
                {
                    specialKey: 'UndoKey',
                    forbiddenModifiers: _ALT_KEY + _SHIFT_KEY,
                    mustHaveModifiers: [_META_KEY + _CTRL_KEY],
                    keyCode: 90
                },
                //		ctrl/command + shift + z
                {
                    specialKey: 'RedoKey',
                    forbiddenModifiers: _ALT_KEY,
                    mustHaveModifiers: [_META_KEY + _CTRL_KEY, _SHIFT_KEY],
                    keyCode: 90
                },
                //		ctrl/command + y
                {
                    specialKey: 'RedoKey',
                    forbiddenModifiers: _ALT_KEY + _SHIFT_KEY,
                    mustHaveModifiers: [_META_KEY + _CTRL_KEY],
                    keyCode: 89
                },
                //		TabKey
                {
                    specialKey: 'TabKey',
                    forbiddenModifiers: _META_KEY + _SHIFT_KEY + _ALT_KEY + _CTRL_KEY,
                    mustHaveModifiers: [],
                    keyCode: _TAB_KEYCODE
                },
                //		shift + TabKey
                {
                    specialKey: 'ShiftTabKey',
                    forbiddenModifiers: _META_KEY + _ALT_KEY + _CTRL_KEY,
                    mustHaveModifiers: [_SHIFT_KEY],
                    keyCode: _TAB_KEYCODE
                }
            ];
            function _mapKeys(event) {
                var specialKey;
                _keyMappings.forEach(function (map){
                    if (map.keyCode === event.keyCode) {
                        var netModifiers = (event.metaKey ? _META_KEY: 0) +
                            (event.ctrlKey ? _CTRL_KEY: 0) +
                            (event.shiftKey ? _SHIFT_KEY: 0) +
                            (event.altKey ? _ALT_KEY: 0);
                        if (map.forbiddenModifiers & netModifiers) return;
                        if (map.mustHaveModifiers.every(function (modifier) { return netModifiers & modifier; })){
                            specialKey = map.specialKey;
                        }
                    }
                });
                return specialKey;
            }

            // set the default to be a paragraph value
            if(attrs.taDefaultWrap === undefined) attrs.taDefaultWrap = 'p';
            /* istanbul ignore next: ie specific test */
            if(attrs.taDefaultWrap === ''){
                _defaultVal = '';
                _defaultTest = (_browserDetect.ie === undefined)? '<div><br></div>' : (_browserDetect.ie >= 11)? '<p><br></p>' : (_browserDetect.ie <= 8)? '<P>&nbsp;</P>' : '<p>&nbsp;</p>';
            }else{
                _defaultVal = (_browserDetect.ie === undefined || _browserDetect.ie >= 11)?
                    (attrs.taDefaultWrap.toLowerCase() === 'br' ? '<BR><BR>' : '<' + attrs.taDefaultWrap + '><br></' + attrs.taDefaultWrap + '>') :
                    (_browserDetect.ie <= 8)?
                        '<' + attrs.taDefaultWrap.toUpperCase() + '></' + attrs.taDefaultWrap.toUpperCase() + '>' :
                        '<' + attrs.taDefaultWrap + '></' + attrs.taDefaultWrap + '>';
                _defaultTest = (_browserDetect.ie === undefined || _browserDetect.ie >= 11)?
                    (attrs.taDefaultWrap.toLowerCase() === 'br' ? '<br><br>' : '<' + attrs.taDefaultWrap + '><br></' + attrs.taDefaultWrap + '>') :
                    (_browserDetect.ie <= 8)?
                        '<' + attrs.taDefaultWrap.toUpperCase() + '>&nbsp;</' + attrs.taDefaultWrap.toUpperCase() + '>' :
                        '<' + attrs.taDefaultWrap + '>&nbsp;</' + attrs.taDefaultWrap + '>';
            }

            /* istanbul ignore else */
            if(!ngModelOptions.$options) ngModelOptions.$options = {}; // ng-model-options support

            var _ensureContentWrapped = function(value) {
                if (_taBlankTest(value)) return value;
                var domTest = angular.element("<div>" + value + "</div>");
                //console.log('domTest.children().length():', domTest.children().length);
                //console.log('_ensureContentWrapped', domTest.children());
                //console.log(value, attrs.taDefaultWrap);
                if (domTest.children().length === 0) {
                    // if we have a <br> and the attrs.taDefaultWrap is a <p> we need to remove the <br>
                    //value = value.replace(/<br>/i, '');
                    value = "<" + attrs.taDefaultWrap + ">" + value + "</" + attrs.taDefaultWrap + ">";
                } else {
                    var _children = domTest[0].childNodes;
                    var i;
                    var _foundBlockElement = false;
                    for (i = 0; i < _children.length; i++) {
                        if (_foundBlockElement = _children[i].nodeName.toLowerCase().match(BLOCKELEMENTS)) break;
                    }
                    if (!_foundBlockElement) {
                        value = "<" + attrs.taDefaultWrap + ">" + value + "</" + attrs.taDefaultWrap + ">";
                    }
                    else{
                        value = "";
                        for(i = 0; i < _children.length; i++){
                            var node = _children[i];
                            var nodeName = node.nodeName.toLowerCase();
                            //console.log('node#:', i, 'name:', nodeName);
                            if(nodeName === '#comment') {
                                value += '<!--' + node.nodeValue + '-->';
                            } else if(nodeName === '#text') {
                                // determine if this is all whitespace, if so, we will leave it as it is.
                                // otherwise, we will wrap it as it is
                                var text = node.textContent;
                                if (!text.trim()) {
                                    // just whitespace
                                    value += text;
                                } else {
                                    // not pure white space so wrap in <p>...</p> or whatever attrs.taDefaultWrap is set to.
                                    value += "<" + attrs.taDefaultWrap + ">" + text + "</" + attrs.taDefaultWrap + ">";
                                }
                            } else if(!nodeName.match(BLOCKELEMENTS)){
                                /* istanbul ignore  next: Doesn't seem to trigger on tests */
                                var _subVal = (node.outerHTML || node.nodeValue);
                                /* istanbul ignore else: Doesn't seem to trigger on tests, is tested though */
                                if(_subVal.trim() !== '')
                                    value += "<" + attrs.taDefaultWrap + ">" + _subVal + "</" + attrs.taDefaultWrap + ">";
                                else value += _subVal;
                            } else {
                                value += node.outerHTML;
                            }
                            //console.log(value);
                        }
                    }
                }
                //console.log(value);
                return value;
            };

            if(attrs.taPaste) {
                _pasteHandler = $parse(attrs.taPaste);
            }

            element.addClass('ta-bind');

            var _undoKeyupTimeout;

            scope['$undoManager' + (attrs.id || '')] = ngModel.$undoManager = {
                _stack: [],
                _index: 0,
                _max: 1000,
                push: function(value){
                    if((typeof value === "undefined" || value === null) ||
                        ((typeof this.current() !== "undefined" && this.current() !== null) && value === this.current())) return value;
                    if(this._index < this._stack.length - 1){
                        this._stack = this._stack.slice(0,this._index+1);
                    }
                    this._stack.push(value);
                    if(_undoKeyupTimeout) $timeout.cancel(_undoKeyupTimeout);
                    if(this._stack.length > this._max) this._stack.shift();
                    this._index = this._stack.length - 1;
                    return value;
                },
                undo: function(){
                    return this.setToIndex(this._index-1);
                },
                redo: function(){
                    return this.setToIndex(this._index+1);
                },
                setToIndex: function(index){
                    if(index < 0 || index > this._stack.length - 1){
                        return undefined;
                    }
                    this._index = index;
                    return this.current();
                },
                current: function(){
                    return this._stack[this._index];
                }
            };

            // in here we are undoing the converts used elsewhere to prevent the < > and & being displayed when they shouldn't in the code.
            var _compileHtml = function(){
                if(_isContentEditable) {
                    return element[0].innerHTML;
                }
                if(_isInputFriendly) {
                    return element.val();
                }
                throw ('textAngular Error: attempting to update non-editable taBind');
            };

            var selectorClickHandler = function(event){
                // emit the element-select event, pass the element
                scope.$emit('ta-element-select', this);
                event.preventDefault();
                return false;
            };

            //used for updating when inserting wrapped elements
            var _reApplyOnSelectorHandlers = scope['reApplyOnSelectorHandlers' + (attrs.id || '')] = function(){
                /* istanbul ignore else */
                if(!_isReadonly) angular.forEach(taSelectableElements, function(selector){
                    // check we don't apply the handler twice
                    element.find(selector)
                        .off('click', selectorClickHandler)
                        .on('click', selectorClickHandler);
                });
            };

            var _setViewValue = function(_val, triggerUndo, skipRender){
                _skipRender = skipRender || false;
                if(typeof triggerUndo === "undefined" || triggerUndo === null) triggerUndo = true && _isContentEditable; // if not contentEditable then the native undo/redo is fine
                if(typeof _val === "undefined" || _val === null) _val = _compileHtml();
                if(_taBlankTest(_val)){
                    // this avoids us from tripping the ng-pristine flag if we click in and out with out typing
                    if(ngModel.$viewValue !== '') ngModel.$setViewValue('');
                    if(triggerUndo && ngModel.$undoManager.current() !== '') ngModel.$undoManager.push('');
                }else{
                    _reApplyOnSelectorHandlers();
                    if(ngModel.$viewValue !== _val){
                        ngModel.$setViewValue(_val);
                        if(triggerUndo) ngModel.$undoManager.push(_val);
                    }
                }
                ngModel.$render();
            };

            var _setInnerHTML = function(newval){
                element[0].innerHTML = newval;
            };

            var _redoUndoTimeout;
            var _undo = scope['$undoTaBind' + (attrs.id || '')] = function(){
                /* istanbul ignore else: can't really test it due to all changes being ignored as well in readonly */
                if(!_isReadonly && _isContentEditable){
                    var content = ngModel.$undoManager.undo();
                    if(typeof content !== "undefined" && content !== null){
                        _setInnerHTML(content);
                        _setViewValue(content, false);
                        if(_redoUndoTimeout) $timeout.cancel(_redoUndoTimeout);
                        _redoUndoTimeout = $timeout(function(){
                            element[0].focus();
                            taSelection.setSelectionToElementEnd(element[0]);
                        }, 1);
                    }
                }
            };

            var _redo = scope['$redoTaBind' + (attrs.id || '')] = function(){
                /* istanbul ignore else: can't really test it due to all changes being ignored as well in readonly */
                if(!_isReadonly && _isContentEditable){
                    var content = ngModel.$undoManager.redo();
                    if(typeof content !== "undefined" && content !== null){
                        _setInnerHTML(content);
                        _setViewValue(content, false);
                        /* istanbul ignore next */
                        if(_redoUndoTimeout) $timeout.cancel(_redoUndoTimeout);
                        _redoUndoTimeout = $timeout(function(){
                            element[0].focus();
                            taSelection.setSelectionToElementEnd(element[0]);
                        }, 1);
                    }
                }
            };

            //used for updating when inserting wrapped elements
            scope['updateTaBind' + (attrs.id || '')] = function(){
                if(!_isReadonly) _setViewValue(undefined, undefined, true);
            };

            // catch DOM XSS via taSanitize
            // Sanitizing both ways is identical
            var _sanitize = function(unsafe){
                return (ngModel.$oldViewValue = taSanitize(taFixChrome(unsafe, _keepStyles), ngModel.$oldViewValue, _disableSanitizer));
            };

            // trigger the validation calls
            if(element.attr('required')) ngModel.$validators.required = function(modelValue, viewValue) {
                return !_taBlankTest(modelValue || viewValue);
            };
            // parsers trigger from the above keyup function or any other time that the viewValue is updated and parses it for storage in the ngModel
            ngModel.$parsers.push(_sanitize);
            ngModel.$parsers.unshift(_ensureContentWrapped);
            // because textAngular is bi-directional (which is awesome) we need to also sanitize values going in from the server
            ngModel.$formatters.push(_sanitize);
            ngModel.$formatters.unshift(_ensureContentWrapped);
            ngModel.$formatters.unshift(function(value){
                return ngModel.$undoManager.push(value || '');
            });

            //this code is used to update the models when data is entered/deleted
            if(_isInputFriendly){
                scope.events = {};
                if(!_isContentEditable){
                    // if a textarea or input just add in change and blur handlers, everything else is done by angulars input directive
                    element.on('change blur', scope.events.change = scope.events.blur = function(){
                        if(!_isReadonly) ngModel.$setViewValue(_compileHtml());
                    });

                    element.on('keydown', scope.events.keydown = function(event, eventData){
                        /* istanbul ignore else: this is for catching the jqLite testing*/
                        if(eventData) angular.extend(event, eventData);
                        // Reference to http://stackoverflow.com/questions/6140632/how-to-handle-tab-in-textarea
                        /* istanbul ignore else: otherwise normal functionality */
                        if(event.keyCode === _TAB_KEYCODE){ // tab was pressed
                            // get caret position/selection
                            var start = this.selectionStart;
                            var end = this.selectionEnd;

                            var value = element.val();
                            if(event.shiftKey){
                                // find \t
                                var _linebreak = value.lastIndexOf('\n', start), _tab = value.lastIndexOf('\t', start);
                                if(_tab !== -1 && _tab >= _linebreak){
                                    // set textarea value to: text before caret + tab + text after caret
                                    element.val(value.substring(0, _tab) + value.substring(_tab + 1));

                                    // put caret at right position again (add one for the tab)
                                    this.selectionStart = this.selectionEnd = start - 1;
                                }
                            }else{
                                // set textarea value to: text before caret + tab + text after caret
                                element.val(value.substring(0, start) + "\t" + value.substring(end));

                                // put caret at right position again (add one for the tab)
                                this.selectionStart = this.selectionEnd = start + 1;
                            }
                            // prevent the focus lose
                            event.preventDefault();
                        }
                    });

                    var _repeat = function(string, n){
                        var result = '';
                        for(var _n = 0; _n < n; _n++) result += string;
                        return result;
                    };

                    // add a forEach function that will work on a NodeList, etc..
                    var forEach = function (array, callback, scope) {
                        for (var i= 0; i<array.length; i++) {
                            callback.call(scope, i, array[i]);
                        }
                    };

                    // handle <ul> or <ol> nodes
                    var recursiveListFormat = function(listNode, tablevel){
                        var _html = '';
                        var _subnodes = listNode.childNodes;
                        tablevel++;
                        // tab out and add the <ul> or <ol> html piece
                        _html += _repeat('\t', tablevel-1) + listNode.outerHTML.substring(0, 4);
                        forEach(_subnodes, function (index, node) {
                            /* istanbul ignore next: browser catch */
                            var nodeName = node.nodeName.toLowerCase();
                            if (nodeName === '#comment') {
                                _html += '<!--' + node.nodeValue + '-->';
                                return;
                            }
                            if (nodeName === '#text') {
                                _html += node.textContent;
                                return;
                            }
                            /* istanbul ignore next: not tested, and this was original code -- so not wanting to possibly cause an issue, leaving it... */
                            if(!node.outerHTML) {
                                // no html to add
                                return;
                            }
                            if(nodeName === 'ul' || nodeName === 'ol') {
                                _html += '\n' + recursiveListFormat(node, tablevel);
                            }
                            else {
                                // no reformatting within this subnode, so just do the tabing...
                                _html += '\n' + _repeat('\t', tablevel) + node.outerHTML;
                            }
                        });
                        // now add on the </ol> or </ul> piece
                        _html += '\n' + _repeat('\t', tablevel-1) + listNode.outerHTML.substring(listNode.outerHTML.lastIndexOf('<'));
                        return _html;
                    };
                    // handle formating of something like:
                    // <ol><!--First comment-->
                    //  <li>Test Line 1<!--comment test list 1--></li>
                    //    <ul><!--comment ul-->
                    //      <li>Nested Line 1</li>
                    //        <!--comment between nested lines--><li>Nested Line 2</li>
                    //    </ul>
                    //  <li>Test Line 3</li>
                    // </ol>
                    ngModel.$formatters.unshift(function(htmlValue){
                        // tabulate the HTML so it looks nicer
                        //
                        // first get a list of the nodes...
                        // we do this by using the element parser...
                        //
                        // doing this -- which is simpiler -- breaks our tests...
                        //var _nodes=angular.element(htmlValue);
                        var _nodes = angular.element('<div>' + htmlValue + '</div>')[0].childNodes;
                        if(_nodes.length > 0){
                            // do the reformatting of the layout...
                            htmlValue = '';
                            forEach(_nodes, function (index, node) {
                                var nodeName = node.nodeName.toLowerCase();
                                if (nodeName === '#comment') {
                                    htmlValue += '<!--' + node.nodeValue + '-->';
                                    return;
                                }
                                if (nodeName === '#text') {
                                    htmlValue += node.textContent;
                                    return;
                                }
                                /* istanbul ignore next: not tested, and this was original code -- so not wanting to possibly cause an issue, leaving it... */
                                if(!node.outerHTML)
                                {
                                    // nothing to format!
                                    return;
                                }
                                if(htmlValue.length > 0) {
                                    // we aready have some content, so drop to a new line
                                    htmlValue += '\n';
                                }
                                if(nodeName === 'ul' || nodeName === 'ol') {
                                    // okay a set of list stuff we want to reformat in a nested way
                                    htmlValue += '' + recursiveListFormat(node, 0);
                                }
                                else {
                                    // just use the original without any additional formating
                                    htmlValue += '' + node.outerHTML;
                                }
                            });
                        }
                        return htmlValue;
                    });
                }else{
                    // all the code specific to contenteditable divs
                    var _processingPaste = false;
                    /* istanbul ignore next: phantom js cannot test this for some reason */
                    var processpaste = function(text) {
                       var _isOneNote = text!==undefined? text.match(/content=["']*OneNote.File/i): false;
                        /* istanbul ignore else: don't care if nothing pasted */
                        //console.log(text);
                        if(text && text.trim().length){
                            // test paste from word/microsoft product
                            if(text.match(/class=["']*Mso(Normal|List)/i) || text.match(/content=["']*Word.Document/i) || text.match(/content=["']*OneNote.File/i)){
                                var textFragment = text.match(/<!--StartFragment-->([\s\S]*?)<!--EndFragment-->/i);
                                if(!textFragment) textFragment = text;
                                else textFragment = textFragment[1];
                                textFragment = textFragment.replace(/<o:p>[\s\S]*?<\/o:p>/ig, '').replace(/class=(["']|)MsoNormal(["']|)/ig, '');
                                var dom = angular.element("<div>" + textFragment + "</div>");
                                var targetDom = angular.element("<div></div>");
                                var _list = {
                                    element: null,
                                    lastIndent: [],
                                    lastLi: null,
                                    isUl: false
                                };
                                _list.lastIndent.peek = function(){
                                    var n = this.length;
                                    if (n>0) return this[n-1];
                                };
                                var _resetList = function(isUl){
                                    _list.isUl = isUl;
                                    _list.element = angular.element(isUl ? "<ul>" : "<ol>");
                                    _list.lastIndent = [];
                                    _list.lastIndent.peek = function(){
                                        var n = this.length;
                                        if (n>0) return this[n-1];
                                    };
                                    _list.lastLevelMatch = null;
                                };
                                for(var i = 0; i <= dom[0].childNodes.length; i++){
                                    if(!dom[0].childNodes[i] || dom[0].childNodes[i].nodeName === "#text"){
                                        continue;
                                    } else {
                                        var tagName = dom[0].childNodes[i].tagName.toLowerCase();
                                        if(tagName !== 'p' &&
                                            tagName !== 'ul' &&
                                            tagName !== 'h1' &&
                                            tagName !== 'h2' &&
                                            tagName !== 'h3' &&
                                            tagName !== 'h4' &&
                                            tagName !== 'h5' &&
                                            tagName !== 'h6' &&
                                            tagName !== 'table'){
                                            continue;
                                        }
                                    }
                                    var el = angular.element(dom[0].childNodes[i]);
                                    var _listMatch = (el.attr('class') || '').match(/MsoList(Bullet|Number|Paragraph)(CxSp(First|Middle|Last)|)/i);

                                    if(_listMatch){
                                        if(el[0].childNodes.length < 2 || el[0].childNodes[1].childNodes.length < 1){
                                            continue;
                                        }
                                        var isUl = _listMatch[1].toLowerCase() === 'bullet' || (_listMatch[1].toLowerCase() !== 'number' && !(/^[^0-9a-z<]*[0-9a-z]+[^0-9a-z<>]</i.test(el[0].childNodes[1].innerHTML) || /^[^0-9a-z<]*[0-9a-z]+[^0-9a-z<>]</i.test(el[0].childNodes[1].childNodes[0].innerHTML)));
                                        var _indentMatch = (el.attr('style') || '').match(/margin-left:([\-\.0-9]*)/i);
                                        var indent = parseFloat((_indentMatch)?_indentMatch[1]:0);
                                        var _levelMatch = (el.attr('style') || '').match(/mso-list:l([0-9]+) level([0-9]+) lfo[0-9+]($|;)/i);
                                        // prefers the mso-list syntax

                                        if(_levelMatch && _levelMatch[2]) indent = parseInt(_levelMatch[2]);

                                        if ((_levelMatch && (!_list.lastLevelMatch || _levelMatch[1] !== _list.lastLevelMatch[1])) || !_listMatch[3] || _listMatch[3].toLowerCase() === 'first' || (_list.lastIndent.peek() === null) || (_list.isUl !== isUl && _list.lastIndent.peek() === indent)) {
                                            _resetList(isUl);
                                            targetDom.append(_list.element);
                                        } else if (_list.lastIndent.peek() != null && _list.lastIndent.peek() < indent){
                                            _list.element = angular.element(isUl ? '<ul>' : '<ol>');
                                            _list.lastLi.append(_list.element);
                                        } else if (_list.lastIndent.peek() != null && _list.lastIndent.peek() > indent){
                                            while(_list.lastIndent.peek() != null && _list.lastIndent.peek() > indent){
                                                if(_list.element.parent()[0].tagName.toLowerCase() === 'li'){
                                                    _list.element = _list.element.parent();
                                                    continue;
                                                }else if(/[uo]l/i.test(_list.element.parent()[0].tagName.toLowerCase())){
                                                    _list.element = _list.element.parent();
                                                }else{ // else it's it should be a sibling
                                                    break;
                                                }
                                                _list.lastIndent.pop();
                                            }
                                            _list.isUl = _list.element[0].tagName.toLowerCase() === 'ul';
                                            if (isUl !== _list.isUl) {
                                                _resetList(isUl);
                                                targetDom.append(_list.element);
                                            }
                                        }

                                        _list.lastLevelMatch = _levelMatch;
                                        if(indent !== _list.lastIndent.peek()) _list.lastIndent.push(indent);
                                        _list.lastLi = angular.element('<li>');
                                        _list.element.append(_list.lastLi);
                                        _list.lastLi.html(el.html().replace(/<!(--|)\[if !supportLists\](--|)>[\s\S]*?<!(--|)\[endif\](--|)>/ig, ''));
                                        el.remove();
                                    }else{
                                        _resetList(false);
                                        targetDom.append(el);
                                    }
                                }
                                var _unwrapElement = function(node){
                                    node = angular.element(node);
                                    for(var _n = node[0].childNodes.length - 1; _n >= 0; _n--) node.after(node[0].childNodes[_n]);
                                    node.remove();
                                };

                                angular.forEach(targetDom.find('span'), function(node){
                                    node.removeAttribute('lang');
                                    if(node.attributes.length <= 0) _unwrapElement(node);
                                });
                                angular.forEach(targetDom.find('font'), _unwrapElement);

                                text = targetDom.html();
                                if(_isOneNote){
                                    text = targetDom.html() || dom.html();
                                }
                                // LF characters instead of spaces in some spots and they are replaced by '/n', so we need to just swap them to spaces
                                text = text.replace(/\n/g, ' ');
                            }else{
                                // remove unnecessary chrome insert
                                text = text.replace(/<(|\/)meta[^>]*?>/ig, '');
                                if(text.match(/<[^>]*?(ta-bind)[^>]*?>/)){
                                    // entire text-angular or ta-bind has been pasted, REMOVE AT ONCE!!
                                    if(text.match(/<[^>]*?(text-angular)[^>]*?>/)){
                                        var _el = angular.element('<div>' + text + '</div>');
                                        _el.find('textarea').remove();
                                        for(var _b = 0; _b < binds.length; _b++){
                                            var _target = binds[_b][0].parentNode.parentNode;
                                            for(var _c = 0; _c < binds[_b][0].childNodes.length; _c++){
                                                _target.parentNode.insertBefore(binds[_b][0].childNodes[_c], _target);
                                            }
                                            _target.parentNode.removeChild(_target);
                                        }
                                        text = _el.html().replace('<br class="Apple-interchange-newline">', '');
                                    }
                                }else if(text.match(/^<span/)){
                                    // in case of pasting only a span - chrome paste, remove them. THis is just some wierd formatting
                                    // if we remove the '<span class="Apple-converted-space"> </span>' here we destroy the spacing
                                    // on paste from even ourselves!
                                    if (!text.match(/<span class=(\"Apple-converted-space\"|\'Apple-converted-space\')>.<\/span>/ig)) {
                                        text = text.replace(/<(|\/)span[^>]*?>/ig, '');
                                    }
                                }
                                // Webkit on Apple tags
                                text = text.replace(/<br class="Apple-interchange-newline"[^>]*?>/ig, '').replace(/<span class="Apple-converted-space">( |&nbsp;)<\/span>/ig, '&nbsp;');
                            }

                            if (/<li(\s.*)?>/i.test(text) && /(<ul(\s.*)?>|<ol(\s.*)?>).*<li(\s.*)?>/i.test(text) === false) {
                                // insert missing parent of li element
                                text = text.replace(/<li(\s.*)?>.*<\/li(\s.*)?>/i, '<ul>$&</ul>');
                            }

                            // parse whitespace from plaintext input, starting with preceding spaces that get stripped on paste
                            text = text.replace(/^[ |\u00A0]+/gm, function (match) {
                                var result = '';
                                for (var i = 0; i < match.length; i++) {
                                    result += '&nbsp;';
                                }
                                return result;
                            }).replace(/\n|\r\n|\r/g, '<br />').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');

                            if(_pasteHandler) text = _pasteHandler(scope, {$html: text}) || text;

                            // turn span vertical-align:super into <sup></sup>
                            text = text.replace(/<span style=("|')([^<]*?)vertical-align\s*:\s*super;?([^>]*?)("|')>([^<]+?)<\/span>/g, "<sup style='$2$3'>$5</sup>");

                            text = taSanitize(text, '', _disableSanitizer);
                            //console.log('DONE\n', text);

                            taSelection.insertHtml(text, element[0]);
                            $timeout(function(){
                                ngModel.$setViewValue(_compileHtml());
                                _processingPaste = false;
                                element.removeClass('processing-paste');
                            }, 0);
                        }else{
                            _processingPaste = false;
                            element.removeClass('processing-paste');
                        }
                    };

                    element.on('paste', scope.events.paste = function(e, eventData){
                        /* istanbul ignore else: this is for catching the jqLite testing*/
                        if(eventData) angular.extend(e, eventData);
                        if(_isReadonly || _processingPaste){
                            e.stopPropagation();
                            e.preventDefault();
                            return false;
                        }

                        // Code adapted from http://stackoverflow.com/questions/2176861/javascript-get-clipboard-data-on-paste-event-cross-browser/6804718#6804718
                        _processingPaste = true;
                        element.addClass('processing-paste');
                        var pastedContent;
                        var clipboardData = (e.originalEvent || e).clipboardData;
                        /* istanbul ignore next: Handle legacy IE paste */
                        if ( !clipboardData && window.clipboardData && window.clipboardData.getData ){
                            pastedContent = window.clipboardData.getData("Text");
                            processpaste(pastedContent);
                            e.stopPropagation();
                            e.preventDefault();
                            return false;
                        }
                        if (clipboardData && clipboardData.getData && clipboardData.types.length > 0) {// Webkit - get data from clipboard, put into editdiv, cleanup, then cancel event
                            var _types = "";
                            for(var _t = 0; _t < clipboardData.types.length; _t++){
                                _types += " " + clipboardData.types[_t];
                            }
                            /* istanbul ignore next: browser tests */
                            if (/text\/html/i.test(_types)) {
                                pastedContent = clipboardData.getData('text/html');
                            } else if (/text\/plain/i.test(_types)) {
                                pastedContent = clipboardData.getData('text/plain');
                            }
                            processpaste(pastedContent);
                            e.stopPropagation();
                            e.preventDefault();
                            return false;
                        } else {// Everything else - empty editdiv and allow browser to paste content into it, then cleanup
                            var _savedSelection = rangy.saveSelection(),
                                _tempDiv = angular.element('<div class="ta-hidden-input" contenteditable="true"></div>');
                            $document.find('body').append(_tempDiv);
                            _tempDiv[0].focus();
                            $timeout(function(){
                                // restore selection
                                rangy.restoreSelection(_savedSelection);
                                processpaste(_tempDiv[0].innerHTML);
                                element[0].focus();
                                _tempDiv.remove();
                            }, 0);
                        }
                    });
                    element.on('cut', scope.events.cut = function(e){
                        // timeout to next is needed as otherwise the paste/cut event has not finished actually changing the display
                        if(!_isReadonly) $timeout(function(){
                            ngModel.$setViewValue(_compileHtml());
                        }, 0);
                        else e.preventDefault();
                    });

                    element.on('keydown', scope.events.keydown = function(event, eventData){
                        /* istanbul ignore else: this is for catching the jqLite testing*/
                        if(eventData) angular.extend(event, eventData);
                        if (event.keyCode === _SHIFT_KEYCODE) {
                            taSelection.setStateShiftKey(true);
                        } else {
                            taSelection.setStateShiftKey(false);
                        }
                        event.specialKey = _mapKeys(event);
                        var userSpecialKey;
                        /* istanbul ignore next: difficult to test */
                        taOptions.keyMappings.forEach(function (mapping) {
                            if (event.specialKey === mapping.commandKeyCode) {
                                // taOptions has remapped this binding... so
                                // we disable our own
                                event.specialKey = undefined;
                            }
                            if (mapping.testForKey(event)) {
                                userSpecialKey = mapping.commandKeyCode;
                            }
                            if ((mapping.commandKeyCode === 'UndoKey') || (mapping.commandKeyCode === 'RedoKey')) {
                                // this is necessary to fully stop the propagation.
                                if (!mapping.enablePropagation) {
                                    event.preventDefault();
                                }
                            }
                        });
                        /* istanbul ignore next: difficult to test */
                        if (typeof userSpecialKey !== 'undefined') {
                            event.specialKey = userSpecialKey;
                        }
                        /* istanbul ignore next: difficult to test as can't seem to select */
                        if ((typeof event.specialKey !== 'undefined') && (
                                event.specialKey !== 'UndoKey' || event.specialKey !== 'RedoKey'
                            )) {
                            event.preventDefault();
                            textAngularManager.sendKeyCommand(scope, event);
                        }
                        /* istanbul ignore else: readonly check */
                        if(!_isReadonly){
                            if (event.specialKey==='UndoKey') {
                                _undo();
                                event.preventDefault();
                            }
                            if (event.specialKey==='RedoKey') {
                                _redo();
                                event.preventDefault();
                            }
                            /* istanbul ignore next: difficult to test as can't seem to select */
                            if(event.keyCode === _ENTER_KEYCODE && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey)
                            {
                                var contains = function(a, obj) {
                                    for (var i = 0; i < a.length; i++) {
                                        if (a[i] === obj) {
                                            return true;
                                        }
                                    }
                                    return false;
                                };
                                var $selection;
                                var selection = taSelection.getSelectionElement();
                                // shifted to nodeName here from tagName since it is more widely supported see: http://stackoverflow.com/questions/4878484/difference-between-tagname-and-nodename
                                if(!selection.nodeName.match(VALIDELEMENTS)) return;
                                var _new = angular.element(_defaultVal);
                                // if we are in the last element of a blockquote, or ul or ol and the element is blank
                                // we need to pull the element outside of the said type
                                var moveOutsideElements = ['blockquote', 'ul', 'ol'];
                                if (contains(moveOutsideElements, selection.parentNode.tagName.toLowerCase())) {
                                    if (/^<br(|\/)>$/i.test(selection.innerHTML.trim()) && !selection.nextSibling) {
                                        // if last element is blank, pull element outside.
                                        $selection = angular.element(selection);
                                        var _parent = $selection.parent();
                                        _parent.after(_new);
                                        $selection.remove();
                                        if (_parent.children().length === 0) _parent.remove();
                                        taSelection.setSelectionToElementStart(_new[0]);
                                        event.preventDefault();
                                    }
                                    if (/^<[^>]+><br(|\/)><\/[^>]+>$/i.test(selection.innerHTML.trim())) {
                                        $selection = angular.element(selection);
                                        $selection.after(_new);
                                        $selection.remove();
                                        taSelection.setSelectionToElementStart(_new[0]);
                                        event.preventDefault();
                                    }
                                }
                            }
                        }
                    });
                    var _keyupTimeout;
                    element.on('keyup', scope.events.keyup = function(event, eventData){
                        /* istanbul ignore else: this is for catching the jqLite testing*/
                        if(eventData) angular.extend(event, eventData);
                        taSelection.setStateShiftKey(false);	// clear the ShiftKey state
                        /* istanbul ignore next: FF specific bug fix */
                        if (event.keyCode === _TAB_KEYCODE) {
                            var _selection = taSelection.getSelection();
                            if(_selection.start.element === element[0] && element.children().length) taSelection.setSelectionToElementStart(element.children()[0]);
                            return;
                        }
                        // we do this here during the 'keyup' so that the browser has already moved the slection by one character...
                        if (event.keyCode === _LEFT_ARROW_KEYCODE && !event.shiftKey) {
                            taSelection.updateLeftArrowKey(element);
                        }
                        // we do this here during the 'keyup' so that the browser has already moved the slection by one character...
                        if (event.keyCode === _RIGHT_ARROW_KEYCODE && !event.shiftKey) {
                            taSelection.updateRightArrowKey(element);
                        }
                        if(_undoKeyupTimeout) $timeout.cancel(_undoKeyupTimeout);
                        if(!_isReadonly && !BLOCKED_KEYS.test(event.keyCode)){
                            /* istanbul ignore next: Ignore any _ENTER_KEYCODE that has ctrlKey, metaKey or alKey */
                            if (event.keyCode === _ENTER_KEYCODE && (event.ctrlKey || event.metaKey || event.altKey)) {
                                // we ignore any ENTER_	KEYCODE that is anything but plain or a shift one...
                            } else {
                                // if enter - insert new taDefaultWrap, if shift+enter insert <br/>
                                if(_defaultVal !== '' && _defaultVal !== '<BR><BR>' && event.keyCode === _ENTER_KEYCODE && !event.ctrlKey && !event.metaKey && !event.altKey){
                                    var selection = taSelection.getSelectionElement();
                                    while(!selection.nodeName.match(VALIDELEMENTS) && selection !== element[0]){
                                        selection = selection.parentNode;
                                    }
                                    if(!event.shiftKey){
                                        // new paragraph, br should be caught correctly
                                        // shifted to nodeName here from tagName since it is more widely supported see: http://stackoverflow.com/questions/4878484/difference-between-tagname-and-nodename
                                        //console.log('Enter', selection.nodeName, attrs.taDefaultWrap, selection.innerHTML.trim());
                                        if(selection.tagName.toLowerCase() !==
                                            attrs.taDefaultWrap &&
                                            selection.nodeName.toLowerCase() !== 'li' &&
                                            (selection.innerHTML.trim() === '' || selection.innerHTML.trim() === '<br>')
                                        ) {
                                            // Chrome starts with a <div><br></div> after an EnterKey
                                            // so we replace this with the _defaultVal
                                            var _new = angular.element(_defaultVal);
                                            angular.element(selection).replaceWith(_new);
                                            taSelection.setSelectionToElementStart(_new[0]);
                                        }
                                    } else {
                                        // shift + Enter
                                        var tagName = selection.tagName.toLowerCase();
                                        //console.log('Shift+Enter', selection.tagName, attrs.taDefaultWrap, selection.innerHTML.trim());
                                        // For an LI: We see: LI p ....<br><br>
                                        // For a P: We see: P p ....<br><br>
                                        // on Safari, the browser ignores the Shift+Enter and acts just as an Enter Key
                                        // For an LI: We see: LI p <br>
                                        // For a P: We see: P p <br>
                                        if((tagName === attrs.taDefaultWrap ||
                                            tagName === 'li' ||
                                            tagName === 'pre' ||
                                            tagName === 'div') &&
                                            !/.+<br><br>/.test(selection.innerHTML.trim())) {
                                            var ps = selection.previousSibling;
                                            //console.log('wrong....', ps);
                                            // we need to remove this selection and fix the previousSibling up...
                                            if (ps) {
                                                ps.innerHTML = ps.innerHTML + '<br><br>';
                                                angular.element(selection).remove();
                                                taSelection.setSelectionToElementEnd(ps);
                                            }
                                        }
                                    }
                                }
                                var val = _compileHtml();
                                if(_defaultVal !== '' && (val.trim() === '' || val.trim() === '<br>')){
                                    _setInnerHTML(_defaultVal);
                                    taSelection.setSelectionToElementStart(element.children()[0]);
                                }else if(val.substring(0, 1) !== '<' && attrs.taDefaultWrap !== ''){
                                    /* we no longer do this, since there can be comments here and white space
                                     var _savedSelection = rangy.saveSelection();
                                     val = _compileHtml();
                                     val = "<" + attrs.taDefaultWrap + ">" + val + "</" + attrs.taDefaultWrap + ">";
                                     _setInnerHTML(val);
                                     rangy.restoreSelection(_savedSelection);
                                     */
                                }
                                var triggerUndo = _lastKey !== event.keyCode && UNDO_TRIGGER_KEYS.test(event.keyCode);
                                if(_keyupTimeout) $timeout.cancel(_keyupTimeout);
                                _keyupTimeout = $timeout(function() {
                                    _setViewValue(val, triggerUndo, true);
                                }, ngModelOptions.$options.debounce || 400);
                                if(!triggerUndo) _undoKeyupTimeout = $timeout(function(){ ngModel.$undoManager.push(val); }, 250);
                                _lastKey = event.keyCode;
                            }
                        }
                    });

                    // when there is a change from a spelling correction in the browser, the only
                    // change that is seen is a 'input' and the $watch('html') sees nothing... So
                    // we added this element.on('input') to catch this change and call the _setViewValue()
                    // so the ngModel is updated and all works as it should.
                    var _inputTimeout;
                    element.on('input', function() {
                        if (_compileHtml() !== ngModel.$viewValue) {
                            // we wait a time now to allow the natural $watch('html') to handle this change
                            // and then after a 1 second delay, if there is still a difference we will do the
                            // _setViewValue() call.
                            /* istanbul ignore if: can't test */
                            if(_inputTimeout) $timeout.cancel(_inputTimeout);
                            /* istanbul ignore next: cant' test? */
                            _inputTimeout = $timeout(function() {
                                var _savedSelection = rangy.saveSelection();
                                var _val = _compileHtml();
                                if (_val !== ngModel.$viewValue) {
                                    //console.log('_setViewValue');
                                    //console.log('old:', ngModel.$viewValue);
                                    //console.log('new:', _val);
                                    _setViewValue(_val, true);
                                }
                                // if the savedSelection marker is gone at this point, we cannot restore the selection!!!
                                //console.log('rangy.restoreSelection', ngModel.$viewValue.length, _savedSelection);
                                if (ngModel.$viewValue.length !== 0) {
                                    rangy.restoreSelection(_savedSelection);
                                }
                            }, 1000);
                        }
                    });

                    element.on('blur', scope.events.blur = function(){
                        _focussed = false;
                        /* istanbul ignore else: if readonly don't update model */
                        if(!_isReadonly){
                            _setViewValue(undefined, undefined, true);
                        }else{
                            _skipRender = true; // don't redo the whole thing, just check the placeholder logic
                            ngModel.$render();
                        }
                    });

                    // Placeholders not supported on ie 8 and below
                    if(attrs.placeholder && (_browserDetect.ie > 8 || _browserDetect.ie === undefined)){
                        var rule;
                        if(attrs.id) rule = addCSSRule('#' + attrs.id + '.placeholder-text:before', 'content: "' + attrs.placeholder + '"');
                        else throw('textAngular Error: An unique ID is required for placeholders to work');

                        scope.$on('$destroy', function(){
                            removeCSSRule(rule);
                        });
                    }

                    element.on('focus', scope.events.focus = function(){
                        _focussed = true;
                        element.removeClass('placeholder-text');
                        _reApplyOnSelectorHandlers();
                    });

                    element.on('mouseup', scope.events.mouseup = function(){
                        var _selection = taSelection.getSelection();
                        if(_selection && _selection.start.element === element[0] && element.children().length) taSelection.setSelectionToElementStart(element.children()[0]);
                    });

                    // prevent propagation on mousedown in editor, see #206
                    element.on('mousedown', scope.events.mousedown = function(event, eventData){
                        /* istanbul ignore else: this is for catching the jqLite testing*/
                        if(eventData) angular.extend(event, eventData);
                        event.stopPropagation();
                    });
                }
            }

            var fileDropHandler = function(event, eventData){
                /* istanbul ignore else: this is for catching the jqLite testing*/
                if(eventData) angular.extend(event, eventData);
                // emit the drop event, pass the element, preventing should be done elsewhere
                if(!dropFired && !_isReadonly){
                    dropFired = true;
                    var dataTransfer;
                    if(event.originalEvent) dataTransfer = event.originalEvent.dataTransfer;
                    else dataTransfer = event.dataTransfer;
                    scope.$emit('ta-drop-event', this, event, dataTransfer);
                    $timeout(function(){
                        dropFired = false;
                        _setViewValue(undefined, undefined, true);
                    }, 100);
                }
            };

            var _renderTimeout;
            var _renderInProgress = false;
            // changes to the model variable from outside the html/text inputs
            ngModel.$render = function(){
                /* istanbul ignore if: Catches rogue renders, hard to replicate in tests */
                if(_renderInProgress) return;
                else _renderInProgress = true;
                // catch model being null or undefined
                var val = ngModel.$viewValue || '';
                // if the editor isn't focused it needs to be updated, otherwise it's receiving user input
                if(!_skipRender){
                    /* istanbul ignore else: in other cases we don't care */
                    if(_isContentEditable && _focussed){
                        // update while focussed
                        element.removeClass('placeholder-text');
                        /* istanbul ignore next: don't know how to test this */
                        if(_renderTimeout) $timeout.cancel(_renderTimeout);
                        _renderTimeout = $timeout(function(){
                            /* istanbul ignore if: Can't be bothered testing this... */
                            if(!_focussed){
                                element[0].focus();
                                taSelection.setSelectionToElementEnd(element.children()[element.children().length - 1]);
                            }
                            _renderTimeout = undefined;
                        }, 1);
                    }
                    if(_isContentEditable){
                        // WYSIWYG Mode
                        if(attrs.placeholder){
                            if(val === ''){
                                // blank
                                _setInnerHTML(_defaultVal);
                            }else{
                                // not-blank
                                _setInnerHTML(val);
                            }
                        }else{
                            _setInnerHTML((val === '') ? _defaultVal : val);
                        }
                        // if in WYSIWYG and readOnly we kill the use of links by clicking
                        if(!_isReadonly){
                            _reApplyOnSelectorHandlers();
                            element.on('drop', fileDropHandler);
                        }else{
                            element.off('drop', fileDropHandler);
                        }
                    }else if(element[0].tagName.toLowerCase() !== 'textarea' && element[0].tagName.toLowerCase() !== 'input'){
                        // make sure the end user can SEE the html code as a display. This is a read-only display element
                        _setInnerHTML(taApplyCustomRenderers(val));
                    }else{
                        // only for input and textarea inputs
                        element.val(val);
                    }
                }
                if(_isContentEditable && attrs.placeholder){
                    if(val === ''){
                        if(_focussed) element.removeClass('placeholder-text');
                        else element.addClass('placeholder-text');
                    }else{
                        element.removeClass('placeholder-text');
                    }
                }
                _renderInProgress = _skipRender = false;
            };

            if(attrs.taReadonly){
                //set initial value
                _isReadonly = scope.$eval(attrs.taReadonly);
                if(_isReadonly){
                    element.addClass('ta-readonly');
                    // we changed to readOnly mode (taReadonly='true')
                    if(element[0].tagName.toLowerCase() === 'textarea' || element[0].tagName.toLowerCase() === 'input'){
                        element.attr('disabled', 'disabled');
                    }
                    if(element.attr('contenteditable') !== undefined && element.attr('contenteditable')){
                        element.removeAttr('contenteditable');
                    }
                }else{
                    element.removeClass('ta-readonly');
                    // we changed to NOT readOnly mode (taReadonly='false')
                    if(element[0].tagName.toLowerCase() === 'textarea' || element[0].tagName.toLowerCase() === 'input'){
                        element.removeAttr('disabled');
                    }else if(_isContentEditable){
                        element.attr('contenteditable', 'true');
                    }
                }
                // taReadonly only has an effect if the taBind element is an input or textarea or has contenteditable='true' on it.
                // Otherwise it is readonly by default
                scope.$watch(attrs.taReadonly, function(newVal, oldVal){
                    if(oldVal === newVal) return;
                    if(newVal){
                        element.addClass('ta-readonly');
                        // we changed to readOnly mode (taReadonly='true')
                        if(element[0].tagName.toLowerCase() === 'textarea' || element[0].tagName.toLowerCase() === 'input'){
                            element.attr('disabled', 'disabled');
                        }
                        if(element.attr('contenteditable') !== undefined && element.attr('contenteditable')){
                            element.removeAttr('contenteditable');
                        }
                        // turn ON selector click handlers
                        angular.forEach(taSelectableElements, function(selector){
                            element.find(selector).on('click', selectorClickHandler);
                        });
                        element.off('drop', fileDropHandler);
                    }else{
                        element.removeClass('ta-readonly');
                        // we changed to NOT readOnly mode (taReadonly='false')
                        if(element[0].tagName.toLowerCase() === 'textarea' || element[0].tagName.toLowerCase() === 'input'){
                            element.removeAttr('disabled');
                        }else if(_isContentEditable){
                            element.attr('contenteditable', 'true');
                        }
                        // remove the selector click handlers
                        angular.forEach(taSelectableElements, function(selector){
                            element.find(selector).off('click', selectorClickHandler);
                        });
                        element.on('drop', fileDropHandler);
                    }
                    _isReadonly = newVal;
                });
            }

            // Initialise the selectableElements
            // if in WYSIWYG and readOnly we kill the use of links by clicking
            if(_isContentEditable && !_isReadonly){
                angular.forEach(taSelectableElements, function(selector){
                    element.find(selector).on('click', selectorClickHandler);
                });
                element.on('drop', fileDropHandler);
            }
        }
    };
}]);

// this global var is used to prevent multiple fires of the drop event. Needs to be global to the textAngular file.
var dropFired = false;
var textAngular = angular.module("textAngular", ['ngSanitize', 'textAngularSetup', 'textAngular.factories', 'textAngular.DOM', 'textAngular.validators', 'textAngular.taBind']); //This makes ngSanitize required

textAngular.config([function(){
    // clear taTools variable. Just catches testing and any other time that this config may run multiple times...
    angular.forEach(taTools, function(value, key){ delete taTools[key];	});
}]);

textAngular.directive("textAngular", [
    '$compile', '$timeout', 'taOptions', 'taSelection', 'taExecCommand',
    'textAngularManager', '$document', '$animate', '$log', '$q', '$parse',
    function($compile, $timeout, taOptions, taSelection, taExecCommand,
        textAngularManager, $document, $animate, $log, $q, $parse){
        return {
            require: '?ngModel',
            scope: {},
            restrict: "EA",
            priority: 2, // So we override validators correctly
            link: function(scope, element, attrs, ngModel){
                // all these vars should not be accessable outside this directive
                var _keydown, _keyup, _keypress, _mouseup, _focusin, _focusout,
                    _originalContents, _editorFunctions,
                    _serial = (attrs.serial) ? attrs.serial : Math.floor(Math.random() * 10000000000000000),
                    _taExecCommand, _resizeMouseDown, _updateSelectedStylesTimeout;
                var _resizeTimeout;

                scope._name = (attrs.name) ? attrs.name : 'textAngularEditor' + _serial;

                var oneEvent = function(_element, event, action){
                    $timeout(function(){
                        _element.one(event, action);
                    }, 100);
                };
                _taExecCommand = taExecCommand(attrs.taDefaultWrap);
                // get the settings from the defaults and add our specific functions that need to be on the scope
                angular.extend(scope, angular.copy(taOptions), {
                    // wraps the selection in the provided tag / execCommand function. Should only be called in WYSIWYG mode.
                    wrapSelection: function(command, opt, isSelectableElementTool){
                        // we restore the saved selection that was saved when focus was lost
                        /* NOT FUNCTIONAL YET */
                        /* textAngularManager.restoreFocusSelection(scope._name, scope); */
                        if(command.toLowerCase() === "undo"){
                            scope['$undoTaBindtaTextElement' + _serial]();
                        }else if(command.toLowerCase() === "redo"){
                            scope['$redoTaBindtaTextElement' + _serial]();
                        }else{
                            // catch errors like FF erroring when you try to force an undo with nothing done
                            _taExecCommand(command, false, opt, scope.defaultTagAttributes);
                            if(isSelectableElementTool){
                                // re-apply the selectable tool events
                                scope['reApplyOnSelectorHandlerstaTextElement' + _serial]();
                            }
                            // refocus on the shown display element, this fixes a display bug when using :focus styles to outline the box.
                            // You still have focus on the text/html input it just doesn't show up
                            scope.displayElements.text[0].focus();
                        }
                    },
                    showHtml: scope.$eval(attrs.taShowHtml) || false
                });
                // setup the options from the optional attributes
                if(attrs.taFocussedClass)			scope.classes.focussed = attrs.taFocussedClass;
                if(attrs.taTextEditorClass)			scope.classes.textEditor = attrs.taTextEditorClass;
                if(attrs.taHtmlEditorClass)			scope.classes.htmlEditor = attrs.taHtmlEditorClass;
                if(attrs.taDefaultTagAttributes){
                    try	{
                        //	TODO: This should use angular.merge to enhance functionality once angular 1.4 is required
                        angular.extend(scope.defaultTagAttributes, angular.fromJson(attrs.taDefaultTagAttributes));
                    } catch (error) {
                        $log.error(error);
                    }
                }
                // optional setup functions
                if(attrs.taTextEditorSetup)			scope.setup.textEditorSetup = scope.$parent.$eval(attrs.taTextEditorSetup);
                if(attrs.taHtmlEditorSetup)			scope.setup.htmlEditorSetup = scope.$parent.$eval(attrs.taHtmlEditorSetup);
                // optional fileDropHandler function
                if(attrs.taFileDrop)				scope.fileDropHandler = scope.$parent.$eval(attrs.taFileDrop);
                else								scope.fileDropHandler = scope.defaultFileDropHandler;

                _originalContents = element[0].innerHTML;
                // clear the original content
                element[0].innerHTML = '';

                // Setup the HTML elements as variable references for use later
                scope.displayElements = {
                    // we still need the hidden input even with a textarea as the textarea may have invalid/old input in it,
                    // wheras the input will ALLWAYS have the correct value.
                    forminput: angular.element("<input type='hidden' tabindex='-1' style='display: none;'>"),
                    html: angular.element("<textarea></textarea>"),
                    text: angular.element("<div></div>"),
                    // other toolbased elements
                    scrollWindow: angular.element("<div class='ta-scroll-window'></div>"),
                    popover: angular.element('<div class="popover fade bottom" style="max-width: none; width: 305px;"></div>'),
                    popoverArrow: angular.element('<div class="arrow"></div>'),
                    popoverContainer: angular.element('<div class="popover-content"></div>'),
                    resize: {
                        overlay: angular.element('<div class="ta-resizer-handle-overlay"></div>'),
                        background: angular.element('<div class="ta-resizer-handle-background"></div>'),
                        anchors: [
                            angular.element('<div class="ta-resizer-handle-corner ta-resizer-handle-corner-tl"></div>'),
                            angular.element('<div class="ta-resizer-handle-corner ta-resizer-handle-corner-tr"></div>'),
                            angular.element('<div class="ta-resizer-handle-corner ta-resizer-handle-corner-bl"></div>'),
                            angular.element('<div class="ta-resizer-handle-corner ta-resizer-handle-corner-br"></div>')
                        ],
                        info: angular.element('<div class="ta-resizer-handle-info"></div>')
                    }
                };

                // Setup the popover
                scope.displayElements.popover.append(scope.displayElements.popoverArrow);
                scope.displayElements.popover.append(scope.displayElements.popoverContainer);
                scope.displayElements.scrollWindow.append(scope.displayElements.popover);

                scope.displayElements.popover.on('mousedown', function(e, eventData){
                    /* istanbul ignore else: this is for catching the jqLite testing*/
                    if(eventData) angular.extend(e, eventData);
                    // this prevents focusout from firing on the editor when clicking anything in the popover
                    e.preventDefault();
                    return false;
                });

                /* istanbul ignore next: popover resize and scroll events handled */
                scope.handlePopoverEvents = function() {
                    if (scope.displayElements.popover.css('display')==='block') {
                        if(_resizeTimeout) $timeout.cancel(_resizeTimeout);
                        _resizeTimeout = $timeout(function() {
                            //console.log('resize', scope.displayElements.popover.css('display'));
                            //
                            if(scope.resizeElement !== undefined) {
                                
                                scope.reflowPopover(scope.resizeElement);
                                scope.reflowResizeOverlay(scope.resizeElement);

                            }

                        }, 100);
                    }
                };

                /* istanbul ignore next: browser resize check */
                angular.element(window).on('resize', scope.handlePopoverEvents);

                /* istanbul ignore next: browser scroll check */
                angular.element(window).on('scroll', scope.handlePopoverEvents);

                // we want to know if a given node has a scrollbar!
                // credit to lotif on http://stackoverflow.com/questions/4880381/check-whether-html-element-has-scrollbars
                var isScrollable = function(node) {
                    var cs;
                    var _notScrollable = {
                        vertical: false,
                        horizontal: false,
                    };
                    try {
                        cs = window.getComputedStyle(node);
                        if (cs === null) {
                            return _notScrollable;
                        }
                    } catch (e) {
                        /* istanbul ignore next: error handler */
                        return _notScrollable;
                    }
                    var overflowY = cs['overflow-y'];
                    var overflowX = cs['overflow-x'];
                    return {
                        vertical: (overflowY === 'scroll' || overflowY === 'auto') &&
                                    /* istanbul ignore next: not tested */
                                    node.scrollHeight > node.clientHeight,
                        horizontal: (overflowX === 'scroll' || overflowX === 'auto') &&
                                    /* istanbul ignore next: not tested */
                                    node.scrollWidth > node.clientWidth,
                    };
                };

                // getScrollTop
                //
                // we structure this so that it can climb the parents of the _el and when it finds
                // one with scrollbars, it adds an EventListener, so that no matter how the
                // DOM is structured in the user APP, if there is a scrollbar not as part of the
                // ta-scroll-window, we will still capture the 'scroll' events...
                // and handle the scroll event properly and do the resize, etc.
                //
                scope.getScrollTop = function (_el, bAddListener) {
                    var scrollTop = _el.scrollTop;
                    if (typeof scrollTop === 'undefined') {
                        scrollTop = 0;
                    }
                    /* istanbul ignore next: triggered only if has scrollbar */
                    if (bAddListener && isScrollable(_el).vertical) {
                        // remove element eventListener
                        _el.removeEventListener('scroll', scope._scrollListener, false);
                        _el.addEventListener('scroll', scope._scrollListener, false);
                    }
                    /* istanbul ignore next: triggered only if has scrollbar and scrolled */
                    if (scrollTop !== 0) {
                        return { node:_el.nodeName, top:scrollTop };
                    }
                    /* istanbul ignore else: catches only if no scroll */
                    if (_el.parentNode) {
                        return scope.getScrollTop(_el.parentNode, bAddListener);
                    } else {
                        return { node:'<none>', top:0 };
                    }
                };

                // define the popover show and hide functions
                scope.showPopover = function(_el){
                    scope.getScrollTop(scope.displayElements.scrollWindow[0], true);
                    scope.displayElements.popover.css('display', 'block');
                    // we must use a $timeout here, or the css change to the
                    // displayElements.resize.overlay will not take!!!
                    // WHY???
                    $timeout(function() {
                        scope.displayElements.resize.overlay.css('display', 'block');
                    });
                    scope.resizeElement = _el;
                    scope.reflowPopover(_el);
                    $animate.addClass(scope.displayElements.popover, 'in');
                    oneEvent($document.find('body'), 'click keyup', function(){scope.hidePopover();});
                };

                /* istanbul ignore next: browser scroll event handler */
                scope._scrollListener = function (e, eventData){
                    scope.handlePopoverEvents();
                };

                scope.reflowPopover = function(_el){
                    var scrollTop = scope.getScrollTop(scope.displayElements.scrollWindow[0], false);
                    var spaceAboveImage = _el[0].offsetTop-scrollTop.top;
                    //var spaceBelowImage = scope.displayElements.text[0].offsetHeight - _el[0].offsetHeight - spaceAboveImage;
                    //console.log(spaceAboveImage, spaceBelowImage);

                    /* istanbul ignore if: catches only if near bottom of editor */
                    if(spaceAboveImage < 51) {
                        scope.displayElements.popover.css('top', _el[0].offsetTop + _el[0].offsetHeight + scope.displayElements.scrollWindow[0].scrollTop + 'px');
                        scope.displayElements.popover.removeClass('top').addClass('bottom');
                    } else {
                        scope.displayElements.popover.css('top', _el[0].offsetTop - 54 + scope.displayElements.scrollWindow[0].scrollTop + 'px');
                        scope.displayElements.popover.removeClass('bottom').addClass('top');
                    }
                    var _maxLeft = scope.displayElements.text[0].offsetWidth - scope.displayElements.popover[0].offsetWidth;
                    var _targetLeft = _el[0].offsetLeft + (_el[0].offsetWidth / 2.0) - (scope.displayElements.popover[0].offsetWidth / 2.0);
                    var _rleft = Math.max(0, Math.min(_maxLeft, _targetLeft));
                    var _marginLeft = (Math.min(_targetLeft, (Math.max(0, _targetLeft - _maxLeft))) - 11);
                    _rleft += window.scrollX;
                    _marginLeft -= window.scrollX;
                    scope.displayElements.popover.css('left', _rleft + 'px');
                    scope.displayElements.popoverArrow.css('margin-left', _marginLeft + 'px');
                };
                scope.hidePopover = function(){
                    scope.displayElements.popover.css('display', 'none');
                    scope.displayElements.popoverContainer.attr('style', '');
                    scope.displayElements.popoverContainer.attr('class', 'popover-content');
                    scope.displayElements.popover.removeClass('in');
                    scope.displayElements.resize.overlay.css('display', 'none');
                };

                // setup the resize overlay
                scope.displayElements.resize.overlay.append(scope.displayElements.resize.background);
                angular.forEach(scope.displayElements.resize.anchors, function(anchor){ scope.displayElements.resize.overlay.append(anchor);});
                scope.displayElements.resize.overlay.append(scope.displayElements.resize.info);
                scope.displayElements.scrollWindow.append(scope.displayElements.resize.overlay);

                // A click event on the resize.background will now shift the focus to the editor
                /* istanbul ignore next: click on the resize.background to focus back to editor */
                scope.displayElements.resize.background.on('click', function(e) {
                    scope.displayElements.text[0].focus();
                });

                // define the show and hide events
                scope.reflowResizeOverlay = function(_el){
                    _el = angular.element(_el)[0];
                    scope.displayElements.resize.overlay.css({
                        'display': 'block',
                        'left': _el.offsetLeft - 5 + 'px',
                        'top': _el.offsetTop - 5 + 'px',
                        'width': _el.offsetWidth + 10 + 'px',
                        'height': _el.offsetHeight + 10 + 'px'
                    });
                    scope.displayElements.resize.info.text(_el.offsetWidth + ' x ' + _el.offsetHeight);
                };
                /* istanbul ignore next: pretty sure phantomjs won't test this */
                scope.showResizeOverlay = function(_el){
                    var _body = $document.find('body');
                    _resizeMouseDown = function(event){
                        var startPosition = {
                            width: parseInt(_el.attr('width')),
                            height: parseInt(_el.attr('height')),
                            x: event.clientX,
                            y: event.clientY
                        };
                        if(startPosition.width === undefined || isNaN(startPosition.width)) startPosition.width = _el[0].offsetWidth;
                        if(startPosition.height === undefined || isNaN(startPosition.height)) startPosition.height = _el[0].offsetHeight;
                        scope.hidePopover();
                        var ratio = startPosition.height / startPosition.width;
                        var mousemove = function(event){
                            // calculate new size
                            var pos = {
                                x: Math.max(0, startPosition.width + (event.clientX - startPosition.x)),
                                y: Math.max(0, startPosition.height + (event.clientY - startPosition.y))
                            };

                            // DEFAULT: the aspect ratio is not locked unless the Shift key is pressed.
                            //
                            // attribute: ta-resize-force-aspect-ratio -- locks resize into maintaing the aspect ratio
                            var bForceAspectRatio = (attrs.taResizeForceAspectRatio !== undefined);
                            // attribute: ta-resize-maintain-aspect-ratio=true causes the space ratio to remain locked
                            // unless the Shift key is pressed
                            var bFlipKeyBinding = attrs.taResizeMaintainAspectRatio;
                            var bKeepRatio =  bForceAspectRatio || (bFlipKeyBinding && !event.shiftKey);
                            if(bKeepRatio) {
                                var newRatio = pos.y / pos.x;
                                pos.x = ratio > newRatio ? pos.x : pos.y / ratio;
                                pos.y = ratio > newRatio ? pos.x * ratio : pos.y;
                            }
                            var el = angular.element(_el);
                            function roundedMaxVal(val) {
                                return Math.round(Math.max(0, val));
                            }
                            el.css('height', roundedMaxVal(pos.y) + 'px');
                            el.css('width', roundedMaxVal(pos.x) + 'px');

                            // reflow the popover tooltip
                            scope.reflowResizeOverlay(_el);
                        };
                        _body.on('mousemove', mousemove);
                        oneEvent(_body, 'mouseup', function(event){
                            event.preventDefault();
                            event.stopPropagation();
                            _body.off('mousemove', mousemove);
                            // at this point, we need to force the model to update! since the css has changed!
                            // this fixes bug: #862 - we now hide the popover -- as this seems more consitent.
                            // there are still issues under firefox, the window does not repaint. -- not sure
                            // how best to resolve this, but clicking anywhere works.
                            scope.$apply(function (){
                                scope.hidePopover();
                                scope.updateTaBindtaTextElement();
                            }, 100);
                        });
                        event.stopPropagation();
                        event.preventDefault();
                    };

                    scope.displayElements.resize.anchors[3].off('mousedown');
                    scope.displayElements.resize.anchors[3].on('mousedown', _resizeMouseDown);

                    scope.reflowResizeOverlay(_el);
                    oneEvent(_body, 'click', function(){scope.hideResizeOverlay();});
                };
                /* istanbul ignore next: pretty sure phantomjs won't test this */
                scope.hideResizeOverlay = function(){
                    scope.displayElements.resize.anchors[3].off('mousedown', _resizeMouseDown);
                    scope.displayElements.resize.overlay.css('display', 'none');
                };

                // allow for insertion of custom directives on the textarea and div
                scope.setup.htmlEditorSetup(scope.displayElements.html);
                scope.setup.textEditorSetup(scope.displayElements.text);
                scope.displayElements.html.attr({
                    'id': 'taHtmlElement' + _serial,
                    'ng-show': 'showHtml',
                    'ta-bind': 'ta-bind',
                    'ng-model': 'html',
                    'ng-model-options': element.attr('ng-model-options')
                });
                scope.displayElements.text.attr({
                    'id': 'taTextElement' + _serial,
                    'contentEditable': 'true',
                    'ta-bind': 'ta-bind',
                    'ng-model': 'html',
                    'ng-model-options': element.attr('ng-model-options')
                });
                scope.displayElements.scrollWindow.attr({'ng-hide': 'showHtml'});
                if(attrs.taDefaultWrap) {
                    // taDefaultWrap is only applied to the text and not the html view
                    scope.displayElements.text.attr('ta-default-wrap', attrs.taDefaultWrap);
                }

                if(attrs.taUnsafeSanitizer){
                    scope.displayElements.text.attr('ta-unsafe-sanitizer', attrs.taUnsafeSanitizer);
                    scope.displayElements.html.attr('ta-unsafe-sanitizer', attrs.taUnsafeSanitizer);
                }

                if(attrs.taKeepStyles){
                    scope.displayElements.text.attr('ta-keep-styles', attrs.taKeepStyles);
                    scope.displayElements.html.attr('ta-keep-styles', attrs.taKeepStyles);
                }

                // add the main elements to the origional element
                scope.displayElements.scrollWindow.append(scope.displayElements.text);
                element.append(scope.displayElements.scrollWindow);
                element.append(scope.displayElements.html);

                scope.displayElements.forminput.attr('name', scope._name);
                element.append(scope.displayElements.forminput);

                if(attrs.tabindex){
                    element.removeAttr('tabindex');
                    scope.displayElements.text.attr('tabindex', attrs.tabindex);
                    scope.displayElements.html.attr('tabindex', attrs.tabindex);
                }

                if (attrs.placeholder) {
                    scope.displayElements.text.attr('placeholder', attrs.placeholder);
                    scope.displayElements.html.attr('placeholder', attrs.placeholder);
                }

                if(attrs.taDisabled){
                    scope.displayElements.text.attr('ta-readonly', 'disabled');
                    scope.displayElements.html.attr('ta-readonly', 'disabled');
                    scope.disabled = scope.$parent.$eval(attrs.taDisabled);
                    scope.$parent.$watch(attrs.taDisabled, function(newVal){
                        scope.disabled = newVal;
                        if(scope.disabled){
                            element.addClass(scope.classes.disabled);
                        }else{
                            element.removeClass(scope.classes.disabled);
                        }
                    });
                }

                if(attrs.taPaste){
                    scope._pasteHandler = function(_html){
                        return $parse(attrs.taPaste)(scope.$parent, {$html: _html});
                    };
                    scope.displayElements.text.attr('ta-paste', '_pasteHandler($html)');
                }

                // compile the scope with the text and html elements only - if we do this with the main element it causes a compile loop
                $compile(scope.displayElements.scrollWindow)(scope);
                $compile(scope.displayElements.html)(scope);

                scope.updateTaBindtaTextElement = scope['updateTaBindtaTextElement' + _serial];
                scope.updateTaBindtaHtmlElement = scope['updateTaBindtaHtmlElement' + _serial];

                // add the classes manually last
                element.addClass("ta-root");
                scope.displayElements.scrollWindow.addClass("ta-text ta-editor " + scope.classes.textEditor);
                scope.displayElements.html.addClass("ta-html ta-editor " + scope.classes.htmlEditor);

                var testAndSet = function(choice, beforeState) {
                    /* istanbul ignore next: this is only here because of a bug in rangy where rangy.saveSelection() has cleared the state */
                    if (beforeState !== $document[0].queryCommandState(choice)) {
                        $document[0].execCommand(choice, false, null);
                    }
                };
                // used in the toolbar actions
                scope._actionRunning = false;
                var _savedSelection = false;
                scope.startAction = function(){
                    var _beforeStateBold = false;
                    var _beforeStateItalic = false;
                    var _beforeStateUnderline = false;
                    var _beforeStateStrikethough = false;
                    scope._actionRunning = true;
                    _beforeStateBold = $document[0].queryCommandState('bold');
                    _beforeStateItalic = $document[0].queryCommandState('italic');
                    _beforeStateUnderline = $document[0].queryCommandState('underline');
                    _beforeStateStrikethough = $document[0].queryCommandState('strikeThrough');
                    //console.log('B', _beforeStateBold, 'I', _beforeStateItalic, '_', _beforeStateUnderline, 'S', _beforeStateStrikethough);
                    // if rangy library is loaded return a function to reload the current selection
                    _savedSelection = rangy.saveSelection();
                    // rangy.saveSelection() clear the state of bold, italic, underline, strikethrough
                    // so we reset them here....!!!
                    // this fixes bugs #423, #1129, #1105, #693 which are actually rangy bugs!
                    testAndSet('bold', _beforeStateBold);
                    testAndSet('italic', _beforeStateItalic);
                    testAndSet('underline', _beforeStateUnderline);
                    testAndSet('strikeThrough', _beforeStateStrikethough);
                    //console.log('B', $document[0].queryCommandState('bold'), 'I', $document[0].queryCommandState('italic'), '_', $document[0].queryCommandState('underline'), 'S', $document[0].queryCommandState('strikeThrough') );
                    return function(){
                        if(_savedSelection) rangy.restoreSelection(_savedSelection);
                        // perhaps if we restore the selections here, we would do better overall???
                        // BUT what we do above does well in 90% of the cases...
                    };
                };
                scope.endAction = function(){
                    scope._actionRunning = false;
                    if(_savedSelection){
                        if(scope.showHtml){
                            scope.displayElements.html[0].focus();
                        }else{
                            scope.displayElements.text[0].focus();
                        }
                        // rangy.restoreSelection(_savedSelection);
                        rangy.removeMarkers(_savedSelection);
                    }
                    _savedSelection = false;
                    scope.updateSelectedStyles();
                    // only update if in text or WYSIWYG mode
                    if(!scope.showHtml) scope['updateTaBindtaTextElement' + _serial]();
                };

                // note that focusout > focusin is called everytime we click a button - except bad support: http://www.quirksmode.org/dom/events/blurfocus.html
                // cascades to displayElements.text and displayElements.html automatically.
                _focusin = function(e){
                    scope.focussed = true;
                    element.addClass(scope.classes.focussed);
/*******  NOT FUNCTIONAL YET
                    if (e.target.id === 'taTextElement' + _serial) {
                        console.log('_focusin taTextElement');
                        // we only do this if NOT focussed
                        textAngularManager.restoreFocusSelection(scope._name);
                    }
*******/
                    _editorFunctions.focus();
                    element.triggerHandler('focus');
                    // we call editorScope.updateSelectedStyles() here because we want the toolbar to be focussed
                    // as soon as we have focus.  Otherwise this only happens on mousedown or keydown etc...
                    /* istanbul ignore else: don't run if already running */
                    if(scope.updateSelectedStyles && !scope._bUpdateSelectedStyles){
                        // we don't set editorScope._bUpdateSelectedStyles here, because we do not want the
                        // updateSelectedStyles() to run twice which it will do after 200 msec if we have
                        // set editorScope._bUpdateSelectedStyles
                        //
                        // WOW, normally I would do a scope.$apply here, but this causes ERRORs when doing tests!
                        $timeout(function () {
                            scope.updateSelectedStyles();
                        }, 0);
                    }
                };
                scope.displayElements.html.on('focus', _focusin);
                scope.displayElements.text.on('focus', _focusin);
                _focusout = function(e){
                    /****************** NOT FUNCTIONAL YET
                    try {
                        var _s = rangy.getSelection();
                        if (_s) {
                            // we save the selection when we loose focus so that if do a wrapSelection, the
                            // apropriate selection in the editor is restored before action.
                            var _savedFocusRange = rangy.saveRange(_s.getRangeAt(0));
                            textAngularManager.saveFocusSelection(scope._name, _savedFocusRange);
                        }
                    } catch(error) { }
                    *****************/
                    // if we are NOT runnig an action and have NOT focussed again on the text etc then fire the blur events
                    if(!scope._actionRunning &&
                        $document[0].activeElement !== scope.displayElements.html[0] &&
                        $document[0].activeElement !== scope.displayElements.text[0])
                    {
                        element.removeClass(scope.classes.focussed);
                        _editorFunctions.unfocus();
                        // to prevent multiple apply error defer to next seems to work.
                        $timeout(function(){
                            scope._bUpdateSelectedStyles = false;
                            element.triggerHandler('blur');
                            scope.focussed = false;
                        }, 0);
                    }
                    e.preventDefault();
                    return false;
                };
                scope.displayElements.html.on('blur', _focusout);
                scope.displayElements.text.on('blur', _focusout);

                scope.displayElements.text.on('paste', function(event){
                    element.triggerHandler('paste', event);
                });

                // Setup the default toolbar tools, this way allows the user to add new tools like plugins.
                // This is on the editor for future proofing if we find a better way to do this.
                scope.queryFormatBlockState = function(command){
                    // $document[0].queryCommandValue('formatBlock') errors in Firefox if we call this when focussed on the textarea
                    return !scope.showHtml && command.toLowerCase() === $document[0].queryCommandValue('formatBlock').toLowerCase();
                };
                scope.queryCommandState = function(command){
                    // $document[0].queryCommandValue('formatBlock') errors in Firefox if we call this when focussed on the textarea
                    return (!scope.showHtml) ? $document[0].queryCommandState(command) : '';
                };
                scope.switchView = function(){
                    scope.showHtml = !scope.showHtml;
                    $animate.enabled(false, scope.displayElements.html);
                    $animate.enabled(false, scope.displayElements.text);
                    //Show the HTML view
                    /* istanbul ignore next: ngModel exists check */
/* THIS is not the correct thing to do, here....
   The ngModel is correct, but it is not formatted as the user as done it...
                    var _model;
                    if (ngModel) {
                        _model = ngModel.$viewValue;
                    } else {
                        _model = scope.html;
                    }
                    var _html = scope.displayElements.html[0].value;
                    if (getDomFromHtml(_html).childElementCount !== getDomFromHtml(_model).childElementCount) {
                        // the model and the html do not agree
                        // they can get out of sync and when they do, we correct that here...
                        scope.displayElements.html.val(_model);
                    }
*/
                    if(scope.showHtml){
                        //defer until the element is visible
                        $timeout(function(){
                            $animate.enabled(true, scope.displayElements.html);
                            $animate.enabled(true, scope.displayElements.text);
                            // [0] dereferences the DOM object from the angular.element
                            return scope.displayElements.html[0].focus();
                        }, 100);
                    }else{
                        //Show the WYSIWYG view
                        //defer until the element is visible
                        $timeout(function(){
                            $animate.enabled(true, scope.displayElements.html);
                            $animate.enabled(true, scope.displayElements.text);
                            // [0] dereferences the DOM object from the angular.element
                            return scope.displayElements.text[0].focus();
                        }, 100);
                    }
                };

                // changes to the model variable from outside the html/text inputs
                // if no ngModel, then the only input is from inside text-angular
                if(attrs.ngModel){
                    var _firstRun = true;
                    ngModel.$render = function(){
                        if(_firstRun){
                            // we need this firstRun to set the originalContents otherwise it gets overrided by the setting of ngModel to undefined from NaN
                            _firstRun = false;
                            // if view value is null or undefined initially and there was original content, set to the original content
                            var _initialValue = scope.$parent.$eval(attrs.ngModel);
                            if((_initialValue === undefined || _initialValue === null) && (_originalContents && _originalContents !== '')){
                                // on passing through to taBind it will be sanitised
                                ngModel.$setViewValue(_originalContents);
                            }
                        }
                        scope.displayElements.forminput.val(ngModel.$viewValue);
                        // if the editors aren't focused they need to be updated, otherwise they are doing the updating
                        scope.html = ngModel.$viewValue || '';
                    };
                    // trigger the validation calls
                    if(element.attr('required')) ngModel.$validators.required = function(modelValue, viewValue) {
                        var value = modelValue || viewValue;
                        return !(!value || value.trim() === '');
                    };
                }else{
                    // if no ngModel then update from the contents of the origional html.
                    scope.displayElements.forminput.val(_originalContents);
                    scope.html = _originalContents;
                }

                // changes from taBind back up to here
                scope.$watch('html', function(newValue, oldValue){
                    if(newValue !== oldValue){
                        if(attrs.ngModel && ngModel.$viewValue !== newValue) {
                            ngModel.$setViewValue(newValue);
                        }
                        scope.displayElements.forminput.val(newValue);
                    }
                });

                if(attrs.taTargetToolbars) {
                    _editorFunctions = textAngularManager.registerEditor(scope._name, scope, attrs.taTargetToolbars.split(','));
                }
                else{
                    var _toolbar = angular.element('<div text-angular-toolbar name="textAngularToolbar' + _serial + '">');
                    // passthrough init of toolbar options
                    if(attrs.taToolbar)						_toolbar.attr('ta-toolbar', attrs.taToolbar);
                    if(attrs.taToolbarClass)				_toolbar.attr('ta-toolbar-class', attrs.taToolbarClass);
                    if(attrs.taToolbarGroupClass)			_toolbar.attr('ta-toolbar-group-class', attrs.taToolbarGroupClass);
                    if(attrs.taToolbarButtonClass)			_toolbar.attr('ta-toolbar-button-class', attrs.taToolbarButtonClass);
                    if(attrs.taToolbarActiveButtonClass)	_toolbar.attr('ta-toolbar-active-button-class', attrs.taToolbarActiveButtonClass);
                    if(attrs.taFocussedClass)				_toolbar.attr('ta-focussed-class', attrs.taFocussedClass);

                    element.prepend(_toolbar);
                    $compile(_toolbar)(scope.$parent);
                    _editorFunctions = textAngularManager.registerEditor(scope._name, scope, ['textAngularToolbar' + _serial]);
                }

                scope.$on('$destroy', function(){
                    textAngularManager.unregisterEditor(scope._name);
                    angular.element(window).off('blur');
                    angular.element(window).off('resize', scope.handlePopoverEvents);
                    angular.element(window).off('scroll', scope.handlePopoverEvents);
                });

                // catch element select event and pass to toolbar tools
                scope.$on('ta-element-select', function(event, element){
                    if(_editorFunctions.triggerElementSelect(event, element)){
                        scope['reApplyOnSelectorHandlerstaTextElement' + _serial]();
                    }
                });

/******************* no working fully
                var distanceFromPoint = function (px, py, x, y) {
                    return Math.sqrt((px-x)*(px-x)+(py-y)*(py-y));
                };
                // because each object is a rectangle and we have a single point,
                // we need to give priority if the point is inside the rectangle
                var getPositionDistance = function(el, x, y) {
                    var range = document.createRange();
                    range.selectNode(el);
                    var rect = range.getBoundingClientRect();
                    console.log(el, rect);
                    range.detach();
                    var bcr = rect;
                    // top left
                    var d1 = distanceFromPoint(bcr.left, bcr.top, x, y);
                    // bottom left
                    var d2 = distanceFromPoint(bcr.left, bcr.bottom, x, y);
                    // top right
                    var d3 = distanceFromPoint(bcr.right, bcr.top, x, y);
                    // bottom right
                    var d4 = distanceFromPoint(bcr.right, bcr.bottom, x, y);
                    return Math.min(d1, d2, d3, d4);
                };
                var findClosest = function(el, minElement, maxDistance, x, y) {
                    var _d=0;
                    for (var i = 0; i < el.childNodes.length; i++) {
                        var _n = el.childNodes[i];
                        if (!_n.childNodes.length) {
                            _d = getPositionDistance(_n, x, y);
                            //console.log(_n, _n.childNodes, _d);
                            if (_d < maxDistance) {
                                maxDistance = _d;
                                minElement = _n;
                            }
                        }
                        var res = findClosest(_n, minElement, maxDistance, x, y);
                        if (res.max < maxDistance) {
                            maxDistance = res.max;
                            minElement = res.min;
                        }
                    }
                    return { max: maxDistance, min: minElement };
                };
                var getClosestElement = function (el, x, y) {
                    return findClosest(el, null, 12341234124, x, y);
                };
****************/

                scope.$on('ta-drop-event', function(event, element, dropEvent, dataTransfer){
                    if(dataTransfer && dataTransfer.files && dataTransfer.files.length > 0){
                        scope.displayElements.text[0].focus();
                        // we must set the location of the drop!
                        //console.log(dropEvent.clientX, dropEvent.clientY, dropEvent.target);
                        taSelection.setSelectionToElementEnd(dropEvent.target);
                        angular.forEach(dataTransfer.files, function(file){
                            // taking advantage of boolean execution, if the fileDropHandler returns true, nothing else after it is executed
                            // If it is false then execute the defaultFileDropHandler if the fileDropHandler is NOT the default one
                            // Once one of these has been executed wrap the result as a promise, if undefined or variable update the taBind, else we should wait for the promise
                            try{
                                $q.when(scope.fileDropHandler(file, scope.wrapSelection) ||
                                    (scope.fileDropHandler !== scope.defaultFileDropHandler &&
                                    $q.when(scope.defaultFileDropHandler(file, scope.wrapSelection)))).then(function(){
                                        scope['updateTaBindtaTextElement' + _serial]();
                                    });
                            }catch(error){
                                $log.error(error);
                            }
                        });
                        dropEvent.preventDefault();
                        dropEvent.stopPropagation();
                    /* istanbul ignore else, the updates if moved text */
                    }else{
                        $timeout(function(){
                            scope['updateTaBindtaTextElement' + _serial]();
                        }, 0);
                    }
                });

                // the following is for applying the active states to the tools that support it
                scope._bUpdateSelectedStyles = false;
                /* istanbul ignore next: browser window/tab leave check */
                angular.element(window).on('blur', function(){
                    scope._bUpdateSelectedStyles = false;
                    scope.focussed = false;
                });
                // loop through all the tools polling their activeState function if it exists
                scope.updateSelectedStyles = function(){
                    var _selection;
                    /* istanbul ignore next: This check is to ensure multiple timeouts don't exist */
                    if(_updateSelectedStylesTimeout) $timeout.cancel(_updateSelectedStylesTimeout);
                    // test if the common element ISN'T the root ta-text node
                    if((_selection = taSelection.getSelectionElement()) !== undefined && _selection.parentNode !== scope.displayElements.text[0]){
                        _editorFunctions.updateSelectedStyles(angular.element(_selection));
                    }else _editorFunctions.updateSelectedStyles();
                    // used to update the active state when a key is held down, ie the left arrow
                    /* istanbul ignore else: browser only check */
                    if(scope._bUpdateSelectedStyles) _updateSelectedStylesTimeout = $timeout(scope.updateSelectedStyles, 200);
                };
                // start updating on keydown
                _keydown = function(){
                    /* istanbul ignore next: ie catch */
                    if(!scope.focussed){
                        scope._bUpdateSelectedStyles = false;
                        return;
                    }
                    /* istanbul ignore else: don't run if already running */
                    if(!scope._bUpdateSelectedStyles){
                        scope._bUpdateSelectedStyles = true;
                        scope.$apply(function(){
                            scope.updateSelectedStyles();
                        });
                    }
                };
                scope.displayElements.html.on('keydown', _keydown);
                scope.displayElements.text.on('keydown', _keydown);
                // stop updating on key up and update the display/model
                _keyup = function(){
                    scope._bUpdateSelectedStyles = false;
                };
                scope.displayElements.html.on('keyup', _keyup);
                scope.displayElements.text.on('keyup', _keyup);
                // stop updating on key up and update the display/model
                _keypress = function(event, eventData){
                    // bug fix for Firefox.  If we are selecting a <a> already, any characters will
                    // be added within the <a> which is bad!
                    /* istanbul ignore next: don't see how to test this... */
                    if (taSelection.getSelection) {
                        var _selection = taSelection.getSelection();
                        // in a weird case (can't reproduce) taSelection.getSelectionElement() can be undefined!!
                        // this comes from range.commonAncestorContainer;
                        // so I check for this here which fixes the error case
                        if (taSelection.getSelectionElement() && taSelection.getSelectionElement().nodeName.toLowerCase() === 'a') {
                            // check and see if we are at the edge of the <a>
                            if (_selection.start.element.nodeType === 3 &&
                                _selection.start.element.textContent.length === _selection.end.offset) {
                                // we are at the end of the <a>!!!
                                // so move the selection to after the <a>!!
                                taSelection.setSelectionAfterElement(taSelection.getSelectionElement());
                            }
                            if (_selection.start.element.nodeType === 3 &&
                                _selection.start.offset === 0) {
                                // we are at the start of the <a>!!!
                                // so move the selection before the <a>!!
                                taSelection.setSelectionBeforeElement(taSelection.getSelectionElement());
                            }
                        }
                    }
                    /* istanbul ignore else: this is for catching the jqLite testing*/
                    if(eventData) angular.extend(event, eventData);
                    scope.$apply(function(){
                        if(_editorFunctions.sendKeyCommand(event)){
                            /* istanbul ignore else: don't run if already running */
                            if(!scope._bUpdateSelectedStyles){
                                scope.updateSelectedStyles();
                            }
                            event.preventDefault();
                            return false;
                        }
                    });
                };
                scope.displayElements.html.on('keypress', _keypress);
                scope.displayElements.text.on('keypress', _keypress);
                // update the toolbar active states when we click somewhere in the text/html boxed
                _mouseup = function(){
                    // ensure only one execution of updateSelectedStyles()
                    scope._bUpdateSelectedStyles = false;
                    // for some reason, unless we do a $timeout here, after a _mouseup when the line is
                    // highlighted, and instead use a scope.$apply(function(){ scope.updateSelectedStyles(); });
                    // doesn't work properly, so we replaced this with:
                    /* istanbul ignore next: not tested  */
                    $timeout(function() { scope.updateSelectedStyles(); }, 0);
                };
                scope.displayElements.html.on('mouseup', _mouseup);
                scope.displayElements.text.on('mouseup', _mouseup);
            }
        };
    }
]);
textAngular.service('textAngularManager', ['taToolExecuteAction', 'taTools', 'taRegisterTool', '$interval', '$rootScope', '$log',
    function(taToolExecuteAction, taTools, taRegisterTool, $interval, $rootScope, $log){
    // this service is used to manage all textAngular editors and toolbars.
    // All publicly published functions that modify/need to access the toolbar or editor scopes should be in here
    // these contain references to all the editors and toolbars that have been initialised in this app
    var toolbars = {}, editors = {};
    // we touch the time any change occurs through register of an editor or tool so that we
    // in the future will fire and event to trigger an updateSelection
    var timeRecentModification = 0;
    var updateStyles = function(selectedElement){
        angular.forEach(editors, function(editor) {
            editor.editorFunctions.updateSelectedStyles(selectedElement);
        });
    };
    var triggerInterval = 50;
    var triggerIntervalTimer;
    var setupTriggerUpdateStyles = function() {
        timeRecentModification = Date.now();
        /* istanbul ignore next: setup a one time updateStyles() */
        triggerIntervalTimer = $interval(function() {
            updateStyles();
            triggerIntervalTimer = undefined;
        }, triggerInterval, 1); // only trigger once
    };
    /* istanbul ignore next: make sure clean up on destroy */
    $rootScope.$on('destroy', function() {
        if (triggerIntervalTimer) {
            $interval.cancel(triggerIntervalTimer);
            triggerIntervalTimer = undefined;
        }
    });
    var touchModification = function() {
        if (Math.abs(Date.now() - timeRecentModification) > triggerInterval) {
            // we have already triggered the updateStyles a long time back... so setup it again...
            setupTriggerUpdateStyles();
        }
    };
    // when we focus into a toolbar, we need to set the TOOLBAR's $parent to be the toolbars it's linked to.
    // We also need to set the tools to be updated to be the toolbars...
    return {
        // register an editor and the toolbars that it is affected by
        registerEditor: function(editorName, editorScope, targetToolbars){
            // NOTE: name === editorScope._name
            // targetToolbars is an [] of 'toolbar name's
            // targetToolbars are optional, we don't require a toolbar to function
            if(!editorName || editorName === '') throw('textAngular Error: An editor requires a name');
            if(!editorScope) throw('textAngular Error: An editor requires a scope');
            if(editors[editorName]) throw('textAngular Error: An Editor with name "' + editorName + '" already exists');
            editors[editorName] = {
                scope: editorScope,
                toolbars: targetToolbars,
                // toolbarScopes used by this editor
                toolbarScopes: [],
                _registerToolbarScope: function(toolbarScope){
                    // add to the list late
                    if(this.toolbars.indexOf(toolbarScope.name) >= 0) {
                        // if this toolbarScope is being used by this editor we add it as one of the scopes
                        this.toolbarScopes.push(toolbarScope);
                    }
                },
                // this is a suite of functions the editor should use to update all it's linked toolbars
                editorFunctions: {
                    disable: function(){
                        // disable all linked toolbars
                        angular.forEach(editors[editorName].toolbarScopes, function(toolbarScope){
                            toolbarScope.disabled = true;
                        });
                    },
                    enable: function(){
                        // enable all linked toolbars
                        angular.forEach(editors[editorName].toolbarScopes, function(toolbarScope){
                            toolbarScope.disabled = false;
                        });
                    },
                    focus: function(){
                        // this should be called when the editor is focussed
                        angular.forEach(editors[editorName].toolbarScopes, function(toolbarScope){
                            toolbarScope._parent = editorScope;
                            toolbarScope.disabled = false;
                            toolbarScope.focussed = true;
                        });
                        editorScope.focussed = true;
                    },
                    unfocus: function(){
                        // this should be called when the editor becomes unfocussed
                        angular.forEach(editors[editorName].toolbarScopes, function(toolbarScope){
                            toolbarScope.disabled = true;
                            toolbarScope.focussed = false;
                        });
                        editorScope.focussed = false;
                    },
                    updateSelectedStyles: function(selectedElement){
                        // update the active state of all buttons on liked toolbars
                        angular.forEach(editors[editorName].toolbarScopes, function(toolbarScope){
                            angular.forEach(toolbarScope.tools, function(toolScope){
                                if(toolScope.activeState){
                                    toolbarScope._parent = editorScope;
                                    // selectedElement may be undefined if nothing selected
                                    toolScope.active = toolScope.activeState(selectedElement);
                                }
                            });
                        });
                    },
                    sendKeyCommand: function(event){
                        // we return true if we applied an action, false otherwise
                        var result = false;
                        if(event.ctrlKey || event.metaKey || event.specialKey) angular.forEach(taTools, function(tool, name){
                            if(tool.commandKeyCode && (tool.commandKeyCode === event.which || tool.commandKeyCode === event.specialKey)){
                                for(var _t = 0; _t < editors[editorName].toolbarScopes.length; _t++){
                                    if(editors[editorName].toolbarScopes[_t].tools[name] !== undefined){
                                        taToolExecuteAction.call(editors[editorName].toolbarScopes[_t].tools[name], editorScope);
                                        result = true;
                                        break;
                                    }
                                }
                            }
                        });
                        return result;
                    },
                    triggerElementSelect: function(event, element){
                        // search through the taTools to see if a match for the tag is made.
                        // if there is, see if the tool is on a registered toolbar and not disabled.
                        // NOTE: This can trigger on MULTIPLE tools simultaneously.
                        var elementHasAttrs = function(_element, attrs){
                            var result = true;
                            for(var i = 0; i < attrs.length; i++) result = result && _element.attr(attrs[i]);
                            return result;
                        };
                        var workerTools = [];
                        var unfilteredTools = {};
                        var result = false;
                        element = angular.element(element);
                        // get all valid tools by element name, keep track if one matches the
                        var onlyWithAttrsFilter = false;
                        angular.forEach(taTools, function(tool, name){
                            if(
                                tool.onElementSelect &&
                                tool.onElementSelect.element &&
                                tool.onElementSelect.element.toLowerCase() === element[0].tagName.toLowerCase() &&
                                (!tool.onElementSelect.filter || tool.onElementSelect.filter(element))
                            ){
                                // this should only end up true if the element matches the only attributes
                                onlyWithAttrsFilter = onlyWithAttrsFilter ||
                                    (angular.isArray(tool.onElementSelect.onlyWithAttrs) && elementHasAttrs(element, tool.onElementSelect.onlyWithAttrs));
                                if(!tool.onElementSelect.onlyWithAttrs || elementHasAttrs(element, tool.onElementSelect.onlyWithAttrs)) unfilteredTools[name] = tool;
                            }
                        });
                        // if we matched attributes to filter on, then filter, else continue
                        if(onlyWithAttrsFilter){
                            angular.forEach(unfilteredTools, function(tool, name){
                                if(tool.onElementSelect.onlyWithAttrs && elementHasAttrs(element, tool.onElementSelect.onlyWithAttrs)) workerTools.push({'name': name, 'tool': tool});
                            });
                            // sort most specific (most attrs to find) first
                            workerTools.sort(function(a,b){
                                return b.tool.onElementSelect.onlyWithAttrs.length - a.tool.onElementSelect.onlyWithAttrs.length;
                            });
                        }else{
                            angular.forEach(unfilteredTools, function(tool, name){
                                workerTools.push({'name': name, 'tool': tool});
                            });
                        }
                        // Run the actions on the first visible filtered tool only
                        if(workerTools.length > 0){
                            for(var _i = 0; _i < workerTools.length; _i++){
                                var tool = workerTools[_i].tool;
                                var name = workerTools[_i].name;
                                for(var _t = 0; _t < editors[editorName].toolbarScopes.length; _t++){
                                    if(editors[editorName].toolbarScopes[_t].tools[name] !== undefined){
                                        tool.onElementSelect.action.call(editors[editorName].toolbarScopes[_t].tools[name], event, element, editorScope);
                                        result = true;
                                        break;
                                    }
                                }
                                if(result) break;
                            }
                        }
                        return result;
                    }
                }
            };
            angular.forEach(targetToolbars, function(_name){
                if(toolbars[_name]) {
                    editors[editorName].toolbarScopes.push(toolbars[_name]);
                }
                // if it doesn't exist it may not have been compiled yet and it will be added later
            });
            touchModification();
            return editors[editorName].editorFunctions;
        },
        // retrieve editor by name, largely used by testing suites only
        retrieveEditor: function(name){
            return editors[name];
        },
        unregisterEditor: function(name){
            delete editors[name];
            touchModification();
        },
        // registers a toolbar such that it can be linked to editors
        registerToolbar: function(toolbarScope){
            if(!toolbarScope) throw('textAngular Error: A toolbar requires a scope');
            if(!toolbarScope.name || toolbarScope.name === '') throw('textAngular Error: A toolbar requires a name');
            if(toolbars[toolbarScope.name]) throw('textAngular Error: A toolbar with name "' + toolbarScope.name + '" already exists');
            toolbars[toolbarScope.name] = toolbarScope;
            // walk all the editors and connect this toolbarScope to the editors.... if we need to.  This way, it does
            // not matter if we register the editors after the toolbars or not
            // Note the editor will ignore this toolbarScope if it is not connected to it...
            angular.forEach(editors, function(_editor){
                _editor._registerToolbarScope(toolbarScope);
            });
            touchModification();
        },
        // retrieve toolbar by name, largely used by testing suites only
        retrieveToolbar: function(name){
            return toolbars[name];
        },
        // retrieve toolbars by editor name, largely used by testing suites only
        retrieveToolbarsViaEditor: function(name){
            var result = [], _this = this;
            angular.forEach(this.retrieveEditor(name).toolbars, function(name){
                result.push(_this.retrieveToolbar(name));
            });
            return result;
        },
        unregisterToolbar: function(name){
            delete toolbars[name];
            touchModification();
        },
        // functions for updating the toolbar buttons display
        updateToolsDisplay: function(newTaTools){
            // pass a partial struct of the taTools, this allows us to update the tools on the fly, will not change the defaults.
            var _this = this;
            angular.forEach(newTaTools, function(_newTool, key){
                _this.updateToolDisplay(key, _newTool);
            });
        },
        // this function resets all toolbars to their default tool definitions
        resetToolsDisplay: function(){
            var _this = this;
            angular.forEach(taTools, function(_newTool, key){
                _this.resetToolDisplay(key);
            });
            touchModification();
        },
        // update a tool on all toolbars
        updateToolDisplay: function(toolKey, _newTool){
            var _this = this;
            angular.forEach(toolbars, function(toolbarScope, toolbarKey){
                _this.updateToolbarToolDisplay(toolbarKey, toolKey, _newTool);
            });
            touchModification();
        },
        // resets a tool to the default/starting state on all toolbars
        resetToolDisplay: function(toolKey){
            var _this = this;
            angular.forEach(toolbars, function(toolbarScope, toolbarKey){
                _this.resetToolbarToolDisplay(toolbarKey, toolKey);
            });
            touchModification();
        },
        // update a tool on a specific toolbar
        updateToolbarToolDisplay: function(toolbarKey, toolKey, _newTool){
            if(toolbars[toolbarKey]) toolbars[toolbarKey].updateToolDisplay(toolKey, _newTool);
            else throw('textAngular Error: No Toolbar with name "' + toolbarKey + '" exists');
        },
        // reset a tool on a specific toolbar to it's default starting value
        resetToolbarToolDisplay: function(toolbarKey, toolKey){
            if(toolbars[toolbarKey]) toolbars[toolbarKey].updateToolDisplay(toolKey, taTools[toolKey], true);
            else throw('textAngular Error: No Toolbar with name "' + toolbarKey + '" exists');
        },
        // removes a tool from all toolbars and it's definition
        removeTool: function(toolKey){
            delete taTools[toolKey];
            angular.forEach(toolbars, function(toolbarScope){
                delete toolbarScope.tools[toolKey];
                for(var i = 0; i < toolbarScope.toolbar.length; i++){
                    var toolbarIndex;
                    for(var j = 0; j < toolbarScope.toolbar[i].length; j++){
                        if(toolbarScope.toolbar[i][j] === toolKey){
                            toolbarIndex = {
                                group: i,
                                index: j
                            };
                            break;
                        }
                        if(toolbarIndex !== undefined) break;
                    }
                    if(toolbarIndex !== undefined){
                        toolbarScope.toolbar[toolbarIndex.group].slice(toolbarIndex.index, 1);
                        toolbarScope._$element.children().eq(toolbarIndex.group).children().eq(toolbarIndex.index).remove();
                    }
                }
            });
            touchModification();
        },
        // toolkey, toolDefinition are required. If group is not specified will pick the last group, if index isnt defined will append to group
        addTool: function(toolKey, toolDefinition, group, index){
            taRegisterTool(toolKey, toolDefinition);
            angular.forEach(toolbars, function(toolbarScope){
                toolbarScope.addTool(toolKey, toolDefinition, group, index);
            });
            touchModification();
        },
        // adds a Tool but only to one toolbar not all
        addToolToToolbar: function(toolKey, toolDefinition, toolbarKey, group, index){
            taRegisterTool(toolKey, toolDefinition);
            toolbars[toolbarKey].addTool(toolKey, toolDefinition, group, index);
            touchModification();
        },
        // this is used when externally the html of an editor has been changed and textAngular needs to be notified to update the model.
        // this will call a $digest if not already happening
        refreshEditor: function(name){
            if(editors[name]){
                editors[name].scope.updateTaBindtaTextElement();
                /* istanbul ignore else: phase catch */
                if(!editors[name].scope.$$phase) editors[name].scope.$digest();
            }else throw('textAngular Error: No Editor with name "' + name + '" exists');
            touchModification();
        },
        // this is used by taBind to send a key command in response to a special key event
        sendKeyCommand: function(scope, event){
            var _editor = editors[scope._name];
            /* istanbul ignore else: if nothing to do, do nothing */
            if (_editor && _editor.editorFunctions.sendKeyCommand(event)) {
                /* istanbul ignore else: don't run if already running */
                if(!scope._bUpdateSelectedStyles){
                    scope.updateSelectedStyles();
                }
                event.preventDefault();
                return false;
            }
        },
        //
        // When a toolbar and tools are created, it isn't until there is a key event or mouse event
        // that the updateSelectedStyles() is called behind the scenes.
        // This function forces an update through the existing editors to help the application make sure
        // the inital state is correct.
        //
        updateStyles: updateStyles,
        // return the current version of textAngular in use to the user
        getVersion: function () { return textAngularVersion; },
        // for testing
        getToolbarScopes: function () {
            var tmp=[];
            angular.forEach(editors, function (_editor) {
                tmp = tmp.concat(_editor.toolbarScopes);
            });
            return tmp;
        }
/********************** not functional yet
        // save the selection ('range') for the given editor
        saveFocusSelection: function (name, range) {
            editors[name].savedFocusRange = range;
        },
        // restore the saved selection from when the focus was lost
        restoreFocusSelection: function(name, scope) {
            // we only do this if NOT focussed and saved...
            if (editors[name].savedFocusRange && !scope.focussed) {
                try {
                    var _r = rangy.restoreRange(editors[name].savedFocusRange);
                    var _sel = rangy.getSelection();
                    _sel.addRange(_r);
                } catch(e) {}
            }
        }
*************/
    };
}]);
textAngular.directive('textAngularToolbar', [
    '$compile', 'textAngularManager', 'taOptions', 'taTools', 'taToolExecuteAction', '$window',
    function($compile, textAngularManager, taOptions, taTools, taToolExecuteAction, $window){
        return {
            scope: {
                name: '@' // a name IS required
            },
            restrict: "EA",
            link: function(scope, element, attrs){
                if(!scope.name || scope.name === '') throw('textAngular Error: A toolbar requires a name');
                angular.extend(scope, angular.copy(taOptions));
                if(attrs.taToolbar)						scope.toolbar = scope.$parent.$eval(attrs.taToolbar);
                if(attrs.taToolbarClass)				scope.classes.toolbar = attrs.taToolbarClass;
                if(attrs.taToolbarGroupClass)			scope.classes.toolbarGroup = attrs.taToolbarGroupClass;
                if(attrs.taToolbarButtonClass)			scope.classes.toolbarButton = attrs.taToolbarButtonClass;
                if(attrs.taToolbarActiveButtonClass)	scope.classes.toolbarButtonActive = attrs.taToolbarActiveButtonClass;
                if(attrs.taFocussedClass)				scope.classes.focussed = attrs.taFocussedClass;

                scope.disabled = true;
                scope.focussed = false;
                scope._$element = element;
                element[0].innerHTML = '';
                element.addClass("ta-toolbar " + scope.classes.toolbar);

                scope.$watch('focussed', function(){
                    if(scope.focussed) element.addClass(scope.classes.focussed);
                    else element.removeClass(scope.classes.focussed);
                });

                var setupToolElement = function(toolDefinition, toolScope){
                    var toolElement;
                    if(toolDefinition && toolDefinition.display){
                        toolElement = angular.element(toolDefinition.display);
                    }
                    else toolElement = angular.element("<button type='button'>");

                    if(toolDefinition && toolDefinition["class"]) toolElement.addClass(toolDefinition["class"]);
                    else toolElement.addClass(scope.classes.toolbarButton);

                    toolElement.attr('name', toolScope.name);
                    // important to not take focus from the main text/html entry
                    toolElement.attr('ta-button', 'ta-button');
                    toolElement.attr('ng-disabled', 'isDisabled()');
                    toolElement.attr('tabindex', '-1');
                    toolElement.attr('ng-click', 'executeAction()');
                    toolElement.attr('ng-class', 'displayActiveToolClass(active)');

                    if (toolDefinition && toolDefinition.tooltiptext) {
                        toolElement.attr('title', toolDefinition.tooltiptext);
                    }
                    if(toolDefinition && !toolDefinition.display && !toolScope._display){
                        // first clear out the current contents if any
                        toolElement[0].innerHTML = '';
                        // add the buttonText
                        if(toolDefinition.buttontext) toolElement[0].innerHTML = toolDefinition.buttontext;
                        // add the icon to the front of the button if there is content
                        if(toolDefinition.iconclass){
                            var icon = angular.element('<i>'), content = toolElement[0].innerHTML;
                            icon.addClass(toolDefinition.iconclass);
                            toolElement[0].innerHTML = '';
                            toolElement.append(icon);
                            if(content && content !== '') toolElement.append('&nbsp;' + content);
                        }
                    }

                    toolScope._lastToolDefinition = angular.copy(toolDefinition);

                    return $compile(toolElement)(toolScope);
                };

                // Keep a reference for updating the active states later
                scope.tools = {};
                // create the tools in the toolbar
                // default functions and values to prevent errors in testing and on init
                scope._parent = {
                    disabled: true,
                    showHtml: false,
                    queryFormatBlockState: function(){ return false; },
                    queryCommandState: function(){ return false; }
                };
                var defaultChildScope = {
                    $window: $window,
                    $editor: function(){
                        // dynamically gets the editor as it is set
                        return scope._parent;
                    },
                    isDisabled: function(){
                        // view selection button is always enabled since it doesn not depend on a selction!
                        if (this.name === 'html' && scope._parent.startAction) {
                            return false;
                        }
                        // to set your own disabled logic set a function or boolean on the tool called 'disabled'
                        return ( // this bracket is important as without it it just returns the first bracket and ignores the rest
                            // when the button's disabled function/value evaluates to true
                            (typeof this.$eval('disabled') !== 'function' && this.$eval('disabled')) || this.$eval('disabled()') ||
                            // all buttons except the HTML Switch button should be disabled in the showHtml (RAW html) mode
                            (this.name !== 'html' && this.$editor().showHtml) ||
                            // if the toolbar is disabled
                            this.$parent.disabled ||
                            // if the current editor is disabled
                            this.$editor().disabled
                        );
                    },
                    displayActiveToolClass: function(active){
                        return (active)? scope.classes.toolbarButtonActive : '';
                    },
                    executeAction: taToolExecuteAction
                };

                angular.forEach(scope.toolbar, function(group){
                    // setup the toolbar group
                    var groupElement = angular.element("<div>");
                    groupElement.addClass(scope.classes.toolbarGroup);
                    angular.forEach(group, function(tool){
                        // init and add the tools to the group
                        // a tool name (key name from taTools struct)
                        //creates a child scope of the main angularText scope and then extends the childScope with the functions of this particular tool
                        // reference to the scope and element kept
                        scope.tools[tool] = angular.extend(scope.$new(true), taTools[tool], defaultChildScope, {name: tool});
                        scope.tools[tool].$element = setupToolElement(taTools[tool], scope.tools[tool]);
                        // append the tool compiled with the childScope to the group element
                        groupElement.append(scope.tools[tool].$element);
                    });
                    // append the group to the toolbar
                    element.append(groupElement);
                });

                // update a tool
                // if a value is set to null, remove from the display
                // when forceNew is set to true it will ignore all previous settings, used to reset to taTools definition
                // to reset to defaults pass in taTools[key] as _newTool and forceNew as true, ie `updateToolDisplay(key, taTools[key], true);`
                scope.updateToolDisplay = function(key, _newTool, forceNew){
                    var toolInstance = scope.tools[key];
                    if(toolInstance){
                        // get the last toolDefinition, then override with the new definition
                        if(toolInstance._lastToolDefinition && !forceNew) _newTool = angular.extend({}, toolInstance._lastToolDefinition, _newTool);
                        if(_newTool.buttontext === null && _newTool.iconclass === null && _newTool.display === null)
                            throw('textAngular Error: Tool Definition for updating "' + key + '" does not have a valid display/iconclass/buttontext value');

                        // if tool is defined on this toolbar, update/redo the tool
                        if(_newTool.buttontext === null){
                            delete _newTool.buttontext;
                        }
                        if(_newTool.iconclass === null){
                            delete _newTool.iconclass;
                        }
                        if(_newTool.display === null){
                            delete _newTool.display;
                        }

                        var toolElement = setupToolElement(_newTool, toolInstance);
                        toolInstance.$element.replaceWith(toolElement);
                        toolInstance.$element = toolElement;
                    }
                };

                // we assume here that all values passed are valid and correct
                scope.addTool = function(key, _newTool, groupIndex, index){
                    scope.tools[key] = angular.extend(scope.$new(true), taTools[key], defaultChildScope, {name: key});
                    scope.tools[key].$element = setupToolElement(taTools[key], scope.tools[key]);
                    var group;
                    if(groupIndex === undefined) groupIndex = scope.toolbar.length - 1;
                    group = angular.element(element.children()[groupIndex]);

                    if(index === undefined){
                        group.append(scope.tools[key].$element);
                        scope.toolbar[groupIndex][scope.toolbar[groupIndex].length - 1] = key;
                    }else{
                        group.children().eq(index).after(scope.tools[key].$element);
                        scope.toolbar[groupIndex][index] = key;
                    }
                };

                textAngularManager.registerToolbar(scope);

                scope.$on('$destroy', function(){
                    textAngularManager.unregisterToolbar(scope.name);
                });
            }
        };
    }
]);
textAngular.directive('textAngularVersion', ['textAngularManager',
    function(textAngularManager) {
        var version = textAngularManager.getVersion();
        return {
            restrict: "EA",
            link: function (scope, element, attrs) {
                element.html(version);
            }
        };
    }
]);

/**
 * @license AngularJS v1.3.10
 * (c) 2010-2014 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular, undefined) {'use strict';

var $sanitizeMinErr = angular.$$minErr('$sanitize');

/**
 * @ngdoc module
 * @name ngSanitize
 * @description
 *
 * # ngSanitize
 *
 * The `ngSanitize` module provides functionality to sanitize HTML.
 *
 *
 * <div doc-module-components="ngSanitize"></div>
 *
 * See {@link ngSanitize.$sanitize `$sanitize`} for usage.
 */

/*
 * HTML Parser By Misko Hevery (misko@hevery.com)
 * based on:  HTML Parser By John Resig (ejohn.org)
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 *
 * // Use like so:
 * htmlParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 *
 */


/**
 * @ngdoc service
 * @name $sanitize
 * @kind function
 *
 * @description
 *   The input is sanitized by parsing the HTML into tokens. All safe tokens (from a whitelist) are
 *   then serialized back to properly escaped html string. This means that no unsafe input can make
 *   it into the returned string, however, since our parser is more strict than a typical browser
 *   parser, it's possible that some obscure input, which would be recognized as valid HTML by a
 *   browser, won't make it through the sanitizer. The input may also contain SVG markup.
 *   The whitelist is configured using the functions `aHrefSanitizationWhitelist` and
 *   `imgSrcSanitizationWhitelist` of {@link ng.$compileProvider `$compileProvider`}.
 *
 * @param {string} html HTML input.
 * @returns {string} Sanitized HTML.
 *
 * @example
   <example module="sanitizeExample" deps="angular-sanitize.js">
   <file name="index.html">
     <script>
         angular.module('sanitizeExample', ['ngSanitize'])
           .controller('ExampleController', ['$scope', '$sce', function($scope, $sce) {
             $scope.snippet =
               '<p style="color:blue">an html\n' +
               '<em onmouseover="this.textContent=\'PWN3D!\'">click here</em>\n' +
               'snippet</p>';
             $scope.deliberatelyTrustDangerousSnippet = function() {
               return $sce.trustAsHtml($scope.snippet);
             };
           }]);
     </script>
     <div ng-controller="ExampleController">
        Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <td>Directive</td>
           <td>How</td>
           <td>Source</td>
           <td>Rendered</td>
         </tr>
         <tr id="bind-html-with-sanitize">
           <td>ng-bind-html</td>
           <td>Automatically uses $sanitize</td>
           <td><pre>&lt;div ng-bind-html="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind-html="snippet"></div></td>
         </tr>
         <tr id="bind-html-with-trust">
           <td>ng-bind-html</td>
           <td>Bypass $sanitize by explicitly trusting the dangerous value</td>
           <td>
           <pre>&lt;div ng-bind-html="deliberatelyTrustDangerousSnippet()"&gt;
&lt;/div&gt;</pre>
           </td>
           <td><div ng-bind-html="deliberatelyTrustDangerousSnippet()"></div></td>
         </tr>
         <tr id="bind-default">
           <td>ng-bind</td>
           <td>Automatically escapes</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
       </div>
   </file>
   <file name="protractor.js" type="protractor">
     it('should sanitize the html snippet by default', function() {
       expect(element(by.css('#bind-html-with-sanitize div')).getInnerHtml()).
         toBe('<p>an html\n<em>click here</em>\nsnippet</p>');
     });

     it('should inline raw snippet if bound to a trusted value', function() {
       expect(element(by.css('#bind-html-with-trust div')).getInnerHtml()).
         toBe("<p style=\"color:blue\">an html\n" +
              "<em onmouseover=\"this.textContent='PWN3D!'\">click here</em>\n" +
              "snippet</p>");
     });

     it('should escape snippet without any filter', function() {
       expect(element(by.css('#bind-default div')).getInnerHtml()).
         toBe("&lt;p style=\"color:blue\"&gt;an html\n" +
              "&lt;em onmouseover=\"this.textContent='PWN3D!'\"&gt;click here&lt;/em&gt;\n" +
              "snippet&lt;/p&gt;");
     });

     it('should update', function() {
       element(by.model('snippet')).clear();
       element(by.model('snippet')).sendKeys('new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-html-with-sanitize div')).getInnerHtml()).
         toBe('new <b>text</b>');
       expect(element(by.css('#bind-html-with-trust div')).getInnerHtml()).toBe(
         'new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-default div')).getInnerHtml()).toBe(
         "new &lt;b onclick=\"alert(1)\"&gt;text&lt;/b&gt;");
     });
   </file>
   </example>
 */
function $SanitizeProvider() {
  this.$get = ['$$sanitizeUri', function($$sanitizeUri) {
    return function(html) {
      if (typeof arguments[1] != 'undefined') {
        arguments[1].version = 'taSanitize';
      }
      var buf = [];
      htmlParser(html, htmlSanitizeWriter(buf, function(uri, isImage) {
        return !/^unsafe/.test($$sanitizeUri(uri, isImage));
      }));
      return buf.join('');
    };
  }];
}

function sanitizeText(chars) {
  var buf = [];
  var writer = htmlSanitizeWriter(buf, angular.noop);
  writer.chars(chars);
  return buf.join('');
}


// Regular Expressions for parsing tags and attributes
var START_TAG_REGEXP =
       /^<((?:[a-zA-Z])[\w:-]*)((?:\s+[\w:-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)\s*(>?)/,
  END_TAG_REGEXP = /^<\/\s*([\w:-]+)[^>]*>/,
  ATTR_REGEXP = /([\w:-]+)(?:\s*=\s*(?:(?:"((?:[^"])*)")|(?:'((?:[^'])*)')|([^>\s]+)))?/g,
  BEGIN_TAG_REGEXP = /^</,
  BEGING_END_TAGE_REGEXP = /^<\//,
  COMMENT_REGEXP = /<!--(.*?)-->/g,
  SINGLE_COMMENT_REGEXP = /(^<!--.*?-->)/,
  DOCTYPE_REGEXP = /<!DOCTYPE([^>]*?)>/i,
  CDATA_REGEXP = /<!\[CDATA\[(.*?)]]>/g,
  SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
  // Match everything outside of normal chars and " (quote character)
  NON_ALPHANUMERIC_REGEXP = /([^\#-~| |!])/g,
  WHITE_SPACE_REGEXP = /^(\s+)/;


// Good source of info about elements and attributes
// http://dev.w3.org/html5/spec/Overview.html#semantics
// http://simon.html5.org/html-elements

// Safe Void Elements - HTML5
// http://dev.w3.org/html5/spec/Overview.html#void-elements
var voidElements = makeMap("area,br,col,hr,img,wbr,input");

// Elements that you can, intentionally, leave open (and which close themselves)
// http://dev.w3.org/html5/spec/Overview.html#optional-tags
var optionalEndTagBlockElements = makeMap("colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr"),
    optionalEndTagInlineElements = makeMap("rp,rt"),
    optionalEndTagElements = angular.extend({},
                                            optionalEndTagInlineElements,
                                            optionalEndTagBlockElements);

// Safe Block Elements - HTML5
var blockElements = angular.extend({}, optionalEndTagBlockElements, makeMap("address,article," +
        "aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5," +
        "h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,script,section,table,ul"));

// Inline Elements - HTML5
var inlineElements = angular.extend({}, optionalEndTagInlineElements, makeMap("a,abbr,acronym,b," +
        "bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s," +
        "samp,small,span,strike,strong,sub,sup,time,tt,u,var"));

// SVG Elements
// https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Elements
var svgElements = makeMap("animate,animateColor,animateMotion,animateTransform,circle,defs," +
        "desc,ellipse,font-face,font-face-name,font-face-src,g,glyph,hkern,image,linearGradient," +
        "line,marker,metadata,missing-glyph,mpath,path,polygon,polyline,radialGradient,rect,set," +
        "stop,svg,switch,text,title,tspan,use");

// Special Elements (can contain anything)
var specialElements = makeMap("script,style");

var validElements = angular.extend({},
                                   voidElements,
                                   blockElements,
                                   inlineElements,
                                   optionalEndTagElements,
                                   svgElements);

//Attributes that have href and hence need to be sanitized
var uriAttrs = makeMap("background,cite,href,longdesc,src,usemap,xlink:href");

var htmlAttrs = makeMap('abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,'+
    'color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,'+
    'id,ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,'+
    'scope,scrolling,shape,size,span,start,summary,target,title,type,'+
    'valign,value,vspace,width');

// SVG attributes (without "id" and "name" attributes)
// https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Attributes
var svgAttrs = makeMap('accent-height,accumulate,additive,alphabetic,arabic-form,ascent,' +
    'attributeName,attributeType,baseProfile,bbox,begin,by,calcMode,cap-height,class,color,' +
    'color-rendering,content,cx,cy,d,dx,dy,descent,display,dur,end,fill,fill-rule,font-family,' +
    'font-size,font-stretch,font-style,font-variant,font-weight,from,fx,fy,g1,g2,glyph-name,' +
    'gradientUnits,hanging,height,horiz-adv-x,horiz-origin-x,ideographic,k,keyPoints,' +
    'keySplines,keyTimes,lang,marker-end,marker-mid,marker-start,markerHeight,markerUnits,' +
    'markerWidth,mathematical,max,min,offset,opacity,orient,origin,overline-position,' +
    'overline-thickness,panose-1,path,pathLength,points,preserveAspectRatio,r,refX,refY,' +
    'repeatCount,repeatDur,requiredExtensions,requiredFeatures,restart,rotate,rx,ry,slope,stemh,' +
    'stemv,stop-color,stop-opacity,strikethrough-position,strikethrough-thickness,stroke,' +
    'stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,' +
    'stroke-opacity,stroke-width,systemLanguage,target,text-anchor,to,transform,type,u1,u2,' +
    'underline-position,underline-thickness,unicode,unicode-range,units-per-em,values,version,' +
    'viewBox,visibility,width,widths,x,x-height,x1,x2,xlink:actuate,xlink:arcrole,xlink:role,' +
    'xlink:show,xlink:title,xlink:type,xml:base,xml:lang,xml:space,xmlns,xmlns:xlink,y,y1,y2,' +
    'zoomAndPan');

var validAttrs = angular.extend({},
                                uriAttrs,
                                svgAttrs,
                                htmlAttrs);

function makeMap(str) {
  var obj = {}, items = str.split(','), i;
  for (i = 0; i < items.length; i++) obj[items[i]] = true;
  return obj;
}


/**
 * @example
 * htmlParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 *
 * @param {string} html string
 * @param {object} handler
 */
function htmlParser(html, handler) {
  if (typeof html !== 'string') {
    if (html === null || typeof html === 'undefined') {
      html = '';
    } else {
      html = '' + html;
    }
  }
  var index, chars, match, stack = [], last = html, text;
  stack.last = function() { return stack[ stack.length - 1 ]; };

  while (html) {
    text = '';
    chars = true;

    // Make sure we're not in a script or style element
    if (!stack.last() || !specialElements[ stack.last() ]) {

      // White space
      if (WHITE_SPACE_REGEXP.test(html)) {
        match = html.match(WHITE_SPACE_REGEXP);

        if (match) {
          var mat = match[0];
          if (handler.whitespace) handler.whitespace(match[0]);
          html = html.replace(match[0], '');
          chars = false;
        }
      //Comment
      } else if (SINGLE_COMMENT_REGEXP.test(html)) {
        match = html.match(SINGLE_COMMENT_REGEXP);

        if (match) {
          if (handler.comment) handler.comment(match[1]);
          html = html.replace(match[0], '');
          chars = false;
        }
      // DOCTYPE
      } else if (DOCTYPE_REGEXP.test(html)) {
        match = html.match(DOCTYPE_REGEXP);

        if (match) {
          html = html.replace(match[0], '');
          chars = false;
        }
      // end tag
      } else if (BEGING_END_TAGE_REGEXP.test(html)) {
        match = html.match(END_TAG_REGEXP);

        if (match) {
          html = html.substring(match[0].length);
          match[0].replace(END_TAG_REGEXP, parseEndTag);
          chars = false;
        }

      // start tag
      } else if (BEGIN_TAG_REGEXP.test(html)) {
        match = html.match(START_TAG_REGEXP);

        if (match) {
          // We only have a valid start-tag if there is a '>'.
          if (match[4]) {
            html = html.substring(match[0].length);
            match[0].replace(START_TAG_REGEXP, parseStartTag);
          }
          chars = false;
        } else {
          // no ending tag found --- this piece should be encoded as an entity.
          text += '<';
          html = html.substring(1);
        }
      }

      if (chars) {
        index = html.indexOf("<");

        text += index < 0 ? html : html.substring(0, index);
        html = index < 0 ? "" : html.substring(index);

        if (handler.chars) handler.chars(decodeEntities(text));
      }

    } else {
      html = html.replace(new RegExp("([^]*)<\\s*\\/\\s*" + stack.last() + "[^>]*>", 'i'),
        function(all, text) {
          text = text.replace(COMMENT_REGEXP, "$1").replace(CDATA_REGEXP, "$1");

          if (handler.chars) handler.chars(decodeEntities(text));

          return "";
      });

      parseEndTag("", stack.last());
    }

    if (html == last) {
      throw $sanitizeMinErr('badparse', "The sanitizer was unable to parse the following block " +
                                        "of html: {0}", html);
    }
    last = html;
  }

  // Clean up any remaining tags
  parseEndTag();

  function parseStartTag(tag, tagName, rest, unary) {
    tagName = angular.lowercase(tagName);
    if (blockElements[ tagName ]) {
      while (stack.last() && inlineElements[ stack.last() ]) {
        parseEndTag("", stack.last());
      }
    }

    if (optionalEndTagElements[ tagName ] && stack.last() == tagName) {
      parseEndTag("", tagName);
    }

    unary = voidElements[ tagName ] || !!unary;

    if (!unary)
      stack.push(tagName);

    var attrs = {};

    rest.replace(ATTR_REGEXP,
      function(match, name, doubleQuotedValue, singleQuotedValue, unquotedValue) {
        var value = doubleQuotedValue
          || singleQuotedValue
          || unquotedValue
          || '';

        attrs[name] = decodeEntities(value);
    });
    if (handler.start) handler.start(tagName, attrs, unary);
  }

  function parseEndTag(tag, tagName) {
    var pos = 0, i;
    tagName = angular.lowercase(tagName);
    if (tagName)
      // Find the closest opened tag of the same type
      for (pos = stack.length - 1; pos >= 0; pos--)
        if (stack[ pos ] == tagName)
          break;

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (i = stack.length - 1; i >= pos; i--)
        if (handler.end) handler.end(stack[ i ]);

      // Remove the open elements from the stack
      stack.length = pos;
    }
  }
}

var hiddenPre=document.createElement("pre");
var spaceRe = /^(\s*)([\s\S]*?)(\s*)$/;
/**
 * decodes all entities into regular string
 * @param value
 * @returns {string} A string with decoded entities.
 */
function decodeEntities(value) {
  if (!value) { return ''; }

  // Note: IE8 does not preserve spaces at the start/end of innerHTML
  // so we must capture them and reattach them afterward
  var parts = spaceRe.exec(value);
  var spaceBefore = parts[1];
  var spaceAfter = parts[3];
  var content = parts[2];
  if (content) {
    hiddenPre.innerHTML=content.replace(/</g,"&lt;");
    // innerText depends on styling as it doesn't display hidden elements.
    // Therefore, it's better to use textContent not to cause unnecessary
    // reflows. However, IE<9 don't support textContent so the innerText
    // fallback is necessary.
    content = 'textContent' in hiddenPre ?
      hiddenPre.textContent : hiddenPre.innerText;
  }
  return spaceBefore + content + spaceAfter;
}

/**
 * Escapes all potentially dangerous characters, so that the
 * resulting string can be safely inserted into attribute or
 * element text.
 * @param value
 * @returns {string} escaped text
 */
function encodeEntities(value) {
  return value.
    replace(/&/g, '&amp;').
    replace(SURROGATE_PAIR_REGEXP, function(value) {
      var hi = value.charCodeAt(0);
      var low = value.charCodeAt(1);
      return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
    }).
    replace(NON_ALPHANUMERIC_REGEXP, function(value) {
      // unsafe chars are: \u0000-\u001f \u007f-\u009f \u00ad \u0600-\u0604 \u070f \u17b4 \u17b5 \u200c-\u200f \u2028-\u202f \u2060-\u206f \ufeff \ufff0-\uffff from jslint.com/lint.html
      // decimal values are: 0-31, 127-159, 173, 1536-1540, 1807, 6068, 6069, 8204-8207, 8232-8239, 8288-8303, 65279, 65520-65535
      var c = value.charCodeAt(0);
      // if unsafe character encode
      if(c <= 159 ||
        c == 173 ||
        (c >= 1536 && c <= 1540) ||
        c == 1807 ||
        c == 6068 ||
        c == 6069 ||
        (c >= 8204 && c <= 8207) ||
        (c >= 8232 && c <= 8239) ||
        (c >= 8288 && c <= 8303) ||
        c == 65279 ||
        (c >= 65520 && c <= 65535)) return '&#' + c + ';';
      return value; // avoids multilingual issues
    }).
    replace(/</g, '&lt;').
    replace(/>/g, '&gt;');
}

var trim = (function() {
  // native trim is way faster: http://jsperf.com/angular-trim-test
  // but IE doesn't have it... :-(
  // TODO: we should move this into IE/ES5 polyfill
  if (!String.prototype.trim) {
    return function(value) {
      return angular.isString(value) ? value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') : value;
    };
  }
  return function(value) {
    return angular.isString(value) ? value.trim() : value;
  };
})();

// Custom logic for accepting certain style options only - textAngular
// Currently allows only the color, background-color, text-align, float, width and height attributes
// all other attributes should be easily done through classes.
function validStyles(styleAttr){
	var result = '';
	var styleArray = styleAttr.split(';');
	angular.forEach(styleArray, function(value){
		var v = value.split(':');
		if(v.length == 2){
			var key = trim(angular.lowercase(v[0]));
			var value = trim(angular.lowercase(v[1]));
			if(
				(key === 'color' || key === 'background-color') && (
					value.match(/^rgb\([0-9%,\. ]*\)$/i)
					|| value.match(/^rgba\([0-9%,\. ]*\)$/i)
					|| value.match(/^hsl\([0-9%,\. ]*\)$/i)
					|| value.match(/^hsla\([0-9%,\. ]*\)$/i)
					|| value.match(/^#[0-9a-f]{3,6}$/i)
					|| value.match(/^[a-z]*$/i)
				)
			||
				key === 'text-align' && (
					value === 'left'
					|| value === 'right'
					|| value === 'center'
					|| value === 'justify'
				)
			||
        key === 'text-decoration' && (
            value === 'underline'
            || value === 'line-through'
        )
      || 
        key === 'font-weight' && (
            value === 'bold'
        )
      ||
        key === 'font-style' && (
          value === 'italic'
        )
      ||
        key === 'float' && (
            value === 'left'
            || value === 'right'
            || value === 'none'
        )
      ||
        key === 'vertical-align' && (
            value === 'baseline'
            || value === 'sub'
            || value === 'super'
            || value === 'test-top'
            || value === 'text-bottom'
            || value === 'middle'
            || value === 'top'
            || value === 'bottom'
            || value.match(/[0-9]*(px|em)/)
            || value.match(/[0-9]+?%/)
        )
      ||
        key === 'font-size' && (
            value === 'xx-small'
            || value === 'x-small'
            || value === 'small'
            || value === 'medium'
            || value === 'large'
            || value === 'x-large'
            || value === 'xx-large'
            || value === 'larger'
            || value === 'smaller'
            || value.match(/[0-9]*\.?[0-9]*(px|em|rem|mm|q|cm|in|pt|pc|%)/)
                               )
			||
				(key === 'width' || key === 'height') && (
					value.match(/[0-9\.]*(px|em|rem|%)/)
				)
			|| // Reference #520
				(key === 'direction' && value.match(/^ltr|rtl|initial|inherit$/))
			) result += key + ': ' + value + ';';
		}
	});
	return result;
}

// this function is used to manually allow specific attributes on specific tags with certain prerequisites
function validCustomTag(tag, attrs, lkey, value){
	// catch the div placeholder for the iframe replacement
    if (tag === 'img' && attrs['ta-insert-video']){
        if(lkey === 'ta-insert-video' || lkey === 'allowfullscreen' || lkey === 'frameborder' || (lkey === 'contenteditable' && value === 'false')) return true;
    }
    return false;
}

/**
 * create an HTML/XML writer which writes to buffer
 * @param {Array} buf use buf.jain('') to get out sanitized html string
 * @returns {object} in the form of {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * }
 */
function htmlSanitizeWriter(buf, uriValidator) {
  var ignore = false;
  var out = angular.bind(buf, buf.push);
  return {
    start: function(tag, attrs, unary) {
      tag = angular.lowercase(tag);
      if (!ignore && specialElements[tag]) {
        ignore = tag;
      }
      if (!ignore && validElements[tag] === true) {
        out('<');
        out(tag);
        angular.forEach(attrs, function(value, key) {
          var lkey=angular.lowercase(key);
          var isImage=(tag === 'img' && lkey === 'src') || (lkey === 'background');
          if ((lkey === 'style' && (value = validStyles(value)) !== '') || validCustomTag(tag, attrs, lkey, value) || validAttrs[lkey] === true &&
            (uriAttrs[lkey] !== true || uriValidator(value, isImage))) {
            out(' ');
            out(key);
            out('="');
            out(encodeEntities(value));
            out('"');
          }
        });
        out(unary ? '/>' : '>');
      }
    },
    comment: function (com) {
      out(com);
    },
    whitespace: function (ws) {
      out(encodeEntities(ws));
    },
    end: function(tag) {
        tag = angular.lowercase(tag);
        if (!ignore && validElements[tag] === true) {
          out('</');
          out(tag);
          out('>');
        }
        if (tag == ignore) {
          ignore = false;
        }
      },
    chars: function(chars) {
        if (!ignore) {
          out(encodeEntities(chars));
        }
      }
  };
}


// define ngSanitize module and register $sanitize service
angular.module('ngSanitize', []).provider('$sanitize', $SanitizeProvider);

/* global sanitizeText: false */

/**
 * @ngdoc filter
 * @name linky
 * @kind function
 *
 * @description
 * Finds links in text input and turns them into html links. Supports http/https/ftp/mailto and
 * plain email address links.
 *
 * Requires the {@link ngSanitize `ngSanitize`} module to be installed.
 *
 * @param {string} text Input text.
 * @param {string} target Window (_blank|_self|_parent|_top) or named frame to open links in.
 * @returns {string} Html-linkified text.
 *
 * @usage
   <span ng-bind-html="linky_expression | linky"></span>
 *
 * @example
   <example module="linkyExample" deps="angular-sanitize.js">
     <file name="index.html">
       <script>
         angular.module('linkyExample', ['ngSanitize'])
           .controller('ExampleController', ['$scope', function($scope) {
             $scope.snippet =
               'Pretty text with some links:\n'+
               'http://angularjs.org/,\n'+
               'mailto:us@somewhere.org,\n'+
               'another@somewhere.org,\n'+
               'and one more: ftp://127.0.0.1/.';
             $scope.snippetWithTarget = 'http://angularjs.org/';
           }]);
       </script>
       <div ng-controller="ExampleController">
       Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <td>Filter</td>
           <td>Source</td>
           <td>Rendered</td>
         </tr>
         <tr id="linky-filter">
           <td>linky filter</td>
           <td>
             <pre>&lt;div ng-bind-html="snippet | linky"&gt;<br>&lt;/div&gt;</pre>
           </td>
           <td>
             <div ng-bind-html="snippet | linky"></div>
           </td>
         </tr>
         <tr id="linky-target">
          <td>linky target</td>
          <td>
            <pre>&lt;div ng-bind-html="snippetWithTarget | linky:'_blank'"&gt;<br>&lt;/div&gt;</pre>
          </td>
          <td>
            <div ng-bind-html="snippetWithTarget | linky:'_blank'"></div>
          </td>
         </tr>
         <tr id="escaped-html">
           <td>no filter</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
     </file>
     <file name="protractor.js" type="protractor">
       it('should linkify the snippet with urls', function() {
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(4);
       });

       it('should not linkify snippet without the linky filter', function() {
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, mailto:us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#escaped-html a')).count()).toEqual(0);
       });

       it('should update', function() {
         element(by.model('snippet')).clear();
         element(by.model('snippet')).sendKeys('new http://link.');
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('new http://link.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(1);
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText())
             .toBe('new http://link.');
       });

       it('should work with the target property', function() {
        expect(element(by.id('linky-target')).
            element(by.binding("snippetWithTarget | linky:'_blank'")).getText()).
            toBe('http://angularjs.org/');
        expect(element(by.css('#linky-target a')).getAttribute('target')).toEqual('_blank');
       });
     </file>
   </example>
 */
angular.module('ngSanitize').filter('linky', ['$sanitize', function($sanitize) {
  var LINKY_URL_REGEXP =
        /((ftp|https?):\/\/|(www\.)|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>"”’]/,
      MAILTO_REGEXP = /^mailto:/;

  return function(text, target) {
    if (!text) return text;
    var match;
    var raw = text;
    var html = [];
    var url;
    var i;
    while ((match = raw.match(LINKY_URL_REGEXP))) {
      // We can not end in these as they are sometimes found at the end of the sentence
      url = match[0];
      // if we did not match ftp/http/www/mailto then assume mailto
      if (!match[2] && !match[4]) {
        url = (match[3] ? 'http://' : 'mailto:') + url;
      }
      i = match.index;
      addText(raw.substr(0, i));
      addLink(url, match[0].replace(MAILTO_REGEXP, ''));
      raw = raw.substring(i + match[0].length);
    }
    addText(raw);
    return $sanitize(html.join(''));

    function addText(text) {
      if (!text) {
        return;
      }
      html.push(sanitizeText(text));
    }

    function addLink(url, text) {
      html.push('<a ');
      if (angular.isDefined(target)) {
        html.push('target="',
                  target,
                  '" ');
      }
      html.push('href="',
                url.replace(/"/g, '&quot;'),
                '">');
      addText(text);
      html.push('</a>');
    }
  };
}]);


})(window, window.angular);


// tests against the current jqLite/jquery implementation if this can be an element
function validElementString(string){
    try{
        return angular.element(string).length !== 0;
    }catch(any){
        return false;
    }
}
// setup the global contstant functions for setting up the toolbar

// all tool definitions
var taTools = {};
/*
    A tool definition is an object with the following key/value parameters:
        action: [function(deferred, restoreSelection)]
                a function that is executed on clicking on the button - this will allways be executed using ng-click and will
                overwrite any ng-click value in the display attribute.
                The function is passed a deferred object ($q.defer()), if this is wanted to be used `return false;` from the action and
                manually call `deferred.resolve();` elsewhere to notify the editor that the action has finished.
                restoreSelection is only defined if the rangy library is included and it can be called as `restoreSelection()` to restore the users
                selection in the WYSIWYG editor.
        display: [string]?
                Optional, an HTML element to be displayed as the button. The `scope` of the button is the tool definition object with some additional functions
                If set this will cause buttontext and iconclass to be ignored
        class: [string]?
                Optional, if set will override the taOptions.classes.toolbarButton class.
        buttontext: [string]?
                if this is defined it will replace the contents of the element contained in the `display` element
        iconclass: [string]?
                if this is defined an icon (<i>) will be appended to the `display` element with this string as it's class
        tooltiptext: [string]?
                Optional, a plain text description of the action, used for the title attribute of the action button in the toolbar by default.
        activestate: [function(commonElement)]?
                this function is called on every caret movement, if it returns true then the class taOptions.classes.toolbarButtonActive
                will be applied to the `display` element, else the class will be removed
        disabled: [function()]?
                if this function returns true then the tool will have the class taOptions.classes.disabled applied to it, else it will be removed
    Other functions available on the scope are:
        name: [string]
                the name of the tool, this is the first parameter passed into taRegisterTool
        isDisabled: [function()]
                returns true if the tool is disabled, false if it isn't
        displayActiveToolClass: [function(boolean)]
                returns true if the tool is 'active' in the currently focussed toolbar
        onElementSelect: [Object]
                This object contains the following key/value pairs and is used to trigger the ta-element-select event
                element: [String]
                    an element name, will only trigger the onElementSelect action if the tagName of the element matches this string
                filter: [function(element)]?
                    an optional filter that returns a boolean, if true it will trigger the onElementSelect.
                action: [function(event, element, editorScope)]
                    the action that should be executed if the onElementSelect function runs
*/
// name and toolDefinition to add into the tools available to be added on the toolbar
function registerTextAngularTool(name, toolDefinition){
    if(!name || name === '' || taTools.hasOwnProperty(name)) throw('textAngular Error: A unique name is required for a Tool Definition');
    if(
        (toolDefinition.display && (toolDefinition.display === '' || !validElementString(toolDefinition.display))) ||
        (!toolDefinition.display && !toolDefinition.buttontext && !toolDefinition.iconclass)
    )
        throw('textAngular Error: Tool Definition for "' + name + '" does not have a valid display/iconclass/buttontext value');
    taTools[name] = toolDefinition;
}

angular.module('textAngularSetup', [])
.constant('taRegisterTool', registerTextAngularTool)
.value('taTools', taTools)
// Here we set up the global display defaults, to set your own use a angular $provider#decorator.
.value('taOptions',  {
    //////////////////////////////////////////////////////////////////////////////////////
    // forceTextAngularSanitize
    // set false to allow the textAngular-sanitize provider to be replaced
    // with angular-sanitize or a custom provider.
    forceTextAngularSanitize: true,
    ///////////////////////////////////////////////////////////////////////////////////////
    // keyMappings
    // allow customizable keyMappings for specialized key boards or languages
    //
    // keyMappings provides key mappings that are attached to a given commandKeyCode.
    // To modify a specific keyboard binding, simply provide function which returns true
    // for the event you wish to map to.
    // Or to disable a specific keyboard binding, provide a function which returns false.
    // Note: 'RedoKey' and 'UndoKey' are internally bound to the redo and undo functionality.
    // At present, the following commandKeyCodes are in use:
    // 98, 'TabKey', 'ShiftTabKey', 105, 117, 'UndoKey', 'RedoKey'
    //
    // To map to an new commandKeyCode, add a new key mapping such as:
    // {commandKeyCode: 'CustomKey', testForKey: function (event) {
    //  if (event.keyCode=57 && event.ctrlKey && !event.shiftKey && !event.altKey) return true;
    // } }
    // to the keyMappings. This example maps ctrl+9 to 'CustomKey'
    // Then where taRegisterTool(...) is called, add a commandKeyCode: 'CustomKey' and your
    // tool will be bound to ctrl+9.
    //
    // To disble one of the already bound commandKeyCodes such as 'RedoKey' or 'UndoKey' add:
    // {commandKeyCode: 'RedoKey', testForKey: function (event) { return false; } },
    // {commandKeyCode: 'UndoKey', testForKey: function (event) { return false; } },
    // to disable them.
    //
    keyMappings : [],
    toolbar: [
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
        ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
        ['justifyLeft','justifyCenter','justifyRight','justifyFull','indent','outdent'],
        ['html', 'insertImage', 'insertLink', 'insertVideo', 'wordcount', 'charcount']
    ],
    classes: {
        focussed: "focussed",
        toolbar: "btn-toolbar",
        toolbarGroup: "btn-group",
        toolbarButton: "btn btn-default",
        toolbarButtonActive: "active",
        disabled: "disabled",
        textEditor: 'form-control',
        htmlEditor: 'form-control'
    },
    defaultTagAttributes : {
        a: {target:""}
    },
    setup: {
        // wysiwyg mode
        textEditorSetup: function($element){ /* Do some processing here */ },
        // raw html
        htmlEditorSetup: function($element){ /* Do some processing here */ }
    },
    defaultFileDropHandler:
        /* istanbul ignore next: untestable image processing */
        function(file, insertAction){
            var reader = new FileReader();
            if(file.type.substring(0, 5) === 'image'){
                reader.onload = function() {
                    if(reader.result !== '') insertAction('insertImage', reader.result, true);
                };

                reader.readAsDataURL(file);
                // NOTE: For async procedures return a promise and resolve it when the editor should update the model.
                return true;
            }
            return false;
        }
})

// This is the element selector string that is used to catch click events within a taBind, prevents the default and $emits a 'ta-element-select' event
// these are individually used in an angular.element().find() call. What can go here depends on whether you have full jQuery loaded or just jQLite with angularjs.
// div is only used as div.ta-insert-video caught in filter.
.value('taSelectableElements', ['a','img'])

// This is an array of objects with the following options:
//				selector: <string> a jqLite or jQuery selector string
//				customAttribute: <string> an attribute to search for
//				renderLogic: <function(element)>
// Both or one of selector and customAttribute must be defined.
.value('taCustomRenderers', [
    {
        // Parse back out: '<div class="ta-insert-video" ta-insert-video src="' + urlLink + '" allowfullscreen="true" width="300" frameborder="0" height="250"></div>'
        // To correct video element. For now only support youtube
        selector: 'img',
        customAttribute: 'ta-insert-video',
        renderLogic: function(element){
            var iframe = angular.element('<iframe></iframe>');
            var attributes = element.prop("attributes");
            // loop through element attributes and apply them on iframe
            angular.forEach(attributes, function(attr) {
                iframe.attr(attr.name, attr.value);
            });
            iframe.attr('src', iframe.attr('ta-insert-video'));
            element.replaceWith(iframe);
        }
    }
])

.value('taTranslations', {
    // moved to sub-elements
    //toggleHTML: "Toggle HTML",
    //insertImage: "Please enter a image URL to insert",
    //insertLink: "Please enter a URL to insert",
    //insertVideo: "Please enter a youtube URL to embed",
    html: {
        tooltip: 'Toggle html / Rich Text'
    },
    // tooltip for heading - might be worth splitting
    heading: {
        tooltip: 'Heading '
    },
    p: {
        tooltip: 'Paragraph'
    },
    pre: {
        tooltip: 'Preformatted text'
    },
    ul: {
        tooltip: 'Unordered List'
    },
    ol: {
        tooltip: 'Ordered List'
    },
    quote: {
        tooltip: 'Quote/unquote selection or paragraph'
    },
    undo: {
        tooltip: 'Undo'
    },
    redo: {
        tooltip: 'Redo'
    },
    bold: {
        tooltip: 'Bold'
    },
    italic: {
        tooltip: 'Italic'
    },
    underline: {
        tooltip: 'Underline'
    },
    strikeThrough:{
        tooltip: 'Strikethrough'
    },
    justifyLeft: {
        tooltip: 'Align text left'
    },
    justifyRight: {
        tooltip: 'Align text right'
    },
    justifyFull: {
        tooltip: 'Justify text'
    },
    justifyCenter: {
        tooltip: 'Center'
    },
    indent: {
        tooltip: 'Increase indent'
    },
    outdent: {
        tooltip: 'Decrease indent'
    },
    clear: {
        tooltip: 'Clear formatting'
    },
    insertImage: {
        dialogPrompt: 'Please enter an image URL to insert',
        tooltip: 'Insert image',
        hotkey: 'the - possibly language dependent hotkey ... for some future implementation'
    },
    insertVideo: {
        tooltip: 'Insert video',
        dialogPrompt: 'Please enter a youtube URL to embed'
    },
    insertLink: {
        tooltip: 'Insert / edit link',
        dialogPrompt: "Please enter a URL to insert"
    },
    editLink: {
        reLinkButton: {
            tooltip: "Relink"
        },
        unLinkButton: {
            tooltip: "Unlink"
        },
        targetToggle: {
            buttontext: "Open in New Window"
        }
    },
    wordcount: {
        tooltip: 'Display words Count'
    },
        charcount: {
        tooltip: 'Display characters Count'
    }
})
.factory('taToolFunctions', ['$window','taTranslations', function($window, taTranslations) {
    return {
        imgOnSelectAction: function(event, $element, editorScope){
            // setup the editor toolbar
            // Credit to the work at http://hackerwins.github.io/summernote/ for this editbar logic/display
            var finishEdit = function(){
                editorScope.updateTaBindtaTextElement();
                editorScope.hidePopover();
            };
            event.preventDefault();
            editorScope.displayElements.popover.css('width', '375px');
            var container = editorScope.displayElements.popoverContainer;
            container.empty();
            var buttonGroup = angular.element('<div class="btn-group" style="padding-right: 6px;">');
            var fullButton = angular.element('<button type="button" class="btn btn-default btn-sm btn-small" unselectable="on" tabindex="-1">100% </button>');
            fullButton.on('click', function(event){
                event.preventDefault();
                $element.css({
                    'width': '100%',
                    'height': ''
                });
                finishEdit();
            });
            var halfButton = angular.element('<button type="button" class="btn btn-default btn-sm btn-small" unselectable="on" tabindex="-1">50% </button>');
            halfButton.on('click', function(event){
                event.preventDefault();
                $element.css({
                    'width': '50%',
                    'height': ''
                });
                finishEdit();
            });
            var quartButton = angular.element('<button type="button" class="btn btn-default btn-sm btn-small" unselectable="on" tabindex="-1">25% </button>');
            quartButton.on('click', function(event){
                event.preventDefault();
                $element.css({
                    'width': '25%',
                    'height': ''
                });
                finishEdit();
            });
            var resetButton = angular.element('<button type="button" class="btn btn-default btn-sm btn-small" unselectable="on" tabindex="-1">Reset</button>');
            resetButton.on('click', function(event){
                event.preventDefault();
                $element.css({
                    width: '',
                    height: ''
                });
                finishEdit();
            });
            buttonGroup.append(fullButton);
            buttonGroup.append(halfButton);
            buttonGroup.append(quartButton);
            buttonGroup.append(resetButton);
            container.append(buttonGroup);

            buttonGroup = angular.element('<div class="btn-group" style="padding-right: 6px;">');
            var floatLeft = angular.element('<button type="button" class="btn btn-default btn-sm btn-small" unselectable="on" tabindex="-1"><i class="fa fa-align-left"></i></button>');
            floatLeft.on('click', function(event){
                event.preventDefault();
                // webkit
                $element.css('float', 'left');
                // firefox
                $element.css('cssFloat', 'left');
                // IE < 8
                $element.css('styleFloat', 'left');
                finishEdit();
            });
            var floatRight = angular.element('<button type="button" class="btn btn-default btn-sm btn-small" unselectable="on" tabindex="-1"><i class="fa fa-align-right"></i></button>');
            floatRight.on('click', function(event){
                event.preventDefault();
                // webkit
                $element.css('float', 'right');
                // firefox
                $element.css('cssFloat', 'right');
                // IE < 8
                $element.css('styleFloat', 'right');
                finishEdit();
            });
            var floatNone = angular.element('<button type="button" class="btn btn-default btn-sm btn-small" unselectable="on" tabindex="-1"><i class="fa fa-align-justify"></i></button>');
            floatNone.on('click', function(event){
                event.preventDefault();
                // webkit
                $element.css('float', '');
                // firefox
                $element.css('cssFloat', '');
                // IE < 8
                $element.css('styleFloat', '');
                finishEdit();
            });
            buttonGroup.append(floatLeft);
            buttonGroup.append(floatNone);
            buttonGroup.append(floatRight);
            container.append(buttonGroup);

            buttonGroup = angular.element('<div class="btn-group">');
            var remove = angular.element('<button type="button" class="btn btn-default btn-sm btn-small" unselectable="on" tabindex="-1"><i class="fa fa-trash-o"></i></button>');
            remove.on('click', function(event){
                event.preventDefault();
                $element.remove();
                finishEdit();
            });
            buttonGroup.append(remove);
            container.append(buttonGroup);

            editorScope.showPopover($element);
            editorScope.showResizeOverlay($element);
        },
        aOnSelectAction: function(event, $element, editorScope){
            // setup the editor toolbar
            // Credit to the work at http://hackerwins.github.io/summernote/ for this editbar logic
            event.preventDefault();
            editorScope.displayElements.popover.css('width', '436px');
            var container = editorScope.displayElements.popoverContainer;
            container.empty();
            container.css('line-height', '28px');
            var link = angular.element('<a href="' + $element.attr('href') + '" target="_blank">' + $element.attr('href') + '</a>');
            link.css({
                'display': 'inline-block',
                'max-width': '200px',
                'overflow': 'hidden',
                'text-overflow': 'ellipsis',
                'white-space': 'nowrap',
                'vertical-align': 'middle'
            });
            container.append(link);
            var buttonGroup = angular.element('<div class="btn-group pull-right">');
            var reLinkButton = angular.element('<button type="button" class="btn btn-default btn-sm btn-small" tabindex="-1" unselectable="on" title="' + taTranslations.editLink.reLinkButton.tooltip + '"><i class="fa fa-edit icon-edit"></i></button>');
            reLinkButton.on('click', function(event){
                event.preventDefault();
                var urlLink = $window.prompt(taTranslations.insertLink.dialogPrompt, $element.attr('href'));
                if(urlLink && urlLink !== '' && urlLink !== 'http://'){
                    $element.attr('href', urlLink);
                    editorScope.updateTaBindtaTextElement();
                }
                editorScope.hidePopover();
            });
            buttonGroup.append(reLinkButton);
            var unLinkButton = angular.element('<button type="button" class="btn btn-default btn-sm btn-small" tabindex="-1" unselectable="on" title="' + taTranslations.editLink.unLinkButton.tooltip + '"><i class="fa fa-unlink icon-unlink"></i></button>');
            // directly before this click event is fired a digest is fired off whereby the reference to $element is orphaned off
            unLinkButton.on('click', function(event){
                event.preventDefault();
                $element.replaceWith($element.contents());
                editorScope.updateTaBindtaTextElement();
                editorScope.hidePopover();
            });
            buttonGroup.append(unLinkButton);
            var targetToggle = angular.element('<button type="button" class="btn btn-default btn-sm btn-small" tabindex="-1" unselectable="on">' + taTranslations.editLink.targetToggle.buttontext + '</button>');
            if($element.attr('target') === '_blank'){
                targetToggle.addClass('active');
            }
            targetToggle.on('click', function(event){
                event.preventDefault();
                $element.attr('target', ($element.attr('target') === '_blank') ? '' : '_blank');
                targetToggle.toggleClass('active');
                editorScope.updateTaBindtaTextElement();
            });
            buttonGroup.append(targetToggle);
            container.append(buttonGroup);
            editorScope.showPopover($element);
        },
        extractYoutubeVideoId: function(url) {
            var re = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
            var match = url.match(re);
            return (match && match[1]) || null;
        }
    };
}])
.run(['taRegisterTool', '$window', 'taTranslations', 'taSelection', 'taToolFunctions', '$sanitize', 'taOptions', '$log',
    function(taRegisterTool, $window, taTranslations, taSelection, taToolFunctions, $sanitize, taOptions, $log){
    // test for the version of $sanitize that is in use
    // You can disable this check by setting taOptions.textAngularSanitize == false
    var gv = {}; $sanitize('', gv);
    /* istanbul ignore next, throws error */
    if ((taOptions.forceTextAngularSanitize===true) && (gv.version !== 'taSanitize')) {
        throw angular.$$minErr('textAngular')("textAngularSetup", "The textAngular-sanitize provider has been replaced by another -- have you included angular-sanitize by mistake?");
    }
    taRegisterTool("html", {
        iconclass: 'fa fa-code',
        tooltiptext: taTranslations.html.tooltip,
        action: function(){
            this.$editor().switchView();
        },
        activeState: function(){
            return this.$editor().showHtml;
        }
    });
    // add the Header tools
    // convenience functions so that the loop works correctly
    var _retActiveStateFunction = function(q){
        return function(){ return this.$editor().queryFormatBlockState(q); };
    };
    var headerAction = function(){
        return this.$editor().wrapSelection("formatBlock", "<" + this.name.toUpperCase() +">");
    };
    angular.forEach(['h1','h2','h3','h4','h5','h6'], function(h){
        taRegisterTool(h.toLowerCase(), {
            buttontext: h.toUpperCase(),
            tooltiptext: taTranslations.heading.tooltip + h.charAt(1),
            action: headerAction,
            activeState: _retActiveStateFunction(h.toLowerCase())
        });
    });
    taRegisterTool('p', {
        buttontext: 'P',
        tooltiptext: taTranslations.p.tooltip,
        action: function(){
            return this.$editor().wrapSelection("formatBlock", "<P>");
        },
        activeState: function(){ return this.$editor().queryFormatBlockState('p'); }
    });
    // key: pre -> taTranslations[key].tooltip, taTranslations[key].buttontext
    taRegisterTool('pre', {
        buttontext: 'pre',
        tooltiptext: taTranslations.pre.tooltip,
        action: function(){
            return this.$editor().wrapSelection("formatBlock", "<PRE>");
        },
        activeState: function(){ return this.$editor().queryFormatBlockState('pre'); }
    });
    taRegisterTool('ul', {
        iconclass: 'fa fa-list-ul',
        tooltiptext: taTranslations.ul.tooltip,
        action: function(){
            return this.$editor().wrapSelection("insertUnorderedList", null);
        },
        activeState: function(){ return this.$editor().queryCommandState('insertUnorderedList'); }
    });
    taRegisterTool('ol', {
        iconclass: 'fa fa-list-ol',
        tooltiptext: taTranslations.ol.tooltip,
        action: function(){
            return this.$editor().wrapSelection("insertOrderedList", null);
        },
        activeState: function(){ return this.$editor().queryCommandState('insertOrderedList'); }
    });
    taRegisterTool('quote', {
        iconclass: 'fa fa-quote-right',
        tooltiptext: taTranslations.quote.tooltip,
        action: function(){
            return this.$editor().wrapSelection("formatBlock", "<BLOCKQUOTE>");
        },
        activeState: function(){ return this.$editor().queryFormatBlockState('blockquote'); }
    });
    taRegisterTool('undo', {
        iconclass: 'fa fa-undo',
        tooltiptext: taTranslations.undo.tooltip,
        action: function(){
            return this.$editor().wrapSelection("undo", null);
        }
    });
    taRegisterTool('redo', {
        iconclass: 'fa fa-repeat',
        tooltiptext: taTranslations.redo.tooltip,
        action: function(){
            return this.$editor().wrapSelection("redo", null);
        }
    });
    taRegisterTool('bold', {
        iconclass: 'fa fa-bold',
        tooltiptext: taTranslations.bold.tooltip,
        action: function(){
            return this.$editor().wrapSelection("bold", null);
        },
        activeState: function(){
            return this.$editor().queryCommandState('bold');
        },
        commandKeyCode: 98
    });
    taRegisterTool('justifyLeft', {
        iconclass: 'fa fa-align-left',
        tooltiptext: taTranslations.justifyLeft.tooltip,
        action: function(){
            return this.$editor().wrapSelection("justifyLeft", null);
        },
        activeState: function(commonElement){
            /* istanbul ignore next: */
            if (commonElement && commonElement.nodeName === '#document') return false;
            var result = false;
            if (commonElement) {
                // commonELement.css('text-align') can throw an error 'Cannot read property 'defaultView' of null' in rare conditions
                // so we do try catch here...
                try {
                    result =
                        commonElement.css('text-align') === 'left' ||
                        commonElement.attr('align') === 'left' ||
                        (
                            commonElement.css('text-align') !== 'right' &&
                            commonElement.css('text-align') !== 'center' &&
                            commonElement.css('text-align') !== 'justify' && !this.$editor().queryCommandState('justifyRight') && !this.$editor().queryCommandState('justifyCenter')
                        ) && !this.$editor().queryCommandState('justifyFull');
                } catch(e) {
                    /* istanbul ignore next: error handler */
                    //console.log(e);
                    result = false;
                }
            }
            result = result || this.$editor().queryCommandState('justifyLeft');
            return result;
        }
    });
    taRegisterTool('justifyRight', {
        iconclass: 'fa fa-align-right',
        tooltiptext: taTranslations.justifyRight.tooltip,
        action: function(){
            return this.$editor().wrapSelection("justifyRight", null);
        },
        activeState: function(commonElement){
            /* istanbul ignore next: */
            if (commonElement && commonElement.nodeName === '#document') return false;
            var result = false;
            if(commonElement) {
                // commonELement.css('text-align') can throw an error 'Cannot read property 'defaultView' of null' in rare conditions
                // so we do try catch here...
                try {
                    result = commonElement.css('text-align') === 'right';
                } catch(e) {
                    /* istanbul ignore next: error handler */
                    //console.log(e);
                    result = false;
                }
            }
            result = result || this.$editor().queryCommandState('justifyRight');
            return result;
        }
    });
    taRegisterTool('justifyFull', {
        iconclass: 'fa fa-align-justify',
        tooltiptext: taTranslations.justifyFull.tooltip,
        action: function(){
            return this.$editor().wrapSelection("justifyFull", null);
        },
        activeState: function(commonElement){
            var result = false;
            if(commonElement) {
                // commonELement.css('text-align') can throw an error 'Cannot read property 'defaultView' of null' in rare conditions
                // so we do try catch here...
                try {
                    result = commonElement.css('text-align') === 'justify';
                } catch(e) {
                    /* istanbul ignore next: error handler */
                    //console.log(e);
                    result = false;
                }
            }
            result = result || this.$editor().queryCommandState('justifyFull');
            return result;
        }
    });
    taRegisterTool('justifyCenter', {
        iconclass: 'fa fa-align-center',
        tooltiptext: taTranslations.justifyCenter.tooltip,
        action: function(){
            return this.$editor().wrapSelection("justifyCenter", null);
        },
        activeState: function(commonElement){
            /* istanbul ignore next: */
            if (commonElement && commonElement.nodeName === '#document') return false;
            var result = false;
            if(commonElement) {
                // commonELement.css('text-align') can throw an error 'Cannot read property 'defaultView' of null' in rare conditions
                // so we do try catch here...
                try {
                    result = commonElement.css('text-align') === 'center';
                } catch(e) {
                    /* istanbul ignore next: error handler */
                    //console.log(e);
                    result = false;
                }

            }
            result = result || this.$editor().queryCommandState('justifyCenter');
            return result;
        }
    });
    taRegisterTool('indent', {
        iconclass: 'fa fa-indent',
        tooltiptext: taTranslations.indent.tooltip,
        action: function(){
            return this.$editor().wrapSelection("indent", null);
        },
        activeState: function(){
            return this.$editor().queryFormatBlockState('blockquote');
        },
        commandKeyCode: 'TabKey'
    });
    taRegisterTool('outdent', {
        iconclass: 'fa fa-outdent',
        tooltiptext: taTranslations.outdent.tooltip,
        action: function(){
            return this.$editor().wrapSelection("outdent", null);
        },
        activeState: function(){
            return false;
        },
        commandKeyCode: 'ShiftTabKey'
    });
    taRegisterTool('italics', {
        iconclass: 'fa fa-italic',
        tooltiptext: taTranslations.italic.tooltip,
        action: function(){
            return this.$editor().wrapSelection("italic", null);
        },
        activeState: function(){
            return this.$editor().queryCommandState('italic');
        },
        commandKeyCode: 105
    });
    taRegisterTool('underline', {
        iconclass: 'fa fa-underline',
        tooltiptext: taTranslations.underline.tooltip,
        action: function(){
            return this.$editor().wrapSelection("underline", null);
        },
        activeState: function(){
            return this.$editor().queryCommandState('underline');
        },
        commandKeyCode: 117
    });
    taRegisterTool('strikeThrough', {
        iconclass: 'fa fa-strikethrough',
        tooltiptext: taTranslations.strikeThrough.tooltip,
        action: function(){
            return this.$editor().wrapSelection("strikeThrough", null);
        },
        activeState: function(){
            return document.queryCommandState('strikeThrough');
        }
    });
    taRegisterTool('clear', {
        iconclass: 'fa fa-ban',
        tooltiptext: taTranslations.clear.tooltip,
        action: function(deferred, restoreSelection){
            var i, selectedElements, elementsSeen;

            this.$editor().wrapSelection("removeFormat", null);
            var possibleNodes = angular.element(taSelection.getSelectionElement());
            selectedElements = taSelection.getAllSelectedElements();
            //$log.log('selectedElements:', selectedElements);
            // remove lists
            var removeListElements = function(list, pe){
                list = angular.element(list);
                var prevElement = pe;
                if (!pe) {
                    prevElement = list;
                }
                angular.forEach(list.children(), function(liElem){
                    if (liElem.tagName.toLowerCase() === 'ul' ||
                        liElem.tagName.toLowerCase() === 'ol') {
                        prevElement = removeListElements(liElem, prevElement);
                    } else {
                        var newElem = angular.element('<p></p>');
                        newElem.html(angular.element(liElem).html());
                        prevElement.after(newElem);
                        prevElement = newElem;
                    }
                });
                list.remove();
                return prevElement;
            };

            angular.forEach(selectedElements, function(element) {
                if (element.nodeName.toLowerCase() === 'ul' ||
                    element.nodeName.toLowerCase() === 'ol') {
                    //console.log('removeListElements', element);
                    removeListElements(element);
                }
            });

            angular.forEach(possibleNodes.find("ul"), removeListElements);
            angular.forEach(possibleNodes.find("ol"), removeListElements);

            // clear out all class attributes. These do not seem to be cleared via removeFormat
            var $editor = this.$editor();
            var recursiveRemoveClass = function(node){
                node = angular.element(node);
                /* istanbul ignore next: this is not triggered in tests any longer since we now never select the whole displayELement */
                if(node[0] !== $editor.displayElements.text[0]) {
                    node.removeAttr('class');
                }
                angular.forEach(node.children(), recursiveRemoveClass);
            };
            angular.forEach(possibleNodes, recursiveRemoveClass);
            // check if in list. If not in list then use formatBlock option
            if(possibleNodes[0] && possibleNodes[0].tagName.toLowerCase() !== 'li' &&
                possibleNodes[0].tagName.toLowerCase() !== 'ol' &&
                possibleNodes[0].tagName.toLowerCase() !== 'ul' &&
                possibleNodes[0].getAttribute("contenteditable") !== "true") {
                this.$editor().wrapSelection("formatBlock", "default");
            }
            restoreSelection();
        }
    });

        /* jshint -W099 */
    /****************************
     //  we don't use this code - since the previous way CLEAR is expected to work does not clear partially selected <li>

     var removeListElement = function(listE){
                console.log(listE);
                var _list = listE.parentNode.childNodes;
                console.log('_list', _list);
                var _preLis = [], _postLis = [], _found = false;
                for (i = 0; i < _list.length; i++) {
                    if (_list[i] === listE) {
                        _found = true;
                    } else if (!_found) _preLis.push(_list[i]);
                    else _postLis.push(_list[i]);
                }
                var _parent = angular.element(listE.parentNode);
                var newElem = angular.element('<p></p>');
                newElem.html(angular.element(listE).html());
                if (_preLis.length === 0 || _postLis.length === 0) {
                    if (_postLis.length === 0) _parent.after(newElem);
                    else _parent[0].parentNode.insertBefore(newElem[0], _parent[0]);

                    if (_preLis.length === 0 && _postLis.length === 0) _parent.remove();
                    else angular.element(listE).remove();
                } else {
                    var _firstList = angular.element('<' + _parent[0].tagName + '></' + _parent[0].tagName + '>');
                    var _secondList = angular.element('<' + _parent[0].tagName + '></' + _parent[0].tagName + '>');
                    for (i = 0; i < _preLis.length; i++) _firstList.append(angular.element(_preLis[i]));
                    for (i = 0; i < _postLis.length; i++) _secondList.append(angular.element(_postLis[i]));
                    _parent.after(_secondList);
                    _parent.after(newElem);
                    _parent.after(_firstList);
                    _parent.remove();
                }
                taSelection.setSelectionToElementEnd(newElem[0]);
            };

     elementsSeen = [];
     if (selectedElements.length !==0) console.log(selectedElements);
     angular.forEach(selectedElements, function (element) {
                if (elementsSeen.indexOf(element) !== -1 || elementsSeen.indexOf(element.parentElement) !== -1) {
                    return;
                }
                elementsSeen.push(element);
                if (element.nodeName.toLowerCase() === 'li') {
                    console.log('removeListElement', element);
                    removeListElement(element);
                }
                else if (element.parentElement && element.parentElement.nodeName.toLowerCase() === 'li') {
                    console.log('removeListElement', element.parentElement);
                    elementsSeen.push(element.parentElement);
                    removeListElement(element.parentElement);
                }
            });
     **********************/

    /**********************
     if(possibleNodes[0].tagName.toLowerCase() === 'li'){
                var _list = possibleNodes[0].parentNode.childNodes;
                var _preLis = [], _postLis = [], _found = false;
                for(i = 0; i < _list.length; i++){
                    if(_list[i] === possibleNodes[0]){
                        _found = true;
                    }else if(!_found) _preLis.push(_list[i]);
                    else _postLis.push(_list[i]);
                }
                var _parent = angular.element(possibleNodes[0].parentNode);
                var newElem = angular.element('<p></p>');
                newElem.html(angular.element(possibleNodes[0]).html());
                if(_preLis.length === 0 || _postLis.length === 0){
                    if(_postLis.length === 0) _parent.after(newElem);
                    else _parent[0].parentNode.insertBefore(newElem[0], _parent[0]);

                    if(_preLis.length === 0 && _postLis.length === 0) _parent.remove();
                    else angular.element(possibleNodes[0]).remove();
                }else{
                    var _firstList = angular.element('<'+_parent[0].tagName+'></'+_parent[0].tagName+'>');
                    var _secondList = angular.element('<'+_parent[0].tagName+'></'+_parent[0].tagName+'>');
                    for(i = 0; i < _preLis.length; i++) _firstList.append(angular.element(_preLis[i]));
                    for(i = 0; i < _postLis.length; i++) _secondList.append(angular.element(_postLis[i]));
                    _parent.after(_secondList);
                    _parent.after(newElem);
                    _parent.after(_firstList);
                    _parent.remove();
                }
                taSelection.setSelectionToElementEnd(newElem[0]);
            }
     *******************/


    /* istanbul ignore next: if it's javascript don't worry - though probably should show some kind of error message */
    var blockJavascript = function (link) {
        if (link.toLowerCase().indexOf('javascript')!==-1) {
            return true;
        }
        return false;
    };

    taRegisterTool('insertImage', {
        iconclass: 'fa fa-picture-o',
        tooltiptext: taTranslations.insertImage.tooltip,
        action: function(){
            var imageLink;
            imageLink = $window.prompt(taTranslations.insertImage.dialogPrompt, 'http://');
            if(imageLink && imageLink !== '' && imageLink !== 'http://'){
                /* istanbul ignore next: don't know how to test this... since it needs a dialogPrompt */
                // block javascript here
                if (!blockJavascript(imageLink)) {
                    if (taSelection.getSelectionElement().tagName && taSelection.getSelectionElement().tagName.toLowerCase() === 'a') {
                        // due to differences in implementation between FireFox and Chrome, we must move the
                        // insertion point past the <a> element, otherwise FireFox inserts inside the <a>
                        // With this change, both FireFox and Chrome behave the same way!
                        taSelection.setSelectionAfterElement(taSelection.getSelectionElement());
                    }
                    // In the past we used the simple statement:
                    //return this.$editor().wrapSelection('insertImage', imageLink, true);
                    //
                    // However on Firefox only, when the content is empty this is a problem
                    // See Issue #1201
                    // Investigation reveals that Firefox only inserts a <p> only!!!!
                    // So now we use insertHTML here and all is fine.
                    // NOTE: this is what 'insertImage' is supposed to do anyway!
                    var embed = '<img src="' + imageLink + '">';
                    return this.$editor().wrapSelection('insertHTML', embed, true);
                }
            }
        },
        onElementSelect: {
            element: 'img',
            action: taToolFunctions.imgOnSelectAction
        }
    });
    taRegisterTool('insertVideo', {
        iconclass: 'fa fa-youtube-play',
        tooltiptext: taTranslations.insertVideo.tooltip,
        action: function(){
            var urlPrompt;
            urlPrompt = $window.prompt(taTranslations.insertVideo.dialogPrompt, 'https://');
            // block javascript here
            /* istanbul ignore else: if it's javascript don't worry - though probably should show some kind of error message */
            if (!blockJavascript(urlPrompt)) {

                if (urlPrompt && urlPrompt !== '' && urlPrompt !== 'https://') {

                    videoId = taToolFunctions.extractYoutubeVideoId(urlPrompt);

                    /* istanbul ignore else: if it's invalid don't worry - though probably should show some kind of error message */
                    if (videoId) {
                        // create the embed link
                        var urlLink = "https://www.youtube.com/embed/" + videoId;
                        // create the HTML
                        // for all options see: http://stackoverflow.com/questions/2068344/how-do-i-get-a-youtube-video-thumbnail-from-the-youtube-api
                        // maxresdefault.jpg seems to be undefined on some.
                        var embed = '<img class="ta-insert-video" src="https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg" ta-insert-video="' + urlLink + '" contenteditable="false" allowfullscreen="true" frameborder="0" />';
                        /* istanbul ignore next: don't know how to test this... since it needs a dialogPrompt */
                        if (taSelection.getSelectionElement().tagName && taSelection.getSelectionElement().tagName.toLowerCase() === 'a') {
                            // due to differences in implementation between FireFox and Chrome, we must move the
                            // insertion point past the <a> element, otherwise FireFox inserts inside the <a>
                            // With this change, both FireFox and Chrome behave the same way!
                            taSelection.setSelectionAfterElement(taSelection.getSelectionElement());
                        }
                        // insert
                        return this.$editor().wrapSelection('insertHTML', embed, true);
                    }
                }
            }
        },
        onElementSelect: {
            element: 'img',
            onlyWithAttrs: ['ta-insert-video'],
            action: taToolFunctions.imgOnSelectAction
        }
    });
    taRegisterTool('insertLink', {
        tooltiptext: taTranslations.insertLink.tooltip,
        iconclass: 'fa fa-link',
        action: function(){
            var urlLink;
            // if this link has already been set, we need to just edit the existing link
            /* istanbul ignore if: we do not test this */
            if (taSelection.getSelectionElement().tagName && taSelection.getSelectionElement().tagName.toLowerCase() === 'a') {
                urlLink = $window.prompt(taTranslations.insertLink.dialogPrompt, taSelection.getSelectionElement().href);
            } else {
                urlLink = $window.prompt(taTranslations.insertLink.dialogPrompt, 'http://');
            }
            if(urlLink && urlLink !== '' && urlLink !== 'http://'){
                // block javascript here
                /* istanbul ignore else: if it's javascript don't worry - though probably should show some kind of error message */
                if (!blockJavascript(urlLink)) {
                    return this.$editor().wrapSelection('createLink', urlLink, true);
                }
            }
        },
        activeState: function(commonElement){
            if(commonElement) return commonElement[0].tagName === 'A';
            return false;
        },
        onElementSelect: {
            element: 'a',
            action: taToolFunctions.aOnSelectAction
        }
    });
    taRegisterTool('wordcount', {
        display: '<div id="toolbarWC" style="display:block; min-width:100px;">Words: <span ng-bind="wordcount"></span></div>',
        disabled: true,
        wordcount: 0,
        activeState: function(){ // this fires on keyup
            var textElement = this.$editor().displayElements.text;
            /* istanbul ignore next: will default to '' when undefined */
            var workingHTML = textElement[0].innerHTML || '';
            var noOfWords = 0;

            /* istanbul ignore if: will default to '' when undefined */
            if (workingHTML.replace(/\s*<[^>]*?>\s*/g, '') !== '') {
                if (workingHTML.trim() !== '') {
                    noOfWords = workingHTML.replace(/<\/?(b|i|em|strong|span|u|strikethrough|a|img|small|sub|sup|label)( [^>*?])?>/gi, '') // remove inline tags without adding spaces
                        .replace(/(<[^>]*?>\s*<[^>]*?>)/ig, ' ') // replace adjacent tags with possible space between with a space
                        .replace(/(<[^>]*?>)/ig, '') // remove any singular tags
                        .replace(/\s+/ig, ' ') // condense spacing
                        .match(/\S+/g).length; // count remaining non-space strings
                }
            }

            //Set current scope
            this.wordcount = noOfWords;
            //Set editor scope
            this.$editor().wordcount = noOfWords;

            return false;
        }
    });
    taRegisterTool('charcount', {
        display: '<div id="toolbarCC" style="display:block; min-width:120px;">Characters: <span ng-bind="charcount"></span></div>',
        disabled: true,
        charcount: 0,
        activeState: function(){ // this fires on keyup
            var textElement = this.$editor().displayElements.text;
            var sourceText = textElement[0].innerText || textElement[0].textContent; // to cover the non-jquery use case.

            // Caculate number of chars
            var noOfChars = sourceText.replace(/(\r\n|\n|\r)/gm,"").replace(/^\s+/g,' ').replace(/\s+$/g, ' ').length;
            //Set current scope
            this.charcount = noOfChars;
            //Set editor scope
            this.$editor().charcount = noOfChars;
            return false;
        }
    });
}]);

/**
 * Rangy, a cross-browser JavaScript range and selection library
 * https://github.com/timdown/rangy
 *
 * Copyright 2015, Tim Down
 * Licensed under the MIT license.
 * Version: 1.3.0
 * Build date: 10 May 2015
 */

(function(factory, root) {
    if (typeof define == "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else if (typeof module != "undefined" && typeof exports == "object") {
        // Node/CommonJS style
        module.exports = factory();
    } else {
        // No AMD or CommonJS support so we place Rangy in (probably) the global variable
        root.rangy = factory();
    }
})(function() {

    var OBJECT = "object", FUNCTION = "function", UNDEFINED = "undefined";

    // Minimal set of properties required for DOM Level 2 Range compliance. Comparison constants such as START_TO_START
    // are omitted because ranges in KHTML do not have them but otherwise work perfectly well. See issue 113.
    var domRangeProperties = ["startContainer", "startOffset", "endContainer", "endOffset", "collapsed",
        "commonAncestorContainer"];

    // Minimal set of methods required for DOM Level 2 Range compliance
    var domRangeMethods = ["setStart", "setStartBefore", "setStartAfter", "setEnd", "setEndBefore",
        "setEndAfter", "collapse", "selectNode", "selectNodeContents", "compareBoundaryPoints", "deleteContents",
        "extractContents", "cloneContents", "insertNode", "surroundContents", "cloneRange", "toString", "detach"];

    var textRangeProperties = ["boundingHeight", "boundingLeft", "boundingTop", "boundingWidth", "htmlText", "text"];

    // Subset of TextRange's full set of methods that we're interested in
    var textRangeMethods = ["collapse", "compareEndPoints", "duplicate", "moveToElementText", "parentElement", "select",
        "setEndPoint", "getBoundingClientRect"];

    /*----------------------------------------------------------------------------------------------------------------*/

    // Trio of functions taken from Peter Michaux's article:
    // http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
    function isHostMethod(o, p) {
        var t = typeof o[p];
        return t == FUNCTION || (!!(t == OBJECT && o[p])) || t == "unknown";
    }

    function isHostObject(o, p) {
        return !!(typeof o[p] == OBJECT && o[p]);
    }

    function isHostProperty(o, p) {
        return typeof o[p] != UNDEFINED;
    }

    // Creates a convenience function to save verbose repeated calls to tests functions
    function createMultiplePropertyTest(testFunc) {
        return function(o, props) {
            var i = props.length;
            while (i--) {
                if (!testFunc(o, props[i])) {
                    return false;
                }
            }
            return true;
        };
    }

    // Next trio of functions are a convenience to save verbose repeated calls to previous two functions
    var areHostMethods = createMultiplePropertyTest(isHostMethod);
    var areHostObjects = createMultiplePropertyTest(isHostObject);
    var areHostProperties = createMultiplePropertyTest(isHostProperty);

    function isTextRange(range) {
        return range && areHostMethods(range, textRangeMethods) && areHostProperties(range, textRangeProperties);
    }

    function getBody(doc) {
        return isHostObject(doc, "body") ? doc.body : doc.getElementsByTagName("body")[0];
    }

    var forEach = [].forEach ?
        function(arr, func) {
            arr.forEach(func);
        } :
        function(arr, func) {
            for (var i = 0, len = arr.length; i < len; ++i) {
                func(arr[i], i);
            }
        };

    var modules = {};

    var isBrowser = (typeof window != UNDEFINED && typeof document != UNDEFINED);

    var util = {
        isHostMethod: isHostMethod,
        isHostObject: isHostObject,
        isHostProperty: isHostProperty,
        areHostMethods: areHostMethods,
        areHostObjects: areHostObjects,
        areHostProperties: areHostProperties,
        isTextRange: isTextRange,
        getBody: getBody,
        forEach: forEach
    };

    var api = {
        version: "1.3.0",
        initialized: false,
        isBrowser: isBrowser,
        supported: true,
        util: util,
        features: {},
        modules: modules,
        config: {
            alertOnFail: false,
            alertOnWarn: false,
            preferTextRange: false,
            autoInitialize: (typeof rangyAutoInitialize == UNDEFINED) ? true : rangyAutoInitialize
        }
    };

    function consoleLog(msg) {
        if (typeof console != UNDEFINED && isHostMethod(console, "log")) {
            console.log(msg);
        }
    }

    function alertOrLog(msg, shouldAlert) {
        if (isBrowser && shouldAlert) {
            alert(msg);
        } else  {
            consoleLog(msg);
        }
    }

    function fail(reason) {
        api.initialized = true;
        api.supported = false;
        alertOrLog("Rangy is not supported in this environment. Reason: " + reason, api.config.alertOnFail);
    }

    api.fail = fail;

    function warn(msg) {
        alertOrLog("Rangy warning: " + msg, api.config.alertOnWarn);
    }

    api.warn = warn;

    // Add utility extend() method
    var extend;
    if ({}.hasOwnProperty) {
        util.extend = extend = function(obj, props, deep) {
            var o, p;
            for (var i in props) {
                if (props.hasOwnProperty(i)) {
                    o = obj[i];
                    p = props[i];
                    if (deep && o !== null && typeof o == "object" && p !== null && typeof p == "object") {
                        extend(o, p, true);
                    }
                    obj[i] = p;
                }
            }
            // Special case for toString, which does not show up in for...in loops in IE <= 8
            if (props.hasOwnProperty("toString")) {
                obj.toString = props.toString;
            }
            return obj;
        };

        util.createOptions = function(optionsParam, defaults) {
            var options = {};
            extend(options, defaults);
            if (optionsParam) {
                extend(options, optionsParam);
            }
            return options;
        };
    } else {
        fail("hasOwnProperty not supported");
    }

    // Test whether we're in a browser and bail out if not
    if (!isBrowser) {
        fail("Rangy can only run in a browser");
    }

    // Test whether Array.prototype.slice can be relied on for NodeLists and use an alternative toArray() if not
    (function() {
        var toArray;

        if (isBrowser) {
            var el = document.createElement("div");
            el.appendChild(document.createElement("span"));
            var slice = [].slice;
            try {
                if (slice.call(el.childNodes, 0)[0].nodeType == 1) {
                    toArray = function(arrayLike) {
                        return slice.call(arrayLike, 0);
                    };
                }
            } catch (e) {}
        }

        if (!toArray) {
            toArray = function(arrayLike) {
                var arr = [];
                for (var i = 0, len = arrayLike.length; i < len; ++i) {
                    arr[i] = arrayLike[i];
                }
                return arr;
            };
        }

        util.toArray = toArray;
    })();

    // Very simple event handler wrapper function that doesn't attempt to solve issues such as "this" handling or
    // normalization of event properties
    var addListener;
    if (isBrowser) {
        if (isHostMethod(document, "addEventListener")) {
            addListener = function(obj, eventType, listener) {
                obj.addEventListener(eventType, listener, false);
            };
        } else if (isHostMethod(document, "attachEvent")) {
            addListener = function(obj, eventType, listener) {
                obj.attachEvent("on" + eventType, listener);
            };
        } else {
            fail("Document does not have required addEventListener or attachEvent method");
        }

        util.addListener = addListener;
    }

    var initListeners = [];

    function getErrorDesc(ex) {
        return ex.message || ex.description || String(ex);
    }

    // Initialization
    function init() {
        if (!isBrowser || api.initialized) {
            return;
        }
        var testRange;
        var implementsDomRange = false, implementsTextRange = false;

        // First, perform basic feature tests

        if (isHostMethod(document, "createRange")) {
            testRange = document.createRange();
            if (areHostMethods(testRange, domRangeMethods) && areHostProperties(testRange, domRangeProperties)) {
                implementsDomRange = true;
            }
        }

        var body = getBody(document);
        if (!body || body.nodeName.toLowerCase() != "body") {
            fail("No body element found");
            return;
        }

        if (body && isHostMethod(body, "createTextRange")) {
            testRange = body.createTextRange();
            if (isTextRange(testRange)) {
                implementsTextRange = true;
            }
        }

        if (!implementsDomRange && !implementsTextRange) {
            fail("Neither Range nor TextRange are available");
            return;
        }

        api.initialized = true;
        api.features = {
            implementsDomRange: implementsDomRange,
            implementsTextRange: implementsTextRange
        };

        // Initialize modules
        var module, errorMessage;
        for (var moduleName in modules) {
            if ( (module = modules[moduleName]) instanceof Module ) {
                module.init(module, api);
            }
        }

        // Call init listeners
        for (var i = 0, len = initListeners.length; i < len; ++i) {
            try {
                initListeners[i](api);
            } catch (ex) {
                errorMessage = "Rangy init listener threw an exception. Continuing. Detail: " + getErrorDesc(ex);
                consoleLog(errorMessage);
            }
        }
    }

    function deprecationNotice(deprecated, replacement, module) {
        if (module) {
            deprecated += " in module " + module.name;
        }
        api.warn("DEPRECATED: " + deprecated + " is deprecated. Please use " +
        replacement + " instead.");
    }

    function createAliasForDeprecatedMethod(owner, deprecated, replacement, module) {
        owner[deprecated] = function() {
            deprecationNotice(deprecated, replacement, module);
            return owner[replacement].apply(owner, util.toArray(arguments));
        };
    }

    util.deprecationNotice = deprecationNotice;
    util.createAliasForDeprecatedMethod = createAliasForDeprecatedMethod;

    // Allow external scripts to initialize this library in case it's loaded after the document has loaded
    api.init = init;

    // Execute listener immediately if already initialized
    api.addInitListener = function(listener) {
        if (api.initialized) {
            listener(api);
        } else {
            initListeners.push(listener);
        }
    };

    var shimListeners = [];

    api.addShimListener = function(listener) {
        shimListeners.push(listener);
    };

    function shim(win) {
        win = win || window;
        init();

        // Notify listeners
        for (var i = 0, len = shimListeners.length; i < len; ++i) {
            shimListeners[i](win);
        }
    }

    if (isBrowser) {
        api.shim = api.createMissingNativeApi = shim;
        createAliasForDeprecatedMethod(api, "createMissingNativeApi", "shim");
    }

    function Module(name, dependencies, initializer) {
        this.name = name;
        this.dependencies = dependencies;
        this.initialized = false;
        this.supported = false;
        this.initializer = initializer;
    }

    Module.prototype = {
        init: function() {
            var requiredModuleNames = this.dependencies || [];
            for (var i = 0, len = requiredModuleNames.length, requiredModule, moduleName; i < len; ++i) {
                moduleName = requiredModuleNames[i];

                requiredModule = modules[moduleName];
                if (!requiredModule || !(requiredModule instanceof Module)) {
                    throw new Error("required module '" + moduleName + "' not found");
                }

                requiredModule.init();

                if (!requiredModule.supported) {
                    throw new Error("required module '" + moduleName + "' not supported");
                }
            }

            // Now run initializer
            this.initializer(this);
        },

        fail: function(reason) {
            this.initialized = true;
            this.supported = false;
            throw new Error(reason);
        },

        warn: function(msg) {
            api.warn("Module " + this.name + ": " + msg);
        },

        deprecationNotice: function(deprecated, replacement) {
            api.warn("DEPRECATED: " + deprecated + " in module " + this.name + " is deprecated. Please use " +
                replacement + " instead");
        },

        createError: function(msg) {
            return new Error("Error in Rangy " + this.name + " module: " + msg);
        }
    };

    function createModule(name, dependencies, initFunc) {
        var newModule = new Module(name, dependencies, function(module) {
            if (!module.initialized) {
                module.initialized = true;
                try {
                    initFunc(api, module);
                    module.supported = true;
                } catch (ex) {
                    var errorMessage = "Module '" + name + "' failed to load: " + getErrorDesc(ex);
                    consoleLog(errorMessage);
                    if (ex.stack) {
                        consoleLog(ex.stack);
                    }
                }
            }
        });
        modules[name] = newModule;
        return newModule;
    }

    api.createModule = function(name) {
        // Allow 2 or 3 arguments (second argument is an optional array of dependencies)
        var initFunc, dependencies;
        if (arguments.length == 2) {
            initFunc = arguments[1];
            dependencies = [];
        } else {
            initFunc = arguments[2];
            dependencies = arguments[1];
        }

        var module = createModule(name, dependencies, initFunc);

        // Initialize the module immediately if the core is already initialized
        if (api.initialized && api.supported) {
            module.init();
        }
    };

    api.createCoreModule = function(name, dependencies, initFunc) {
        createModule(name, dependencies, initFunc);
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    // Ensure rangy.rangePrototype and rangy.selectionPrototype are available immediately

    function RangePrototype() {}
    api.RangePrototype = RangePrototype;
    api.rangePrototype = new RangePrototype();

    function SelectionPrototype() {}
    api.selectionPrototype = new SelectionPrototype();

    /*----------------------------------------------------------------------------------------------------------------*/

    // DOM utility methods used by Rangy
    api.createCoreModule("DomUtil", [], function(api, module) {
        var UNDEF = "undefined";
        var util = api.util;
        var getBody = util.getBody;

        // Perform feature tests
        if (!util.areHostMethods(document, ["createDocumentFragment", "createElement", "createTextNode"])) {
            module.fail("document missing a Node creation method");
        }

        if (!util.isHostMethod(document, "getElementsByTagName")) {
            module.fail("document missing getElementsByTagName method");
        }

        var el = document.createElement("div");
        if (!util.areHostMethods(el, ["insertBefore", "appendChild", "cloneNode"] ||
                !util.areHostObjects(el, ["previousSibling", "nextSibling", "childNodes", "parentNode"]))) {
            module.fail("Incomplete Element implementation");
        }

        // innerHTML is required for Range's createContextualFragment method
        if (!util.isHostProperty(el, "innerHTML")) {
            module.fail("Element is missing innerHTML property");
        }

        var textNode = document.createTextNode("test");
        if (!util.areHostMethods(textNode, ["splitText", "deleteData", "insertData", "appendData", "cloneNode"] ||
                !util.areHostObjects(el, ["previousSibling", "nextSibling", "childNodes", "parentNode"]) ||
                !util.areHostProperties(textNode, ["data"]))) {
            module.fail("Incomplete Text Node implementation");
        }

        /*----------------------------------------------------------------------------------------------------------------*/

        // Removed use of indexOf because of a bizarre bug in Opera that is thrown in one of the Acid3 tests. I haven't been
        // able to replicate it outside of the test. The bug is that indexOf returns -1 when called on an Array that
        // contains just the document as a single element and the value searched for is the document.
        var arrayContains = /*Array.prototype.indexOf ?
            function(arr, val) {
                return arr.indexOf(val) > -1;
            }:*/

            function(arr, val) {
                var i = arr.length;
                while (i--) {
                    if (arr[i] === val) {
                        return true;
                    }
                }
                return false;
            };

        // Opera 11 puts HTML elements in the null namespace, it seems, and IE 7 has undefined namespaceURI
        function isHtmlNamespace(node) {
            var ns;
            return typeof node.namespaceURI == UNDEF || ((ns = node.namespaceURI) === null || ns == "http://www.w3.org/1999/xhtml");
        }

        function parentElement(node) {
            var parent = node.parentNode;
            return (parent.nodeType == 1) ? parent : null;
        }

        function getNodeIndex(node) {
            var i = 0;
            while( (node = node.previousSibling) ) {
                ++i;
            }
            return i;
        }

        function getNodeLength(node) {
            switch (node.nodeType) {
                case 7:
                case 10:
                    return 0;
                case 3:
                case 8:
                    return node.length;
                default:
                    return node.childNodes.length;
            }
        }

        function getCommonAncestor(node1, node2) {
            var ancestors = [], n;
            for (n = node1; n; n = n.parentNode) {
                ancestors.push(n);
            }

            for (n = node2; n; n = n.parentNode) {
                if (arrayContains(ancestors, n)) {
                    return n;
                }
            }

            return null;
        }

        function isAncestorOf(ancestor, descendant, selfIsAncestor) {
            var n = selfIsAncestor ? descendant : descendant.parentNode;
            while (n) {
                if (n === ancestor) {
                    return true;
                } else {
                    n = n.parentNode;
                }
            }
            return false;
        }

        function isOrIsAncestorOf(ancestor, descendant) {
            return isAncestorOf(ancestor, descendant, true);
        }

        function getClosestAncestorIn(node, ancestor, selfIsAncestor) {
            var p, n = selfIsAncestor ? node : node.parentNode;
            while (n) {
                p = n.parentNode;
                if (p === ancestor) {
                    return n;
                }
                n = p;
            }
            return null;
        }

        function isCharacterDataNode(node) {
            var t = node.nodeType;
            return t == 3 || t == 4 || t == 8 ; // Text, CDataSection or Comment
        }

        function isTextOrCommentNode(node) {
            if (!node) {
                return false;
            }
            var t = node.nodeType;
            return t == 3 || t == 8 ; // Text or Comment
        }

        function insertAfter(node, precedingNode) {
            var nextNode = precedingNode.nextSibling, parent = precedingNode.parentNode;
            if (nextNode) {
                parent.insertBefore(node, nextNode);
            } else {
                parent.appendChild(node);
            }
            return node;
        }

        // Note that we cannot use splitText() because it is bugridden in IE 9.
        function splitDataNode(node, index, positionsToPreserve) {
            var newNode = node.cloneNode(false);
            newNode.deleteData(0, index);
            node.deleteData(index, node.length - index);
            insertAfter(newNode, node);

            // Preserve positions
            if (positionsToPreserve) {
                for (var i = 0, position; position = positionsToPreserve[i++]; ) {
                    // Handle case where position was inside the portion of node after the split point
                    if (position.node == node && position.offset > index) {
                        position.node = newNode;
                        position.offset -= index;
                    }
                    // Handle the case where the position is a node offset within node's parent
                    else if (position.node == node.parentNode && position.offset > getNodeIndex(node)) {
                        ++position.offset;
                    }
                }
            }
            return newNode;
        }

        function getDocument(node) {
            if (node.nodeType == 9) {
                return node;
            } else if (typeof node.ownerDocument != UNDEF) {
                return node.ownerDocument;
            } else if (typeof node.document != UNDEF) {
                return node.document;
            } else if (node.parentNode) {
                return getDocument(node.parentNode);
            } else {
                throw module.createError("getDocument: no document found for node");
            }
        }

        function getWindow(node) {
            var doc = getDocument(node);
            if (typeof doc.defaultView != UNDEF) {
                return doc.defaultView;
            } else if (typeof doc.parentWindow != UNDEF) {
                return doc.parentWindow;
            } else {
                throw module.createError("Cannot get a window object for node");
            }
        }

        function getIframeDocument(iframeEl) {
            if (typeof iframeEl.contentDocument != UNDEF) {
                return iframeEl.contentDocument;
            } else if (typeof iframeEl.contentWindow != UNDEF) {
                return iframeEl.contentWindow.document;
            } else {
                throw module.createError("getIframeDocument: No Document object found for iframe element");
            }
        }

        function getIframeWindow(iframeEl) {
            if (typeof iframeEl.contentWindow != UNDEF) {
                return iframeEl.contentWindow;
            } else if (typeof iframeEl.contentDocument != UNDEF) {
                return iframeEl.contentDocument.defaultView;
            } else {
                throw module.createError("getIframeWindow: No Window object found for iframe element");
            }
        }

        // This looks bad. Is it worth it?
        function isWindow(obj) {
            return obj && util.isHostMethod(obj, "setTimeout") && util.isHostObject(obj, "document");
        }

        function getContentDocument(obj, module, methodName) {
            var doc;

            if (!obj) {
                doc = document;
            }

            // Test if a DOM node has been passed and obtain a document object for it if so
            else if (util.isHostProperty(obj, "nodeType")) {
                doc = (obj.nodeType == 1 && obj.tagName.toLowerCase() == "iframe") ?
                    getIframeDocument(obj) : getDocument(obj);
            }

            // Test if the doc parameter appears to be a Window object
            else if (isWindow(obj)) {
                doc = obj.document;
            }

            if (!doc) {
                throw module.createError(methodName + "(): Parameter must be a Window object or DOM node");
            }

            return doc;
        }

        function getRootContainer(node) {
            var parent;
            while ( (parent = node.parentNode) ) {
                node = parent;
            }
            return node;
        }

        function comparePoints(nodeA, offsetA, nodeB, offsetB) {
            // See http://www.w3.org/TR/DOM-Level-2-Traversal-Range/ranges.html#Level-2-Range-Comparing
            var nodeC, root, childA, childB, n;
            if (nodeA == nodeB) {
                // Case 1: nodes are the same
                return offsetA === offsetB ? 0 : (offsetA < offsetB) ? -1 : 1;
            } else if ( (nodeC = getClosestAncestorIn(nodeB, nodeA, true)) ) {
                // Case 2: node C (container B or an ancestor) is a child node of A
                return offsetA <= getNodeIndex(nodeC) ? -1 : 1;
            } else if ( (nodeC = getClosestAncestorIn(nodeA, nodeB, true)) ) {
                // Case 3: node C (container A or an ancestor) is a child node of B
                return getNodeIndex(nodeC) < offsetB  ? -1 : 1;
            } else {
                root = getCommonAncestor(nodeA, nodeB);
                if (!root) {
                    throw new Error("comparePoints error: nodes have no common ancestor");
                }

                // Case 4: containers are siblings or descendants of siblings
                childA = (nodeA === root) ? root : getClosestAncestorIn(nodeA, root, true);
                childB = (nodeB === root) ? root : getClosestAncestorIn(nodeB, root, true);

                if (childA === childB) {
                    // This shouldn't be possible
                    throw module.createError("comparePoints got to case 4 and childA and childB are the same!");
                } else {
                    n = root.firstChild;
                    while (n) {
                        if (n === childA) {
                            return -1;
                        } else if (n === childB) {
                            return 1;
                        }
                        n = n.nextSibling;
                    }
                }
            }
        }

        /*----------------------------------------------------------------------------------------------------------------*/

        // Test for IE's crash (IE 6/7) or exception (IE >= 8) when a reference to garbage-collected text node is queried
        var crashyTextNodes = false;

        function isBrokenNode(node) {
            var n;
            try {
                n = node.parentNode;
                return false;
            } catch (e) {
                return true;
            }
        }

        (function() {
            var el = document.createElement("b");
            el.innerHTML = "1";
            var textNode = el.firstChild;
            el.innerHTML = "<br />";
            crashyTextNodes = isBrokenNode(textNode);

            api.features.crashyTextNodes = crashyTextNodes;
        })();

        /*----------------------------------------------------------------------------------------------------------------*/

        function inspectNode(node) {
            if (!node) {
                return "[No node]";
            }
            if (crashyTextNodes && isBrokenNode(node)) {
                return "[Broken node]";
            }
            if (isCharacterDataNode(node)) {
                return '"' + node.data + '"';
            }
            if (node.nodeType == 1) {
                var idAttr = node.id ? ' id="' + node.id + '"' : "";
                return "<" + node.nodeName + idAttr + ">[index:" + getNodeIndex(node) + ",length:" + node.childNodes.length + "][" + (node.innerHTML || "[innerHTML not supported]").slice(0, 25) + "]";
            }
            return node.nodeName;
        }

        function fragmentFromNodeChildren(node) {
            var fragment = getDocument(node).createDocumentFragment(), child;
            while ( (child = node.firstChild) ) {
                fragment.appendChild(child);
            }
            return fragment;
        }

        var getComputedStyleProperty;
        if (typeof window.getComputedStyle != UNDEF) {
            getComputedStyleProperty = function(el, propName) {
                return getWindow(el).getComputedStyle(el, null)[propName];
            };
        } else if (typeof document.documentElement.currentStyle != UNDEF) {
            getComputedStyleProperty = function(el, propName) {
                return el.currentStyle ? el.currentStyle[propName] : "";
            };
        } else {
            module.fail("No means of obtaining computed style properties found");
        }

        function createTestElement(doc, html, contentEditable) {
            var body = getBody(doc);
            var el = doc.createElement("div");
            el.contentEditable = "" + !!contentEditable;
            if (html) {
                el.innerHTML = html;
            }

            // Insert the test element at the start of the body to prevent scrolling to the bottom in iOS (issue #292)
            var bodyFirstChild = body.firstChild;
            if (bodyFirstChild) {
                body.insertBefore(el, bodyFirstChild);
            } else {
                body.appendChild(el);
            }

            return el;
        }

        function removeNode(node) {
            return node.parentNode.removeChild(node);
        }

        function NodeIterator(root) {
            this.root = root;
            this._next = root;
        }

        NodeIterator.prototype = {
            _current: null,

            hasNext: function() {
                return !!this._next;
            },

            next: function() {
                var n = this._current = this._next;
                var child, next;
                if (this._current) {
                    child = n.firstChild;
                    if (child) {
                        this._next = child;
                    } else {
                        next = null;
                        while ((n !== this.root) && !(next = n.nextSibling)) {
                            n = n.parentNode;
                        }
                        this._next = next;
                    }
                }
                return this._current;
            },

            detach: function() {
                this._current = this._next = this.root = null;
            }
        };

        function createIterator(root) {
            return new NodeIterator(root);
        }

        function DomPosition(node, offset) {
            this.node = node;
            this.offset = offset;
        }

        DomPosition.prototype = {
            equals: function(pos) {
                return !!pos && this.node === pos.node && this.offset == pos.offset;
            },

            inspect: function() {
                return "[DomPosition(" + inspectNode(this.node) + ":" + this.offset + ")]";
            },

            toString: function() {
                return this.inspect();
            }
        };

        function DOMException(codeName) {
            this.code = this[codeName];
            this.codeName = codeName;
            this.message = "DOMException: " + this.codeName;
        }

        DOMException.prototype = {
            INDEX_SIZE_ERR: 1,
            HIERARCHY_REQUEST_ERR: 3,
            WRONG_DOCUMENT_ERR: 4,
            NO_MODIFICATION_ALLOWED_ERR: 7,
            NOT_FOUND_ERR: 8,
            NOT_SUPPORTED_ERR: 9,
            INVALID_STATE_ERR: 11,
            INVALID_NODE_TYPE_ERR: 24
        };

        DOMException.prototype.toString = function() {
            return this.message;
        };

        api.dom = {
            arrayContains: arrayContains,
            isHtmlNamespace: isHtmlNamespace,
            parentElement: parentElement,
            getNodeIndex: getNodeIndex,
            getNodeLength: getNodeLength,
            getCommonAncestor: getCommonAncestor,
            isAncestorOf: isAncestorOf,
            isOrIsAncestorOf: isOrIsAncestorOf,
            getClosestAncestorIn: getClosestAncestorIn,
            isCharacterDataNode: isCharacterDataNode,
            isTextOrCommentNode: isTextOrCommentNode,
            insertAfter: insertAfter,
            splitDataNode: splitDataNode,
            getDocument: getDocument,
            getWindow: getWindow,
            getIframeWindow: getIframeWindow,
            getIframeDocument: getIframeDocument,
            getBody: getBody,
            isWindow: isWindow,
            getContentDocument: getContentDocument,
            getRootContainer: getRootContainer,
            comparePoints: comparePoints,
            isBrokenNode: isBrokenNode,
            inspectNode: inspectNode,
            getComputedStyleProperty: getComputedStyleProperty,
            createTestElement: createTestElement,
            removeNode: removeNode,
            fragmentFromNodeChildren: fragmentFromNodeChildren,
            createIterator: createIterator,
            DomPosition: DomPosition
        };

        api.DOMException = DOMException;
    });

    /*----------------------------------------------------------------------------------------------------------------*/

    // Pure JavaScript implementation of DOM Range
    api.createCoreModule("DomRange", ["DomUtil"], function(api, module) {
        var dom = api.dom;
        var util = api.util;
        var DomPosition = dom.DomPosition;
        var DOMException = api.DOMException;

        var isCharacterDataNode = dom.isCharacterDataNode;
        var getNodeIndex = dom.getNodeIndex;
        var isOrIsAncestorOf = dom.isOrIsAncestorOf;
        var getDocument = dom.getDocument;
        var comparePoints = dom.comparePoints;
        var splitDataNode = dom.splitDataNode;
        var getClosestAncestorIn = dom.getClosestAncestorIn;
        var getNodeLength = dom.getNodeLength;
        var arrayContains = dom.arrayContains;
        var getRootContainer = dom.getRootContainer;
        var crashyTextNodes = api.features.crashyTextNodes;

        var removeNode = dom.removeNode;

        /*----------------------------------------------------------------------------------------------------------------*/

        // Utility functions

        function isNonTextPartiallySelected(node, range) {
            return (node.nodeType != 3) &&
                   (isOrIsAncestorOf(node, range.startContainer) || isOrIsAncestorOf(node, range.endContainer));
        }

        function getRangeDocument(range) {
            return range.document || getDocument(range.startContainer);
        }

        function getRangeRoot(range) {
            return getRootContainer(range.startContainer);
        }

        function getBoundaryBeforeNode(node) {
            return new DomPosition(node.parentNode, getNodeIndex(node));
        }

        function getBoundaryAfterNode(node) {
            return new DomPosition(node.parentNode, getNodeIndex(node) + 1);
        }

        function insertNodeAtPosition(node, n, o) {
            var firstNodeInserted = node.nodeType == 11 ? node.firstChild : node;
            if (isCharacterDataNode(n)) {
                if (o == n.length) {
                    dom.insertAfter(node, n);
                } else {
                    n.parentNode.insertBefore(node, o == 0 ? n : splitDataNode(n, o));
                }
            } else if (o >= n.childNodes.length) {
                n.appendChild(node);
            } else {
                n.insertBefore(node, n.childNodes[o]);
            }
            return firstNodeInserted;
        }

        function rangesIntersect(rangeA, rangeB, touchingIsIntersecting) {
            assertRangeValid(rangeA);
            assertRangeValid(rangeB);

            if (getRangeDocument(rangeB) != getRangeDocument(rangeA)) {
                throw new DOMException("WRONG_DOCUMENT_ERR");
            }

            var startComparison = comparePoints(rangeA.startContainer, rangeA.startOffset, rangeB.endContainer, rangeB.endOffset),
                endComparison = comparePoints(rangeA.endContainer, rangeA.endOffset, rangeB.startContainer, rangeB.startOffset);

            return touchingIsIntersecting ? startComparison <= 0 && endComparison >= 0 : startComparison < 0 && endComparison > 0;
        }

        function cloneSubtree(iterator) {
            var partiallySelected;
            for (var node, frag = getRangeDocument(iterator.range).createDocumentFragment(), subIterator; node = iterator.next(); ) {
                partiallySelected = iterator.isPartiallySelectedSubtree();
                node = node.cloneNode(!partiallySelected);
                if (partiallySelected) {
                    subIterator = iterator.getSubtreeIterator();
                    node.appendChild(cloneSubtree(subIterator));
                    subIterator.detach();
                }

                if (node.nodeType == 10) { // DocumentType
                    throw new DOMException("HIERARCHY_REQUEST_ERR");
                }
                frag.appendChild(node);
            }
            return frag;
        }

        function iterateSubtree(rangeIterator, func, iteratorState) {
            var it, n;
            iteratorState = iteratorState || { stop: false };
            for (var node, subRangeIterator; node = rangeIterator.next(); ) {
                if (rangeIterator.isPartiallySelectedSubtree()) {
                    if (func(node) === false) {
                        iteratorState.stop = true;
                        return;
                    } else {
                        // The node is partially selected by the Range, so we can use a new RangeIterator on the portion of
                        // the node selected by the Range.
                        subRangeIterator = rangeIterator.getSubtreeIterator();
                        iterateSubtree(subRangeIterator, func, iteratorState);
                        subRangeIterator.detach();
                        if (iteratorState.stop) {
                            return;
                        }
                    }
                } else {
                    // The whole node is selected, so we can use efficient DOM iteration to iterate over the node and its
                    // descendants
                    it = dom.createIterator(node);
                    while ( (n = it.next()) ) {
                        if (func(n) === false) {
                            iteratorState.stop = true;
                            return;
                        }
                    }
                }
            }
        }

        function deleteSubtree(iterator) {
            var subIterator;
            while (iterator.next()) {
                if (iterator.isPartiallySelectedSubtree()) {
                    subIterator = iterator.getSubtreeIterator();
                    deleteSubtree(subIterator);
                    subIterator.detach();
                } else {
                    iterator.remove();
                }
            }
        }

        function extractSubtree(iterator) {
            for (var node, frag = getRangeDocument(iterator.range).createDocumentFragment(), subIterator; node = iterator.next(); ) {

                if (iterator.isPartiallySelectedSubtree()) {
                    node = node.cloneNode(false);
                    subIterator = iterator.getSubtreeIterator();
                    node.appendChild(extractSubtree(subIterator));
                    subIterator.detach();
                } else {
                    iterator.remove();
                }
                if (node.nodeType == 10) { // DocumentType
                    throw new DOMException("HIERARCHY_REQUEST_ERR");
                }
                frag.appendChild(node);
            }
            return frag;
        }

        function getNodesInRange(range, nodeTypes, filter) {
            var filterNodeTypes = !!(nodeTypes && nodeTypes.length), regex;
            var filterExists = !!filter;
            if (filterNodeTypes) {
                regex = new RegExp("^(" + nodeTypes.join("|") + ")$");
            }

            var nodes = [];
            iterateSubtree(new RangeIterator(range, false), function(node) {
                if (filterNodeTypes && !regex.test(node.nodeType)) {
                    return;
                }
                if (filterExists && !filter(node)) {
                    return;
                }
                // Don't include a boundary container if it is a character data node and the range does not contain any
                // of its character data. See issue 190.
                var sc = range.startContainer;
                if (node == sc && isCharacterDataNode(sc) && range.startOffset == sc.length) {
                    return;
                }

                var ec = range.endContainer;
                if (node == ec && isCharacterDataNode(ec) && range.endOffset == 0) {
                    return;
                }

                nodes.push(node);
            });
            return nodes;
        }

        function inspect(range) {
            var name = (typeof range.getName == "undefined") ? "Range" : range.getName();
            return "[" + name + "(" + dom.inspectNode(range.startContainer) + ":" + range.startOffset + ", " +
                    dom.inspectNode(range.endContainer) + ":" + range.endOffset + ")]";
        }

        /*----------------------------------------------------------------------------------------------------------------*/

        // RangeIterator code partially borrows from IERange by Tim Ryan (http://github.com/timcameronryan/IERange)

        function RangeIterator(range, clonePartiallySelectedTextNodes) {
            this.range = range;
            this.clonePartiallySelectedTextNodes = clonePartiallySelectedTextNodes;


            if (!range.collapsed) {
                this.sc = range.startContainer;
                this.so = range.startOffset;
                this.ec = range.endContainer;
                this.eo = range.endOffset;
                var root = range.commonAncestorContainer;

                if (this.sc === this.ec && isCharacterDataNode(this.sc)) {
                    this.isSingleCharacterDataNode = true;
                    this._first = this._last = this._next = this.sc;
                } else {
                    this._first = this._next = (this.sc === root && !isCharacterDataNode(this.sc)) ?
                        this.sc.childNodes[this.so] : getClosestAncestorIn(this.sc, root, true);
                    this._last = (this.ec === root && !isCharacterDataNode(this.ec)) ?
                        this.ec.childNodes[this.eo - 1] : getClosestAncestorIn(this.ec, root, true);
                }
            }
        }

        RangeIterator.prototype = {
            _current: null,
            _next: null,
            _first: null,
            _last: null,
            isSingleCharacterDataNode: false,

            reset: function() {
                this._current = null;
                this._next = this._first;
            },

            hasNext: function() {
                return !!this._next;
            },

            next: function() {
                // Move to next node
                var current = this._current = this._next;
                if (current) {
                    this._next = (current !== this._last) ? current.nextSibling : null;

                    // Check for partially selected text nodes
                    if (isCharacterDataNode(current) && this.clonePartiallySelectedTextNodes) {
                        if (current === this.ec) {
                            (current = current.cloneNode(true)).deleteData(this.eo, current.length - this.eo);
                        }
                        if (this._current === this.sc) {
                            (current = current.cloneNode(true)).deleteData(0, this.so);
                        }
                    }
                }

                return current;
            },

            remove: function() {
                var current = this._current, start, end;

                if (isCharacterDataNode(current) && (current === this.sc || current === this.ec)) {
                    start = (current === this.sc) ? this.so : 0;
                    end = (current === this.ec) ? this.eo : current.length;
                    if (start != end) {
                        current.deleteData(start, end - start);
                    }
                } else {
                    if (current.parentNode) {
                        removeNode(current);
                    } else {
                    }
                }
            },

            // Checks if the current node is partially selected
            isPartiallySelectedSubtree: function() {
                var current = this._current;
                return isNonTextPartiallySelected(current, this.range);
            },

            getSubtreeIterator: function() {
                var subRange;
                if (this.isSingleCharacterDataNode) {
                    subRange = this.range.cloneRange();
                    subRange.collapse(false);
                } else {
                    subRange = new Range(getRangeDocument(this.range));
                    var current = this._current;
                    var startContainer = current, startOffset = 0, endContainer = current, endOffset = getNodeLength(current);

                    if (isOrIsAncestorOf(current, this.sc)) {
                        startContainer = this.sc;
                        startOffset = this.so;
                    }
                    if (isOrIsAncestorOf(current, this.ec)) {
                        endContainer = this.ec;
                        endOffset = this.eo;
                    }

                    updateBoundaries(subRange, startContainer, startOffset, endContainer, endOffset);
                }
                return new RangeIterator(subRange, this.clonePartiallySelectedTextNodes);
            },

            detach: function() {
                this.range = this._current = this._next = this._first = this._last = this.sc = this.so = this.ec = this.eo = null;
            }
        };

        /*----------------------------------------------------------------------------------------------------------------*/

        var beforeAfterNodeTypes = [1, 3, 4, 5, 7, 8, 10];
        var rootContainerNodeTypes = [2, 9, 11];
        var readonlyNodeTypes = [5, 6, 10, 12];
        var insertableNodeTypes = [1, 3, 4, 5, 7, 8, 10, 11];
        var surroundNodeTypes = [1, 3, 4, 5, 7, 8];

        function createAncestorFinder(nodeTypes) {
            return function(node, selfIsAncestor) {
                var t, n = selfIsAncestor ? node : node.parentNode;
                while (n) {
                    t = n.nodeType;
                    if (arrayContains(nodeTypes, t)) {
                        return n;
                    }
                    n = n.parentNode;
                }
                return null;
            };
        }

        var getDocumentOrFragmentContainer = createAncestorFinder( [9, 11] );
        var getReadonlyAncestor = createAncestorFinder(readonlyNodeTypes);
        var getDocTypeNotationEntityAncestor = createAncestorFinder( [6, 10, 12] );

        function assertNoDocTypeNotationEntityAncestor(node, allowSelf) {
            if (getDocTypeNotationEntityAncestor(node, allowSelf)) {
                throw new DOMException("INVALID_NODE_TYPE_ERR");
            }
        }

        function assertValidNodeType(node, invalidTypes) {
            if (!arrayContains(invalidTypes, node.nodeType)) {
                throw new DOMException("INVALID_NODE_TYPE_ERR");
            }
        }

        function assertValidOffset(node, offset) {
            if (offset < 0 || offset > (isCharacterDataNode(node) ? node.length : node.childNodes.length)) {
                throw new DOMException("INDEX_SIZE_ERR");
            }
        }

        function assertSameDocumentOrFragment(node1, node2) {
            if (getDocumentOrFragmentContainer(node1, true) !== getDocumentOrFragmentContainer(node2, true)) {
                throw new DOMException("WRONG_DOCUMENT_ERR");
            }
        }

        function assertNodeNotReadOnly(node) {
            if (getReadonlyAncestor(node, true)) {
                throw new DOMException("NO_MODIFICATION_ALLOWED_ERR");
            }
        }

        function assertNode(node, codeName) {
            if (!node) {
                throw new DOMException(codeName);
            }
        }

        function isValidOffset(node, offset) {
            return offset <= (isCharacterDataNode(node) ? node.length : node.childNodes.length);
        }

        function isRangeValid(range) {
            return (!!range.startContainer && !!range.endContainer &&
                    !(crashyTextNodes && (dom.isBrokenNode(range.startContainer) || dom.isBrokenNode(range.endContainer))) &&
                    getRootContainer(range.startContainer) == getRootContainer(range.endContainer) &&
                    isValidOffset(range.startContainer, range.startOffset) &&
                    isValidOffset(range.endContainer, range.endOffset));
        }

        function assertRangeValid(range) {
            if (!isRangeValid(range)) {
                throw new Error("Range error: Range is not valid. This usually happens after DOM mutation. Range: (" + range.inspect() + ")");
            }
        }

        /*----------------------------------------------------------------------------------------------------------------*/

        // Test the browser's innerHTML support to decide how to implement createContextualFragment
        var styleEl = document.createElement("style");
        var htmlParsingConforms = false;
        try {
            styleEl.innerHTML = "<b>x</b>";
            htmlParsingConforms = (styleEl.firstChild.nodeType == 3); // Opera incorrectly creates an element node
        } catch (e) {
            // IE 6 and 7 throw
        }

        api.features.htmlParsingConforms = htmlParsingConforms;

        var createContextualFragment = htmlParsingConforms ?

            // Implementation as per HTML parsing spec, trusting in the browser's implementation of innerHTML. See
            // discussion and base code for this implementation at issue 67.
            // Spec: http://html5.org/specs/dom-parsing.html#extensions-to-the-range-interface
            // Thanks to Aleks Williams.
            function(fragmentStr) {
                // "Let node the context object's start's node."
                var node = this.startContainer;
                var doc = getDocument(node);

                // "If the context object's start's node is null, raise an INVALID_STATE_ERR
                // exception and abort these steps."
                if (!node) {
                    throw new DOMException("INVALID_STATE_ERR");
                }

                // "Let element be as follows, depending on node's interface:"
                // Document, Document Fragment: null
                var el = null;

                // "Element: node"
                if (node.nodeType == 1) {
                    el = node;

                // "Text, Comment: node's parentElement"
                } else if (isCharacterDataNode(node)) {
                    el = dom.parentElement(node);
                }

                // "If either element is null or element's ownerDocument is an HTML document
                // and element's local name is "html" and element's namespace is the HTML
                // namespace"
                if (el === null || (
                    el.nodeName == "HTML" &&
                    dom.isHtmlNamespace(getDocument(el).documentElement) &&
                    dom.isHtmlNamespace(el)
                )) {

                // "let element be a new Element with "body" as its local name and the HTML
                // namespace as its namespace.""
                    el = doc.createElement("body");
                } else {
                    el = el.cloneNode(false);
                }

                // "If the node's document is an HTML document: Invoke the HTML fragment parsing algorithm."
                // "If the node's document is an XML document: Invoke the XML fragment parsing algorithm."
                // "In either case, the algorithm must be invoked with fragment as the input
                // and element as the context element."
                el.innerHTML = fragmentStr;

                // "If this raises an exception, then abort these steps. Otherwise, let new
                // children be the nodes returned."

                // "Let fragment be a new DocumentFragment."
                // "Append all new children to fragment."
                // "Return fragment."
                return dom.fragmentFromNodeChildren(el);
            } :

            // In this case, innerHTML cannot be trusted, so fall back to a simpler, non-conformant implementation that
            // previous versions of Rangy used (with the exception of using a body element rather than a div)
            function(fragmentStr) {
                var doc = getRangeDocument(this);
                var el = doc.createElement("body");
                el.innerHTML = fragmentStr;

                return dom.fragmentFromNodeChildren(el);
            };

        function splitRangeBoundaries(range, positionsToPreserve) {
            assertRangeValid(range);

            var sc = range.startContainer, so = range.startOffset, ec = range.endContainer, eo = range.endOffset;
            var startEndSame = (sc === ec);

            if (isCharacterDataNode(ec) && eo > 0 && eo < ec.length) {
                splitDataNode(ec, eo, positionsToPreserve);
            }

            if (isCharacterDataNode(sc) && so > 0 && so < sc.length) {
                sc = splitDataNode(sc, so, positionsToPreserve);
                if (startEndSame) {
                    eo -= so;
                    ec = sc;
                } else if (ec == sc.parentNode && eo >= getNodeIndex(sc)) {
                    eo++;
                }
                so = 0;
            }
            range.setStartAndEnd(sc, so, ec, eo);
        }

        function rangeToHtml(range) {
            assertRangeValid(range);
            var container = range.commonAncestorContainer.parentNode.cloneNode(false);
            container.appendChild( range.cloneContents() );
            return container.innerHTML;
        }

        /*----------------------------------------------------------------------------------------------------------------*/

        var rangeProperties = ["startContainer", "startOffset", "endContainer", "endOffset", "collapsed",
            "commonAncestorContainer"];

        var s2s = 0, s2e = 1, e2e = 2, e2s = 3;
        var n_b = 0, n_a = 1, n_b_a = 2, n_i = 3;

        util.extend(api.rangePrototype, {
            compareBoundaryPoints: function(how, range) {
                assertRangeValid(this);
                assertSameDocumentOrFragment(this.startContainer, range.startContainer);

                var nodeA, offsetA, nodeB, offsetB;
                var prefixA = (how == e2s || how == s2s) ? "start" : "end";
                var prefixB = (how == s2e || how == s2s) ? "start" : "end";
                nodeA = this[prefixA + "Container"];
                offsetA = this[prefixA + "Offset"];
                nodeB = range[prefixB + "Container"];
                offsetB = range[prefixB + "Offset"];
                return comparePoints(nodeA, offsetA, nodeB, offsetB);
            },

            insertNode: function(node) {
                assertRangeValid(this);
                assertValidNodeType(node, insertableNodeTypes);
                assertNodeNotReadOnly(this.startContainer);

                if (isOrIsAncestorOf(node, this.startContainer)) {
                    throw new DOMException("HIERARCHY_REQUEST_ERR");
                }

                // No check for whether the container of the start of the Range is of a type that does not allow
                // children of the type of node: the browser's DOM implementation should do this for us when we attempt
                // to add the node

                var firstNodeInserted = insertNodeAtPosition(node, this.startContainer, this.startOffset);
                this.setStartBefore(firstNodeInserted);
            },

            cloneContents: function() {
                assertRangeValid(this);

                var clone, frag;
                if (this.collapsed) {
                    return getRangeDocument(this).createDocumentFragment();
                } else {
                    if (this.startContainer === this.endContainer && isCharacterDataNode(this.startContainer)) {
                        clone = this.startContainer.cloneNode(true);
                        clone.data = clone.data.slice(this.startOffset, this.endOffset);
                        frag = getRangeDocument(this).createDocumentFragment();
                        frag.appendChild(clone);
                        return frag;
                    } else {
                        var iterator = new RangeIterator(this, true);
                        clone = cloneSubtree(iterator);
                        iterator.detach();
                    }
                    return clone;
                }
            },

            canSurroundContents: function() {
                assertRangeValid(this);
                assertNodeNotReadOnly(this.startContainer);
                assertNodeNotReadOnly(this.endContainer);

                // Check if the contents can be surrounded. Specifically, this means whether the range partially selects
                // no non-text nodes.
                var iterator = new RangeIterator(this, true);
                var boundariesInvalid = (iterator._first && (isNonTextPartiallySelected(iterator._first, this)) ||
                        (iterator._last && isNonTextPartiallySelected(iterator._last, this)));
                iterator.detach();
                return !boundariesInvalid;
            },

            surroundContents: function(node) {
                assertValidNodeType(node, surroundNodeTypes);

                if (!this.canSurroundContents()) {
                    throw new DOMException("INVALID_STATE_ERR");
                }

                // Extract the contents
                var content = this.extractContents();

                // Clear the children of the node
                if (node.hasChildNodes()) {
                    while (node.lastChild) {
                        node.removeChild(node.lastChild);
                    }
                }

                // Insert the new node and add the extracted contents
                insertNodeAtPosition(node, this.startContainer, this.startOffset);
                node.appendChild(content);

                this.selectNode(node);
            },

            cloneRange: function() {
                assertRangeValid(this);
                var range = new Range(getRangeDocument(this));
                var i = rangeProperties.length, prop;
                while (i--) {
                    prop = rangeProperties[i];
                    range[prop] = this[prop];
                }
                return range;
            },

            toString: function() {
                assertRangeValid(this);
                var sc = this.startContainer;
                if (sc === this.endContainer && isCharacterDataNode(sc)) {
                    return (sc.nodeType == 3 || sc.nodeType == 4) ? sc.data.slice(this.startOffset, this.endOffset) : "";
                } else {
                    var textParts = [], iterator = new RangeIterator(this, true);
                    iterateSubtree(iterator, function(node) {
                        // Accept only text or CDATA nodes, not comments
                        if (node.nodeType == 3 || node.nodeType == 4) {
                            textParts.push(node.data);
                        }
                    });
                    iterator.detach();
                    return textParts.join("");
                }
            },

            // The methods below are all non-standard. The following batch were introduced by Mozilla but have since
            // been removed from Mozilla.

            compareNode: function(node) {
                assertRangeValid(this);

                var parent = node.parentNode;
                var nodeIndex = getNodeIndex(node);

                if (!parent) {
                    throw new DOMException("NOT_FOUND_ERR");
                }

                var startComparison = this.comparePoint(parent, nodeIndex),
                    endComparison = this.comparePoint(parent, nodeIndex + 1);

                if (startComparison < 0) { // Node starts before
                    return (endComparison > 0) ? n_b_a : n_b;
                } else {
                    return (endComparison > 0) ? n_a : n_i;
                }
            },

            comparePoint: function(node, offset) {
                assertRangeValid(this);
                assertNode(node, "HIERARCHY_REQUEST_ERR");
                assertSameDocumentOrFragment(node, this.startContainer);

                if (comparePoints(node, offset, this.startContainer, this.startOffset) < 0) {
                    return -1;
                } else if (comparePoints(node, offset, this.endContainer, this.endOffset) > 0) {
                    return 1;
                }
                return 0;
            },

            createContextualFragment: createContextualFragment,

            toHtml: function() {
                return rangeToHtml(this);
            },

            // touchingIsIntersecting determines whether this method considers a node that borders a range intersects
            // with it (as in WebKit) or not (as in Gecko pre-1.9, and the default)
            intersectsNode: function(node, touchingIsIntersecting) {
                assertRangeValid(this);
                if (getRootContainer(node) != getRangeRoot(this)) {
                    return false;
                }

                var parent = node.parentNode, offset = getNodeIndex(node);
                if (!parent) {
                    return true;
                }

                var startComparison = comparePoints(parent, offset, this.endContainer, this.endOffset),
                    endComparison = comparePoints(parent, offset + 1, this.startContainer, this.startOffset);

                return touchingIsIntersecting ? startComparison <= 0 && endComparison >= 0 : startComparison < 0 && endComparison > 0;
            },

            isPointInRange: function(node, offset) {
                assertRangeValid(this);
                assertNode(node, "HIERARCHY_REQUEST_ERR");
                assertSameDocumentOrFragment(node, this.startContainer);

                return (comparePoints(node, offset, this.startContainer, this.startOffset) >= 0) &&
                       (comparePoints(node, offset, this.endContainer, this.endOffset) <= 0);
            },

            // The methods below are non-standard and invented by me.

            // Sharing a boundary start-to-end or end-to-start does not count as intersection.
            intersectsRange: function(range) {
                return rangesIntersect(this, range, false);
            },

            // Sharing a boundary start-to-end or end-to-start does count as intersection.
            intersectsOrTouchesRange: function(range) {
                return rangesIntersect(this, range, true);
            },

            intersection: function(range) {
                if (this.intersectsRange(range)) {
                    var startComparison = comparePoints(this.startContainer, this.startOffset, range.startContainer, range.startOffset),
                        endComparison = comparePoints(this.endContainer, this.endOffset, range.endContainer, range.endOffset);

                    var intersectionRange = this.cloneRange();
                    if (startComparison == -1) {
                        intersectionRange.setStart(range.startContainer, range.startOffset);
                    }
                    if (endComparison == 1) {
                        intersectionRange.setEnd(range.endContainer, range.endOffset);
                    }
                    return intersectionRange;
                }
                return null;
            },

            union: function(range) {
                if (this.intersectsOrTouchesRange(range)) {
                    var unionRange = this.cloneRange();
                    if (comparePoints(range.startContainer, range.startOffset, this.startContainer, this.startOffset) == -1) {
                        unionRange.setStart(range.startContainer, range.startOffset);
                    }
                    if (comparePoints(range.endContainer, range.endOffset, this.endContainer, this.endOffset) == 1) {
                        unionRange.setEnd(range.endContainer, range.endOffset);
                    }
                    return unionRange;
                } else {
                    throw new DOMException("Ranges do not intersect");
                }
            },

            containsNode: function(node, allowPartial) {
                if (allowPartial) {
                    return this.intersectsNode(node, false);
                } else {
                    return this.compareNode(node) == n_i;
                }
            },

            containsNodeContents: function(node) {
                return this.comparePoint(node, 0) >= 0 && this.comparePoint(node, getNodeLength(node)) <= 0;
            },

            containsRange: function(range) {
                var intersection = this.intersection(range);
                return intersection !== null && range.equals(intersection);
            },

            containsNodeText: function(node) {
                var nodeRange = this.cloneRange();
                nodeRange.selectNode(node);
                var textNodes = nodeRange.getNodes([3]);
                if (textNodes.length > 0) {
                    nodeRange.setStart(textNodes[0], 0);
                    var lastTextNode = textNodes.pop();
                    nodeRange.setEnd(lastTextNode, lastTextNode.length);
                    return this.containsRange(nodeRange);
                } else {
                    return this.containsNodeContents(node);
                }
            },

            getNodes: function(nodeTypes, filter) {
                assertRangeValid(this);
                return getNodesInRange(this, nodeTypes, filter);
            },

            getDocument: function() {
                return getRangeDocument(this);
            },

            collapseBefore: function(node) {
                this.setEndBefore(node);
                this.collapse(false);
            },

            collapseAfter: function(node) {
                this.setStartAfter(node);
                this.collapse(true);
            },

            getBookmark: function(containerNode) {
                var doc = getRangeDocument(this);
                var preSelectionRange = api.createRange(doc);
                containerNode = containerNode || dom.getBody(doc);
                preSelectionRange.selectNodeContents(containerNode);
                var range = this.intersection(preSelectionRange);
                var start = 0, end = 0;
                if (range) {
                    preSelectionRange.setEnd(range.startContainer, range.startOffset);
                    start = preSelectionRange.toString().length;
                    end = start + range.toString().length;
                }

                return {
                    start: start,
                    end: end,
                    containerNode: containerNode
                };
            },

            moveToBookmark: function(bookmark) {
                var containerNode = bookmark.containerNode;
                var charIndex = 0;
                this.setStart(containerNode, 0);
                this.collapse(true);
                var nodeStack = [containerNode], node, foundStart = false, stop = false;
                var nextCharIndex, i, childNodes;

                while (!stop && (node = nodeStack.pop())) {
                    if (node.nodeType == 3) {
                        nextCharIndex = charIndex + node.length;
                        if (!foundStart && bookmark.start >= charIndex && bookmark.start <= nextCharIndex) {
                            this.setStart(node, bookmark.start - charIndex);
                            foundStart = true;
                        }
                        if (foundStart && bookmark.end >= charIndex && bookmark.end <= nextCharIndex) {
                            this.setEnd(node, bookmark.end - charIndex);
                            stop = true;
                        }
                        charIndex = nextCharIndex;
                    } else {
                        childNodes = node.childNodes;
                        i = childNodes.length;
                        while (i--) {
                            nodeStack.push(childNodes[i]);
                        }
                    }
                }
            },

            getName: function() {
                return "DomRange";
            },

            equals: function(range) {
                return Range.rangesEqual(this, range);
            },

            isValid: function() {
                return isRangeValid(this);
            },

            inspect: function() {
                return inspect(this);
            },

            detach: function() {
                // In DOM4, detach() is now a no-op.
            }
        });

        function copyComparisonConstantsToObject(obj) {
            obj.START_TO_START = s2s;
            obj.START_TO_END = s2e;
            obj.END_TO_END = e2e;
            obj.END_TO_START = e2s;

            obj.NODE_BEFORE = n_b;
            obj.NODE_AFTER = n_a;
            obj.NODE_BEFORE_AND_AFTER = n_b_a;
            obj.NODE_INSIDE = n_i;
        }

        function copyComparisonConstants(constructor) {
            copyComparisonConstantsToObject(constructor);
            copyComparisonConstantsToObject(constructor.prototype);
        }

        function createRangeContentRemover(remover, boundaryUpdater) {
            return function() {
                assertRangeValid(this);

                var sc = this.startContainer, so = this.startOffset, root = this.commonAncestorContainer;

                var iterator = new RangeIterator(this, true);

                // Work out where to position the range after content removal
                var node, boundary;
                if (sc !== root) {
                    node = getClosestAncestorIn(sc, root, true);
                    boundary = getBoundaryAfterNode(node);
                    sc = boundary.node;
                    so = boundary.offset;
                }

                // Check none of the range is read-only
                iterateSubtree(iterator, assertNodeNotReadOnly);

                iterator.reset();

                // Remove the content
                var returnValue = remover(iterator);
                iterator.detach();

                // Move to the new position
                boundaryUpdater(this, sc, so, sc, so);

                return returnValue;
            };
        }

        function createPrototypeRange(constructor, boundaryUpdater) {
            function createBeforeAfterNodeSetter(isBefore, isStart) {
                return function(node) {
                    assertValidNodeType(node, beforeAfterNodeTypes);
                    assertValidNodeType(getRootContainer(node), rootContainerNodeTypes);

                    var boundary = (isBefore ? getBoundaryBeforeNode : getBoundaryAfterNode)(node);
                    (isStart ? setRangeStart : setRangeEnd)(this, boundary.node, boundary.offset);
                };
            }

            function setRangeStart(range, node, offset) {
                var ec = range.endContainer, eo = range.endOffset;
                if (node !== range.startContainer || offset !== range.startOffset) {
                    // Check the root containers of the range and the new boundary, and also check whether the new boundary
                    // is after the current end. In either case, collapse the range to the new position
                    if (getRootContainer(node) != getRootContainer(ec) || comparePoints(node, offset, ec, eo) == 1) {
                        ec = node;
                        eo = offset;
                    }
                    boundaryUpdater(range, node, offset, ec, eo);
                }
            }

            function setRangeEnd(range, node, offset) {
                var sc = range.startContainer, so = range.startOffset;
                if (node !== range.endContainer || offset !== range.endOffset) {
                    // Check the root containers of the range and the new boundary, and also check whether the new boundary
                    // is after the current end. In either case, collapse the range to the new position
                    if (getRootContainer(node) != getRootContainer(sc) || comparePoints(node, offset, sc, so) == -1) {
                        sc = node;
                        so = offset;
                    }
                    boundaryUpdater(range, sc, so, node, offset);
                }
            }

            // Set up inheritance
            var F = function() {};
            F.prototype = api.rangePrototype;
            constructor.prototype = new F();

            util.extend(constructor.prototype, {
                setStart: function(node, offset) {
                    assertNoDocTypeNotationEntityAncestor(node, true);
                    assertValidOffset(node, offset);

                    setRangeStart(this, node, offset);
                },

                setEnd: function(node, offset) {
                    assertNoDocTypeNotationEntityAncestor(node, true);
                    assertValidOffset(node, offset);

                    setRangeEnd(this, node, offset);
                },

                /**
                 * Convenience method to set a range's start and end boundaries. Overloaded as follows:
                 * - Two parameters (node, offset) creates a collapsed range at that position
                 * - Three parameters (node, startOffset, endOffset) creates a range contained with node starting at
                 *   startOffset and ending at endOffset
                 * - Four parameters (startNode, startOffset, endNode, endOffset) creates a range starting at startOffset in
                 *   startNode and ending at endOffset in endNode
                 */
                setStartAndEnd: function() {
                    var args = arguments;
                    var sc = args[0], so = args[1], ec = sc, eo = so;

                    switch (args.length) {
                        case 3:
                            eo = args[2];
                            break;
                        case 4:
                            ec = args[2];
                            eo = args[3];
                            break;
                    }

                    boundaryUpdater(this, sc, so, ec, eo);
                },

                setBoundary: function(node, offset, isStart) {
                    this["set" + (isStart ? "Start" : "End")](node, offset);
                },

                setStartBefore: createBeforeAfterNodeSetter(true, true),
                setStartAfter: createBeforeAfterNodeSetter(false, true),
                setEndBefore: createBeforeAfterNodeSetter(true, false),
                setEndAfter: createBeforeAfterNodeSetter(false, false),

                collapse: function(isStart) {
                    assertRangeValid(this);
                    if (isStart) {
                        boundaryUpdater(this, this.startContainer, this.startOffset, this.startContainer, this.startOffset);
                    } else {
                        boundaryUpdater(this, this.endContainer, this.endOffset, this.endContainer, this.endOffset);
                    }
                },

                selectNodeContents: function(node) {
                    assertNoDocTypeNotationEntityAncestor(node, true);

                    boundaryUpdater(this, node, 0, node, getNodeLength(node));
                },

                selectNode: function(node) {
                    assertNoDocTypeNotationEntityAncestor(node, false);
                    assertValidNodeType(node, beforeAfterNodeTypes);

                    var start = getBoundaryBeforeNode(node), end = getBoundaryAfterNode(node);
                    boundaryUpdater(this, start.node, start.offset, end.node, end.offset);
                },

                extractContents: createRangeContentRemover(extractSubtree, boundaryUpdater),

                deleteContents: createRangeContentRemover(deleteSubtree, boundaryUpdater),

                canSurroundContents: function() {
                    assertRangeValid(this);
                    assertNodeNotReadOnly(this.startContainer);
                    assertNodeNotReadOnly(this.endContainer);

                    // Check if the contents can be surrounded. Specifically, this means whether the range partially selects
                    // no non-text nodes.
                    var iterator = new RangeIterator(this, true);
                    var boundariesInvalid = (iterator._first && isNonTextPartiallySelected(iterator._first, this) ||
                            (iterator._last && isNonTextPartiallySelected(iterator._last, this)));
                    iterator.detach();
                    return !boundariesInvalid;
                },

                splitBoundaries: function() {
                    splitRangeBoundaries(this);
                },

                splitBoundariesPreservingPositions: function(positionsToPreserve) {
                    splitRangeBoundaries(this, positionsToPreserve);
                },

                normalizeBoundaries: function() {
                    assertRangeValid(this);

                    var sc = this.startContainer, so = this.startOffset, ec = this.endContainer, eo = this.endOffset;

                    var mergeForward = function(node) {
                        var sibling = node.nextSibling;
                        if (sibling && sibling.nodeType == node.nodeType) {
                            ec = node;
                            eo = node.length;
                            node.appendData(sibling.data);
                            removeNode(sibling);
                        }
                    };

                    var mergeBackward = function(node) {
                        var sibling = node.previousSibling;
                        if (sibling && sibling.nodeType == node.nodeType) {
                            sc = node;
                            var nodeLength = node.length;
                            so = sibling.length;
                            node.insertData(0, sibling.data);
                            removeNode(sibling);
                            if (sc == ec) {
                                eo += so;
                                ec = sc;
                            } else if (ec == node.parentNode) {
                                var nodeIndex = getNodeIndex(node);
                                if (eo == nodeIndex) {
                                    ec = node;
                                    eo = nodeLength;
                                } else if (eo > nodeIndex) {
                                    eo--;
                                }
                            }
                        }
                    };

                    var normalizeStart = true;
                    var sibling;

                    if (isCharacterDataNode(ec)) {
                        if (eo == ec.length) {
                            mergeForward(ec);
                        } else if (eo == 0) {
                            sibling = ec.previousSibling;
                            if (sibling && sibling.nodeType == ec.nodeType) {
                                eo = sibling.length;
                                if (sc == ec) {
                                    normalizeStart = false;
                                }
                                sibling.appendData(ec.data);
                                removeNode(ec);
                                ec = sibling;
                            }
                        }
                    } else {
                        if (eo > 0) {
                            var endNode = ec.childNodes[eo - 1];
                            if (endNode && isCharacterDataNode(endNode)) {
                                mergeForward(endNode);
                            }
                        }
                        normalizeStart = !this.collapsed;
                    }

                    if (normalizeStart) {
                        if (isCharacterDataNode(sc)) {
                            if (so == 0) {
                                mergeBackward(sc);
                            } else if (so == sc.length) {
                                sibling = sc.nextSibling;
                                if (sibling && sibling.nodeType == sc.nodeType) {
                                    if (ec == sibling) {
                                        ec = sc;
                                        eo += sc.length;
                                    }
                                    sc.appendData(sibling.data);
                                    removeNode(sibling);
                                }
                            }
                        } else {
                            if (so < sc.childNodes.length) {
                                var startNode = sc.childNodes[so];
                                if (startNode && isCharacterDataNode(startNode)) {
                                    mergeBackward(startNode);
                                }
                            }
                        }
                    } else {
                        sc = ec;
                        so = eo;
                    }

                    boundaryUpdater(this, sc, so, ec, eo);
                },

                collapseToPoint: function(node, offset) {
                    assertNoDocTypeNotationEntityAncestor(node, true);
                    assertValidOffset(node, offset);
                    this.setStartAndEnd(node, offset);
                }
            });

            copyComparisonConstants(constructor);
        }

        /*----------------------------------------------------------------------------------------------------------------*/

        // Updates commonAncestorContainer and collapsed after boundary change
        function updateCollapsedAndCommonAncestor(range) {
            range.collapsed = (range.startContainer === range.endContainer && range.startOffset === range.endOffset);
            range.commonAncestorContainer = range.collapsed ?
                range.startContainer : dom.getCommonAncestor(range.startContainer, range.endContainer);
        }

        function updateBoundaries(range, startContainer, startOffset, endContainer, endOffset) {
            range.startContainer = startContainer;
            range.startOffset = startOffset;
            range.endContainer = endContainer;
            range.endOffset = endOffset;
            range.document = dom.getDocument(startContainer);

            updateCollapsedAndCommonAncestor(range);
        }

        function Range(doc) {
            this.startContainer = doc;
            this.startOffset = 0;
            this.endContainer = doc;
            this.endOffset = 0;
            this.document = doc;
            updateCollapsedAndCommonAncestor(this);
        }

        createPrototypeRange(Range, updateBoundaries);

        util.extend(Range, {
            rangeProperties: rangeProperties,
            RangeIterator: RangeIterator,
            copyComparisonConstants: copyComparisonConstants,
            createPrototypeRange: createPrototypeRange,
            inspect: inspect,
            toHtml: rangeToHtml,
            getRangeDocument: getRangeDocument,
            rangesEqual: function(r1, r2) {
                return r1.startContainer === r2.startContainer &&
                    r1.startOffset === r2.startOffset &&
                    r1.endContainer === r2.endContainer &&
                    r1.endOffset === r2.endOffset;
            }
        });

        api.DomRange = Range;
    });

    /*----------------------------------------------------------------------------------------------------------------*/

    // Wrappers for the browser's native DOM Range and/or TextRange implementation
    api.createCoreModule("WrappedRange", ["DomRange"], function(api, module) {
        var WrappedRange, WrappedTextRange;
        var dom = api.dom;
        var util = api.util;
        var DomPosition = dom.DomPosition;
        var DomRange = api.DomRange;
        var getBody = dom.getBody;
        var getContentDocument = dom.getContentDocument;
        var isCharacterDataNode = dom.isCharacterDataNode;


        /*----------------------------------------------------------------------------------------------------------------*/

        if (api.features.implementsDomRange) {
            // This is a wrapper around the browser's native DOM Range. It has two aims:
            // - Provide workarounds for specific browser bugs
            // - provide convenient extensions, which are inherited from Rangy's DomRange

            (function() {
                var rangeProto;
                var rangeProperties = DomRange.rangeProperties;

                function updateRangeProperties(range) {
                    var i = rangeProperties.length, prop;
                    while (i--) {
                        prop = rangeProperties[i];
                        range[prop] = range.nativeRange[prop];
                    }
                    // Fix for broken collapsed property in IE 9.
                    range.collapsed = (range.startContainer === range.endContainer && range.startOffset === range.endOffset);
                }

                function updateNativeRange(range, startContainer, startOffset, endContainer, endOffset) {
                    var startMoved = (range.startContainer !== startContainer || range.startOffset != startOffset);
                    var endMoved = (range.endContainer !== endContainer || range.endOffset != endOffset);
                    var nativeRangeDifferent = !range.equals(range.nativeRange);

                    // Always set both boundaries for the benefit of IE9 (see issue 35)
                    if (startMoved || endMoved || nativeRangeDifferent) {
                        range.setEnd(endContainer, endOffset);
                        range.setStart(startContainer, startOffset);
                    }
                }

                var createBeforeAfterNodeSetter;

                WrappedRange = function(range) {
                    if (!range) {
                        throw module.createError("WrappedRange: Range must be specified");
                    }
                    this.nativeRange = range;
                    updateRangeProperties(this);
                };

                DomRange.createPrototypeRange(WrappedRange, updateNativeRange);

                rangeProto = WrappedRange.prototype;

                rangeProto.selectNode = function(node) {
                    this.nativeRange.selectNode(node);
                    updateRangeProperties(this);
                };

                rangeProto.cloneContents = function() {
                    return this.nativeRange.cloneContents();
                };

                // Due to a long-standing Firefox bug that I have not been able to find a reliable way to detect,
                // insertNode() is never delegated to the native range.

                rangeProto.surroundContents = function(node) {
                    this.nativeRange.surroundContents(node);
                    updateRangeProperties(this);
                };

                rangeProto.collapse = function(isStart) {
                    this.nativeRange.collapse(isStart);
                    updateRangeProperties(this);
                };

                rangeProto.cloneRange = function() {
                    return new WrappedRange(this.nativeRange.cloneRange());
                };

                rangeProto.refresh = function() {
                    updateRangeProperties(this);
                };

                rangeProto.toString = function() {
                    return this.nativeRange.toString();
                };

                // Create test range and node for feature detection

                var testTextNode = document.createTextNode("test");
                getBody(document).appendChild(testTextNode);
                var range = document.createRange();

                /*--------------------------------------------------------------------------------------------------------*/

                // Test for Firefox 2 bug that prevents moving the start of a Range to a point after its current end and
                // correct for it

                range.setStart(testTextNode, 0);
                range.setEnd(testTextNode, 0);

                try {
                    range.setStart(testTextNode, 1);

                    rangeProto.setStart = function(node, offset) {
                        this.nativeRange.setStart(node, offset);
                        updateRangeProperties(this);
                    };

                    rangeProto.setEnd = function(node, offset) {
                        this.nativeRange.setEnd(node, offset);
                        updateRangeProperties(this);
                    };

                    createBeforeAfterNodeSetter = function(name) {
                        return function(node) {
                            this.nativeRange[name](node);
                            updateRangeProperties(this);
                        };
                    };

                } catch(ex) {

                    rangeProto.setStart = function(node, offset) {
                        try {
                            this.nativeRange.setStart(node, offset);
                        } catch (ex) {
                            this.nativeRange.setEnd(node, offset);
                            this.nativeRange.setStart(node, offset);
                        }
                        updateRangeProperties(this);
                    };

                    rangeProto.setEnd = function(node, offset) {
                        try {
                            this.nativeRange.setEnd(node, offset);
                        } catch (ex) {
                            this.nativeRange.setStart(node, offset);
                            this.nativeRange.setEnd(node, offset);
                        }
                        updateRangeProperties(this);
                    };

                    createBeforeAfterNodeSetter = function(name, oppositeName) {
                        return function(node) {
                            try {
                                this.nativeRange[name](node);
                            } catch (ex) {
                                this.nativeRange[oppositeName](node);
                                this.nativeRange[name](node);
                            }
                            updateRangeProperties(this);
                        };
                    };
                }

                rangeProto.setStartBefore = createBeforeAfterNodeSetter("setStartBefore", "setEndBefore");
                rangeProto.setStartAfter = createBeforeAfterNodeSetter("setStartAfter", "setEndAfter");
                rangeProto.setEndBefore = createBeforeAfterNodeSetter("setEndBefore", "setStartBefore");
                rangeProto.setEndAfter = createBeforeAfterNodeSetter("setEndAfter", "setStartAfter");

                /*--------------------------------------------------------------------------------------------------------*/

                // Always use DOM4-compliant selectNodeContents implementation: it's simpler and less code than testing
                // whether the native implementation can be trusted
                rangeProto.selectNodeContents = function(node) {
                    this.setStartAndEnd(node, 0, dom.getNodeLength(node));
                };

                /*--------------------------------------------------------------------------------------------------------*/

                // Test for and correct WebKit bug that has the behaviour of compareBoundaryPoints round the wrong way for
                // constants START_TO_END and END_TO_START: https://bugs.webkit.org/show_bug.cgi?id=20738

                range.selectNodeContents(testTextNode);
                range.setEnd(testTextNode, 3);

                var range2 = document.createRange();
                range2.selectNodeContents(testTextNode);
                range2.setEnd(testTextNode, 4);
                range2.setStart(testTextNode, 2);

                if (range.compareBoundaryPoints(range.START_TO_END, range2) == -1 &&
                        range.compareBoundaryPoints(range.END_TO_START, range2) == 1) {
                    // This is the wrong way round, so correct for it

                    rangeProto.compareBoundaryPoints = function(type, range) {
                        range = range.nativeRange || range;
                        if (type == range.START_TO_END) {
                            type = range.END_TO_START;
                        } else if (type == range.END_TO_START) {
                            type = range.START_TO_END;
                        }
                        return this.nativeRange.compareBoundaryPoints(type, range);
                    };
                } else {
                    rangeProto.compareBoundaryPoints = function(type, range) {
                        return this.nativeRange.compareBoundaryPoints(type, range.nativeRange || range);
                    };
                }

                /*--------------------------------------------------------------------------------------------------------*/

                // Test for IE deleteContents() and extractContents() bug and correct it. See issue 107.

                var el = document.createElement("div");
                el.innerHTML = "123";
                var textNode = el.firstChild;
                var body = getBody(document);
                body.appendChild(el);

                range.setStart(textNode, 1);
                range.setEnd(textNode, 2);
                range.deleteContents();

                if (textNode.data == "13") {
                    // Behaviour is correct per DOM4 Range so wrap the browser's implementation of deleteContents() and
                    // extractContents()
                    rangeProto.deleteContents = function() {
                        this.nativeRange.deleteContents();
                        updateRangeProperties(this);
                    };

                    rangeProto.extractContents = function() {
                        var frag = this.nativeRange.extractContents();
                        updateRangeProperties(this);
                        return frag;
                    };
                } else {
                }

                body.removeChild(el);
                body = null;

                /*--------------------------------------------------------------------------------------------------------*/

                // Test for existence of createContextualFragment and delegate to it if it exists
                if (util.isHostMethod(range, "createContextualFragment")) {
                    rangeProto.createContextualFragment = function(fragmentStr) {
                        return this.nativeRange.createContextualFragment(fragmentStr);
                    };
                }

                /*--------------------------------------------------------------------------------------------------------*/

                // Clean up
                getBody(document).removeChild(testTextNode);

                rangeProto.getName = function() {
                    return "WrappedRange";
                };

                api.WrappedRange = WrappedRange;

                api.createNativeRange = function(doc) {
                    doc = getContentDocument(doc, module, "createNativeRange");
                    return doc.createRange();
                };
            })();
        }

        if (api.features.implementsTextRange) {
            /*
            This is a workaround for a bug where IE returns the wrong container element from the TextRange's parentElement()
            method. For example, in the following (where pipes denote the selection boundaries):

            <ul id="ul"><li id="a">| a </li><li id="b"> b |</li></ul>

            var range = document.selection.createRange();
            alert(range.parentElement().id); // Should alert "ul" but alerts "b"

            This method returns the common ancestor node of the following:
            - the parentElement() of the textRange
            - the parentElement() of the textRange after calling collapse(true)
            - the parentElement() of the textRange after calling collapse(false)
            */
            var getTextRangeContainerElement = function(textRange) {
                var parentEl = textRange.parentElement();
                var range = textRange.duplicate();
                range.collapse(true);
                var startEl = range.parentElement();
                range = textRange.duplicate();
                range.collapse(false);
                var endEl = range.parentElement();
                var startEndContainer = (startEl == endEl) ? startEl : dom.getCommonAncestor(startEl, endEl);

                return startEndContainer == parentEl ? startEndContainer : dom.getCommonAncestor(parentEl, startEndContainer);
            };

            var textRangeIsCollapsed = function(textRange) {
                return textRange.compareEndPoints("StartToEnd", textRange) == 0;
            };

            // Gets the boundary of a TextRange expressed as a node and an offset within that node. This function started
            // out as an improved version of code found in Tim Cameron Ryan's IERange (http://code.google.com/p/ierange/)
            // but has grown, fixing problems with line breaks in preformatted text, adding workaround for IE TextRange
            // bugs, handling for inputs and images, plus optimizations.
            var getTextRangeBoundaryPosition = function(textRange, wholeRangeContainerElement, isStart, isCollapsed, startInfo) {
                var workingRange = textRange.duplicate();
                workingRange.collapse(isStart);
                var containerElement = workingRange.parentElement();

                // Sometimes collapsing a TextRange that's at the start of a text node can move it into the previous node, so
                // check for that
                if (!dom.isOrIsAncestorOf(wholeRangeContainerElement, containerElement)) {
                    containerElement = wholeRangeContainerElement;
                }


                // Deal with nodes that cannot "contain rich HTML markup". In practice, this means form inputs, images and
                // similar. See http://msdn.microsoft.com/en-us/library/aa703950%28VS.85%29.aspx
                if (!containerElement.canHaveHTML) {
                    var pos = new DomPosition(containerElement.parentNode, dom.getNodeIndex(containerElement));
                    return {
                        boundaryPosition: pos,
                        nodeInfo: {
                            nodeIndex: pos.offset,
                            containerElement: pos.node
                        }
                    };
                }

                var workingNode = dom.getDocument(containerElement).createElement("span");

                // Workaround for HTML5 Shiv's insane violation of document.createElement(). See Rangy issue 104 and HTML5
                // Shiv issue 64: https://github.com/aFarkas/html5shiv/issues/64
                if (workingNode.parentNode) {
                    dom.removeNode(workingNode);
                }

                var comparison, workingComparisonType = isStart ? "StartToStart" : "StartToEnd";
                var previousNode, nextNode, boundaryPosition, boundaryNode;
                var start = (startInfo && startInfo.containerElement == containerElement) ? startInfo.nodeIndex : 0;
                var childNodeCount = containerElement.childNodes.length;
                var end = childNodeCount;

                // Check end first. Code within the loop assumes that the endth child node of the container is definitely
                // after the range boundary.
                var nodeIndex = end;

                while (true) {
                    if (nodeIndex == childNodeCount) {
                        containerElement.appendChild(workingNode);
                    } else {
                        containerElement.insertBefore(workingNode, containerElement.childNodes[nodeIndex]);
                    }
                    workingRange.moveToElementText(workingNode);
                    comparison = workingRange.compareEndPoints(workingComparisonType, textRange);
                    if (comparison == 0 || start == end) {
                        break;
                    } else if (comparison == -1) {
                        if (end == start + 1) {
                            // We know the endth child node is after the range boundary, so we must be done.
                            break;
                        } else {
                            start = nodeIndex;
                        }
                    } else {
                        end = (end == start + 1) ? start : nodeIndex;
                    }
                    nodeIndex = Math.floor((start + end) / 2);
                    containerElement.removeChild(workingNode);
                }


                // We've now reached or gone past the boundary of the text range we're interested in
                // so have identified the node we want
                boundaryNode = workingNode.nextSibling;

                if (comparison == -1 && boundaryNode && isCharacterDataNode(boundaryNode)) {
                    // This is a character data node (text, comment, cdata). The working range is collapsed at the start of
                    // the node containing the text range's boundary, so we move the end of the working range to the
                    // boundary point and measure the length of its text to get the boundary's offset within the node.
                    workingRange.setEndPoint(isStart ? "EndToStart" : "EndToEnd", textRange);

                    var offset;

                    if (/[\r\n]/.test(boundaryNode.data)) {
                        /*
                        For the particular case of a boundary within a text node containing rendered line breaks (within a
                        <pre> element, for example), we need a slightly complicated approach to get the boundary's offset in
                        IE. The facts:

                        - Each line break is represented as \r in the text node's data/nodeValue properties
                        - Each line break is represented as \r\n in the TextRange's 'text' property
                        - The 'text' property of the TextRange does not contain trailing line breaks

                        To get round the problem presented by the final fact above, we can use the fact that TextRange's
                        moveStart() and moveEnd() methods return the actual number of characters moved, which is not
                        necessarily the same as the number of characters it was instructed to move. The simplest approach is
                        to use this to store the characters moved when moving both the start and end of the range to the
                        start of the document body and subtracting the start offset from the end offset (the
                        "move-negative-gazillion" method). However, this is extremely slow when the document is large and
                        the range is near the end of it. Clearly doing the mirror image (i.e. moving the range boundaries to
                        the end of the document) has the same problem.

                        Another approach that works is to use moveStart() to move the start boundary of the range up to the
                        end boundary one character at a time and incrementing a counter with the value returned by the
                        moveStart() call. However, the check for whether the start boundary has reached the end boundary is
                        expensive, so this method is slow (although unlike "move-negative-gazillion" is largely unaffected
                        by the location of the range within the document).

                        The approach used below is a hybrid of the two methods above. It uses the fact that a string
                        containing the TextRange's 'text' property with each \r\n converted to a single \r character cannot
                        be longer than the text of the TextRange, so the start of the range is moved that length initially
                        and then a character at a time to make up for any trailing line breaks not contained in the 'text'
                        property. This has good performance in most situations compared to the previous two methods.
                        */
                        var tempRange = workingRange.duplicate();
                        var rangeLength = tempRange.text.replace(/\r\n/g, "\r").length;

                        offset = tempRange.moveStart("character", rangeLength);
                        while ( (comparison = tempRange.compareEndPoints("StartToEnd", tempRange)) == -1) {
                            offset++;
                            tempRange.moveStart("character", 1);
                        }
                    } else {
                        offset = workingRange.text.length;
                    }
                    boundaryPosition = new DomPosition(boundaryNode, offset);
                } else {

                    // If the boundary immediately follows a character data node and this is the end boundary, we should favour
                    // a position within that, and likewise for a start boundary preceding a character data node
                    previousNode = (isCollapsed || !isStart) && workingNode.previousSibling;
                    nextNode = (isCollapsed || isStart) && workingNode.nextSibling;
                    if (nextNode && isCharacterDataNode(nextNode)) {
                        boundaryPosition = new DomPosition(nextNode, 0);
                    } else if (previousNode && isCharacterDataNode(previousNode)) {
                        boundaryPosition = new DomPosition(previousNode, previousNode.data.length);
                    } else {
                        boundaryPosition = new DomPosition(containerElement, dom.getNodeIndex(workingNode));
                    }
                }

                // Clean up
                dom.removeNode(workingNode);

                return {
                    boundaryPosition: boundaryPosition,
                    nodeInfo: {
                        nodeIndex: nodeIndex,
                        containerElement: containerElement
                    }
                };
            };

            // Returns a TextRange representing the boundary of a TextRange expressed as a node and an offset within that
            // node. This function started out as an optimized version of code found in Tim Cameron Ryan's IERange
            // (http://code.google.com/p/ierange/)
            var createBoundaryTextRange = function(boundaryPosition, isStart) {
                var boundaryNode, boundaryParent, boundaryOffset = boundaryPosition.offset;
                var doc = dom.getDocument(boundaryPosition.node);
                var workingNode, childNodes, workingRange = getBody(doc).createTextRange();
                var nodeIsDataNode = isCharacterDataNode(boundaryPosition.node);

                if (nodeIsDataNode) {
                    boundaryNode = boundaryPosition.node;
                    boundaryParent = boundaryNode.parentNode;
                } else {
                    childNodes = boundaryPosition.node.childNodes;
                    boundaryNode = (boundaryOffset < childNodes.length) ? childNodes[boundaryOffset] : null;
                    boundaryParent = boundaryPosition.node;
                }

                // Position the range immediately before the node containing the boundary
                workingNode = doc.createElement("span");

                // Making the working element non-empty element persuades IE to consider the TextRange boundary to be within
                // the element rather than immediately before or after it
                workingNode.innerHTML = "&#feff;";

                // insertBefore is supposed to work like appendChild if the second parameter is null. However, a bug report
                // for IERange suggests that it can crash the browser: http://code.google.com/p/ierange/issues/detail?id=12
                if (boundaryNode) {
                    boundaryParent.insertBefore(workingNode, boundaryNode);
                } else {
                    boundaryParent.appendChild(workingNode);
                }

                workingRange.moveToElementText(workingNode);
                workingRange.collapse(!isStart);

                // Clean up
                boundaryParent.removeChild(workingNode);

                // Move the working range to the text offset, if required
                if (nodeIsDataNode) {
                    workingRange[isStart ? "moveStart" : "moveEnd"]("character", boundaryOffset);
                }

                return workingRange;
            };

            /*------------------------------------------------------------------------------------------------------------*/

            // This is a wrapper around a TextRange, providing full DOM Range functionality using rangy's DomRange as a
            // prototype

            WrappedTextRange = function(textRange) {
                this.textRange = textRange;
                this.refresh();
            };

            WrappedTextRange.prototype = new DomRange(document);

            WrappedTextRange.prototype.refresh = function() {
                var start, end, startBoundary;

                // TextRange's parentElement() method cannot be trusted. getTextRangeContainerElement() works around that.
                var rangeContainerElement = getTextRangeContainerElement(this.textRange);

                if (textRangeIsCollapsed(this.textRange)) {
                    end = start = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, true,
                        true).boundaryPosition;
                } else {
                    startBoundary = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, true, false);
                    start = startBoundary.boundaryPosition;

                    // An optimization used here is that if the start and end boundaries have the same parent element, the
                    // search scope for the end boundary can be limited to exclude the portion of the element that precedes
                    // the start boundary
                    end = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, false, false,
                        startBoundary.nodeInfo).boundaryPosition;
                }

                this.setStart(start.node, start.offset);
                this.setEnd(end.node, end.offset);
            };

            WrappedTextRange.prototype.getName = function() {
                return "WrappedTextRange";
            };

            DomRange.copyComparisonConstants(WrappedTextRange);

            var rangeToTextRange = function(range) {
                if (range.collapsed) {
                    return createBoundaryTextRange(new DomPosition(range.startContainer, range.startOffset), true);
                } else {
                    var startRange = createBoundaryTextRange(new DomPosition(range.startContainer, range.startOffset), true);
                    var endRange = createBoundaryTextRange(new DomPosition(range.endContainer, range.endOffset), false);
                    var textRange = getBody( DomRange.getRangeDocument(range) ).createTextRange();
                    textRange.setEndPoint("StartToStart", startRange);
                    textRange.setEndPoint("EndToEnd", endRange);
                    return textRange;
                }
            };

            WrappedTextRange.rangeToTextRange = rangeToTextRange;

            WrappedTextRange.prototype.toTextRange = function() {
                return rangeToTextRange(this);
            };

            api.WrappedTextRange = WrappedTextRange;

            // IE 9 and above have both implementations and Rangy makes both available. The next few lines sets which
            // implementation to use by default.
            if (!api.features.implementsDomRange || api.config.preferTextRange) {
                // Add WrappedTextRange as the Range property of the global object to allow expression like Range.END_TO_END to work
                var globalObj = (function(f) { return f("return this;")(); })(Function);
                if (typeof globalObj.Range == "undefined") {
                    globalObj.Range = WrappedTextRange;
                }

                api.createNativeRange = function(doc) {
                    doc = getContentDocument(doc, module, "createNativeRange");
                    return getBody(doc).createTextRange();
                };

                api.WrappedRange = WrappedTextRange;
            }
        }

        api.createRange = function(doc) {
            doc = getContentDocument(doc, module, "createRange");
            return new api.WrappedRange(api.createNativeRange(doc));
        };

        api.createRangyRange = function(doc) {
            doc = getContentDocument(doc, module, "createRangyRange");
            return new DomRange(doc);
        };

        util.createAliasForDeprecatedMethod(api, "createIframeRange", "createRange");
        util.createAliasForDeprecatedMethod(api, "createIframeRangyRange", "createRangyRange");

        api.addShimListener(function(win) {
            var doc = win.document;
            if (typeof doc.createRange == "undefined") {
                doc.createRange = function() {
                    return api.createRange(doc);
                };
            }
            doc = win = null;
        });
    });

    /*----------------------------------------------------------------------------------------------------------------*/

    // This module creates a selection object wrapper that conforms as closely as possible to the Selection specification
    // in the HTML Editing spec (http://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#selections)
    api.createCoreModule("WrappedSelection", ["DomRange", "WrappedRange"], function(api, module) {
        api.config.checkSelectionRanges = true;

        var BOOLEAN = "boolean";
        var NUMBER = "number";
        var dom = api.dom;
        var util = api.util;
        var isHostMethod = util.isHostMethod;
        var DomRange = api.DomRange;
        var WrappedRange = api.WrappedRange;
        var DOMException = api.DOMException;
        var DomPosition = dom.DomPosition;
        var getNativeSelection;
        var selectionIsCollapsed;
        var features = api.features;
        var CONTROL = "Control";
        var getDocument = dom.getDocument;
        var getBody = dom.getBody;
        var rangesEqual = DomRange.rangesEqual;


        // Utility function to support direction parameters in the API that may be a string ("backward", "backwards",
        // "forward" or "forwards") or a Boolean (true for backwards).
        function isDirectionBackward(dir) {
            return (typeof dir == "string") ? /^backward(s)?$/i.test(dir) : !!dir;
        }

        function getWindow(win, methodName) {
            if (!win) {
                return window;
            } else if (dom.isWindow(win)) {
                return win;
            } else if (win instanceof WrappedSelection) {
                return win.win;
            } else {
                var doc = dom.getContentDocument(win, module, methodName);
                return dom.getWindow(doc);
            }
        }

        function getWinSelection(winParam) {
            return getWindow(winParam, "getWinSelection").getSelection();
        }

        function getDocSelection(winParam) {
            return getWindow(winParam, "getDocSelection").document.selection;
        }

        function winSelectionIsBackward(sel) {
            var backward = false;
            if (sel.anchorNode) {
                backward = (dom.comparePoints(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset) == 1);
            }
            return backward;
        }

        // Test for the Range/TextRange and Selection features required
        // Test for ability to retrieve selection
        var implementsWinGetSelection = isHostMethod(window, "getSelection"),
            implementsDocSelection = util.isHostObject(document, "selection");

        features.implementsWinGetSelection = implementsWinGetSelection;
        features.implementsDocSelection = implementsDocSelection;

        var useDocumentSelection = implementsDocSelection && (!implementsWinGetSelection || api.config.preferTextRange);

        if (useDocumentSelection) {
            getNativeSelection = getDocSelection;
            api.isSelectionValid = function(winParam) {
                var doc = getWindow(winParam, "isSelectionValid").document, nativeSel = doc.selection;

                // Check whether the selection TextRange is actually contained within the correct document
                return (nativeSel.type != "None" || getDocument(nativeSel.createRange().parentElement()) == doc);
            };
        } else if (implementsWinGetSelection) {
            getNativeSelection = getWinSelection;
            api.isSelectionValid = function() {
                return true;
            };
        } else {
            module.fail("Neither document.selection or window.getSelection() detected.");
            return false;
        }

        api.getNativeSelection = getNativeSelection;

        var testSelection = getNativeSelection();

        // In Firefox, the selection is null in an iframe with display: none. See issue #138.
        if (!testSelection) {
            module.fail("Native selection was null (possibly issue 138?)");
            return false;
        }

        var testRange = api.createNativeRange(document);
        var body = getBody(document);

        // Obtaining a range from a selection
        var selectionHasAnchorAndFocus = util.areHostProperties(testSelection,
            ["anchorNode", "focusNode", "anchorOffset", "focusOffset"]);

        features.selectionHasAnchorAndFocus = selectionHasAnchorAndFocus;

        // Test for existence of native selection extend() method
        var selectionHasExtend = isHostMethod(testSelection, "extend");
        features.selectionHasExtend = selectionHasExtend;

        // Test if rangeCount exists
        var selectionHasRangeCount = (typeof testSelection.rangeCount == NUMBER);
        features.selectionHasRangeCount = selectionHasRangeCount;

        var selectionSupportsMultipleRanges = false;
        var collapsedNonEditableSelectionsSupported = true;

        var addRangeBackwardToNative = selectionHasExtend ?
            function(nativeSelection, range) {
                var doc = DomRange.getRangeDocument(range);
                var endRange = api.createRange(doc);
                endRange.collapseToPoint(range.endContainer, range.endOffset);
                nativeSelection.addRange(getNativeRange(endRange));
                nativeSelection.extend(range.startContainer, range.startOffset);
            } : null;

        if (util.areHostMethods(testSelection, ["addRange", "getRangeAt", "removeAllRanges"]) &&
                typeof testSelection.rangeCount == NUMBER && features.implementsDomRange) {

            (function() {
                // Previously an iframe was used but this caused problems in some circumstances in IE, so tests are
                // performed on the current document's selection. See issue 109.

                // Note also that if a selection previously existed, it is wiped and later restored by these tests. This
                // will result in the selection direction begin reversed if the original selection was backwards and the
                // browser does not support setting backwards selections (Internet Explorer, I'm looking at you).
                var sel = window.getSelection();
                if (sel) {
                    // Store the current selection
                    var originalSelectionRangeCount = sel.rangeCount;
                    var selectionHasMultipleRanges = (originalSelectionRangeCount > 1);
                    var originalSelectionRanges = [];
                    var originalSelectionBackward = winSelectionIsBackward(sel);
                    for (var i = 0; i < originalSelectionRangeCount; ++i) {
                        originalSelectionRanges[i] = sel.getRangeAt(i);
                    }

                    // Create some test elements
                    var testEl = dom.createTestElement(document, "", false);
                    var textNode = testEl.appendChild( document.createTextNode("\u00a0\u00a0\u00a0") );

                    // Test whether the native selection will allow a collapsed selection within a non-editable element
                    var r1 = document.createRange();

                    r1.setStart(textNode, 1);
                    r1.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(r1);
                    collapsedNonEditableSelectionsSupported = (sel.rangeCount == 1);
                    sel.removeAllRanges();

                    // Test whether the native selection is capable of supporting multiple ranges.
                    if (!selectionHasMultipleRanges) {
                        // Doing the original feature test here in Chrome 36 (and presumably later versions) prints a
                        // console error of "Discontiguous selection is not supported." that cannot be suppressed. There's
                        // nothing we can do about this while retaining the feature test so we have to resort to a browser
                        // sniff. I'm not happy about it. See
                        // https://code.google.com/p/chromium/issues/detail?id=399791
                        var chromeMatch = window.navigator.appVersion.match(/Chrome\/(.*?) /);
                        if (chromeMatch && parseInt(chromeMatch[1]) >= 36) {
                            selectionSupportsMultipleRanges = false;
                        } else {
                            var r2 = r1.cloneRange();
                            r1.setStart(textNode, 0);
                            r2.setEnd(textNode, 3);
                            r2.setStart(textNode, 2);
                            sel.addRange(r1);
                            sel.addRange(r2);
                            selectionSupportsMultipleRanges = (sel.rangeCount == 2);
                        }
                    }

                    // Clean up
                    dom.removeNode(testEl);
                    sel.removeAllRanges();

                    for (i = 0; i < originalSelectionRangeCount; ++i) {
                        if (i == 0 && originalSelectionBackward) {
                            if (addRangeBackwardToNative) {
                                addRangeBackwardToNative(sel, originalSelectionRanges[i]);
                            } else {
                                api.warn("Rangy initialization: original selection was backwards but selection has been restored forwards because the browser does not support Selection.extend");
                                sel.addRange(originalSelectionRanges[i]);
                            }
                        } else {
                            sel.addRange(originalSelectionRanges[i]);
                        }
                    }
                }
            })();
        }

        features.selectionSupportsMultipleRanges = selectionSupportsMultipleRanges;
        features.collapsedNonEditableSelectionsSupported = collapsedNonEditableSelectionsSupported;

        // ControlRanges
        var implementsControlRange = false, testControlRange;

        if (body && isHostMethod(body, "createControlRange")) {
            testControlRange = body.createControlRange();
            if (util.areHostProperties(testControlRange, ["item", "add"])) {
                implementsControlRange = true;
            }
        }
        features.implementsControlRange = implementsControlRange;

        // Selection collapsedness
        if (selectionHasAnchorAndFocus) {
            selectionIsCollapsed = function(sel) {
                return sel.anchorNode === sel.focusNode && sel.anchorOffset === sel.focusOffset;
            };
        } else {
            selectionIsCollapsed = function(sel) {
                return sel.rangeCount ? sel.getRangeAt(sel.rangeCount - 1).collapsed : false;
            };
        }

        function updateAnchorAndFocusFromRange(sel, range, backward) {
            var anchorPrefix = backward ? "end" : "start", focusPrefix = backward ? "start" : "end";
            sel.anchorNode = range[anchorPrefix + "Container"];
            sel.anchorOffset = range[anchorPrefix + "Offset"];
            sel.focusNode = range[focusPrefix + "Container"];
            sel.focusOffset = range[focusPrefix + "Offset"];
        }

        function updateAnchorAndFocusFromNativeSelection(sel) {
            var nativeSel = sel.nativeSelection;
            sel.anchorNode = nativeSel.anchorNode;
            sel.anchorOffset = nativeSel.anchorOffset;
            sel.focusNode = nativeSel.focusNode;
            sel.focusOffset = nativeSel.focusOffset;
        }

        function updateEmptySelection(sel) {
            sel.anchorNode = sel.focusNode = null;
            sel.anchorOffset = sel.focusOffset = 0;
            sel.rangeCount = 0;
            sel.isCollapsed = true;
            sel._ranges.length = 0;
        }

        function getNativeRange(range) {
            var nativeRange;
            if (range instanceof DomRange) {
                nativeRange = api.createNativeRange(range.getDocument());
                nativeRange.setEnd(range.endContainer, range.endOffset);
                nativeRange.setStart(range.startContainer, range.startOffset);
            } else if (range instanceof WrappedRange) {
                nativeRange = range.nativeRange;
            } else if (features.implementsDomRange && (range instanceof dom.getWindow(range.startContainer).Range)) {
                nativeRange = range;
            }
            return nativeRange;
        }

        function rangeContainsSingleElement(rangeNodes) {
            if (!rangeNodes.length || rangeNodes[0].nodeType != 1) {
                return false;
            }
            for (var i = 1, len = rangeNodes.length; i < len; ++i) {
                if (!dom.isAncestorOf(rangeNodes[0], rangeNodes[i])) {
                    return false;
                }
            }
            return true;
        }

        function getSingleElementFromRange(range) {
            var nodes = range.getNodes();
            if (!rangeContainsSingleElement(nodes)) {
                throw module.createError("getSingleElementFromRange: range " + range.inspect() + " did not consist of a single element");
            }
            return nodes[0];
        }

        // Simple, quick test which only needs to distinguish between a TextRange and a ControlRange
        function isTextRange(range) {
            return !!range && typeof range.text != "undefined";
        }

        function updateFromTextRange(sel, range) {
            // Create a Range from the selected TextRange
            var wrappedRange = new WrappedRange(range);
            sel._ranges = [wrappedRange];

            updateAnchorAndFocusFromRange(sel, wrappedRange, false);
            sel.rangeCount = 1;
            sel.isCollapsed = wrappedRange.collapsed;
        }

        function updateControlSelection(sel) {
            // Update the wrapped selection based on what's now in the native selection
            sel._ranges.length = 0;
            if (sel.docSelection.type == "None") {
                updateEmptySelection(sel);
            } else {
                var controlRange = sel.docSelection.createRange();
                if (isTextRange(controlRange)) {
                    // This case (where the selection type is "Control" and calling createRange() on the selection returns
                    // a TextRange) can happen in IE 9. It happens, for example, when all elements in the selected
                    // ControlRange have been removed from the ControlRange and removed from the document.
                    updateFromTextRange(sel, controlRange);
                } else {
                    sel.rangeCount = controlRange.length;
                    var range, doc = getDocument(controlRange.item(0));
                    for (var i = 0; i < sel.rangeCount; ++i) {
                        range = api.createRange(doc);
                        range.selectNode(controlRange.item(i));
                        sel._ranges.push(range);
                    }
                    sel.isCollapsed = sel.rangeCount == 1 && sel._ranges[0].collapsed;
                    updateAnchorAndFocusFromRange(sel, sel._ranges[sel.rangeCount - 1], false);
                }
            }
        }

        function addRangeToControlSelection(sel, range) {
            var controlRange = sel.docSelection.createRange();
            var rangeElement = getSingleElementFromRange(range);

            // Create a new ControlRange containing all the elements in the selected ControlRange plus the element
            // contained by the supplied range
            var doc = getDocument(controlRange.item(0));
            var newControlRange = getBody(doc).createControlRange();
            for (var i = 0, len = controlRange.length; i < len; ++i) {
                newControlRange.add(controlRange.item(i));
            }
            try {
                newControlRange.add(rangeElement);
            } catch (ex) {
                throw module.createError("addRange(): Element within the specified Range could not be added to control selection (does it have layout?)");
            }
            newControlRange.select();

            // Update the wrapped selection based on what's now in the native selection
            updateControlSelection(sel);
        }

        var getSelectionRangeAt;

        if (isHostMethod(testSelection, "getRangeAt")) {
            // try/catch is present because getRangeAt() must have thrown an error in some browser and some situation.
            // Unfortunately, I didn't write a comment about the specifics and am now scared to take it out. Let that be a
            // lesson to us all, especially me.
            getSelectionRangeAt = function(sel, index) {
                try {
                    return sel.getRangeAt(index);
                } catch (ex) {
                    return null;
                }
            };
        } else if (selectionHasAnchorAndFocus) {
            getSelectionRangeAt = function(sel) {
                var doc = getDocument(sel.anchorNode);
                var range = api.createRange(doc);
                range.setStartAndEnd(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset);

                // Handle the case when the selection was selected backwards (from the end to the start in the
                // document)
                if (range.collapsed !== this.isCollapsed) {
                    range.setStartAndEnd(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset);
                }

                return range;
            };
        }

        function WrappedSelection(selection, docSelection, win) {
            this.nativeSelection = selection;
            this.docSelection = docSelection;
            this._ranges = [];
            this.win = win;
            this.refresh();
        }

        WrappedSelection.prototype = api.selectionPrototype;

        function deleteProperties(sel) {
            sel.win = sel.anchorNode = sel.focusNode = sel._ranges = null;
            sel.rangeCount = sel.anchorOffset = sel.focusOffset = 0;
            sel.detached = true;
        }

        var cachedRangySelections = [];

        function actOnCachedSelection(win, action) {
            var i = cachedRangySelections.length, cached, sel;
            while (i--) {
                cached = cachedRangySelections[i];
                sel = cached.selection;
                if (action == "deleteAll") {
                    deleteProperties(sel);
                } else if (cached.win == win) {
                    if (action == "delete") {
                        cachedRangySelections.splice(i, 1);
                        return true;
                    } else {
                        return sel;
                    }
                }
            }
            if (action == "deleteAll") {
                cachedRangySelections.length = 0;
            }
            return null;
        }

        var getSelection = function(win) {
            // Check if the parameter is a Rangy Selection object
            if (win && win instanceof WrappedSelection) {
                win.refresh();
                return win;
            }

            win = getWindow(win, "getNativeSelection");

            var sel = actOnCachedSelection(win);
            var nativeSel = getNativeSelection(win), docSel = implementsDocSelection ? getDocSelection(win) : null;
            if (sel) {
                sel.nativeSelection = nativeSel;
                sel.docSelection = docSel;
                sel.refresh();
            } else {
                sel = new WrappedSelection(nativeSel, docSel, win);
                cachedRangySelections.push( { win: win, selection: sel } );
            }
            return sel;
        };

        api.getSelection = getSelection;

        util.createAliasForDeprecatedMethod(api, "getIframeSelection", "getSelection");

        var selProto = WrappedSelection.prototype;

        function createControlSelection(sel, ranges) {
            // Ensure that the selection becomes of type "Control"
            var doc = getDocument(ranges[0].startContainer);
            var controlRange = getBody(doc).createControlRange();
            for (var i = 0, el, len = ranges.length; i < len; ++i) {
                el = getSingleElementFromRange(ranges[i]);
                try {
                    controlRange.add(el);
                } catch (ex) {
                    throw module.createError("setRanges(): Element within one of the specified Ranges could not be added to control selection (does it have layout?)");
                }
            }
            controlRange.select();

            // Update the wrapped selection based on what's now in the native selection
            updateControlSelection(sel);
        }

        // Selecting a range
        if (!useDocumentSelection && selectionHasAnchorAndFocus && util.areHostMethods(testSelection, ["removeAllRanges", "addRange"])) {
            selProto.removeAllRanges = function() {
                this.nativeSelection.removeAllRanges();
                updateEmptySelection(this);
            };

            var addRangeBackward = function(sel, range) {
                addRangeBackwardToNative(sel.nativeSelection, range);
                sel.refresh();
            };

            if (selectionHasRangeCount) {
                selProto.addRange = function(range, direction) {
                    if (implementsControlRange && implementsDocSelection && this.docSelection.type == CONTROL) {
                        addRangeToControlSelection(this, range);
                    } else {
                        if (isDirectionBackward(direction) && selectionHasExtend) {
                            addRangeBackward(this, range);
                        } else {
                            var previousRangeCount;
                            if (selectionSupportsMultipleRanges) {
                                previousRangeCount = this.rangeCount;
                            } else {
                                this.removeAllRanges();
                                previousRangeCount = 0;
                            }
                            // Clone the native range so that changing the selected range does not affect the selection.
                            // This is contrary to the spec but is the only way to achieve consistency between browsers. See
                            // issue 80.
                            var clonedNativeRange = getNativeRange(range).cloneRange();
                            try {
                                this.nativeSelection.addRange(clonedNativeRange);
                            } catch (ex) {
                            }

                            // Check whether adding the range was successful
                            this.rangeCount = this.nativeSelection.rangeCount;

                            if (this.rangeCount == previousRangeCount + 1) {
                                // The range was added successfully

                                // Check whether the range that we added to the selection is reflected in the last range extracted from
                                // the selection
                                if (api.config.checkSelectionRanges) {
                                    var nativeRange = getSelectionRangeAt(this.nativeSelection, this.rangeCount - 1);
                                    if (nativeRange && !rangesEqual(nativeRange, range)) {
                                        // Happens in WebKit with, for example, a selection placed at the start of a text node
                                        range = new WrappedRange(nativeRange);
                                    }
                                }
                                this._ranges[this.rangeCount - 1] = range;
                                updateAnchorAndFocusFromRange(this, range, selectionIsBackward(this.nativeSelection));
                                this.isCollapsed = selectionIsCollapsed(this);
                            } else {
                                // The range was not added successfully. The simplest thing is to refresh
                                this.refresh();
                            }
                        }
                    }
                };
            } else {
                selProto.addRange = function(range, direction) {
                    if (isDirectionBackward(direction) && selectionHasExtend) {
                        addRangeBackward(this, range);
                    } else {
                        this.nativeSelection.addRange(getNativeRange(range));
                        this.refresh();
                    }
                };
            }

            selProto.setRanges = function(ranges) {
                if (implementsControlRange && implementsDocSelection && ranges.length > 1) {
                    createControlSelection(this, ranges);
                } else {
                    this.removeAllRanges();
                    for (var i = 0, len = ranges.length; i < len; ++i) {
                        this.addRange(ranges[i]);
                    }
                }
            };
        } else if (isHostMethod(testSelection, "empty") && isHostMethod(testRange, "select") &&
                   implementsControlRange && useDocumentSelection) {

            selProto.removeAllRanges = function() {
                // Added try/catch as fix for issue #21
                try {
                    this.docSelection.empty();

                    // Check for empty() not working (issue #24)
                    if (this.docSelection.type != "None") {
                        // Work around failure to empty a control selection by instead selecting a TextRange and then
                        // calling empty()
                        var doc;
                        if (this.anchorNode) {
                            doc = getDocument(this.anchorNode);
                        } else if (this.docSelection.type == CONTROL) {
                            var controlRange = this.docSelection.createRange();
                            if (controlRange.length) {
                                doc = getDocument( controlRange.item(0) );
                            }
                        }
                        if (doc) {
                            var textRange = getBody(doc).createTextRange();
                            textRange.select();
                            this.docSelection.empty();
                        }
                    }
                } catch(ex) {}
                updateEmptySelection(this);
            };

            selProto.addRange = function(range) {
                if (this.docSelection.type == CONTROL) {
                    addRangeToControlSelection(this, range);
                } else {
                    api.WrappedTextRange.rangeToTextRange(range).select();
                    this._ranges[0] = range;
                    this.rangeCount = 1;
                    this.isCollapsed = this._ranges[0].collapsed;
                    updateAnchorAndFocusFromRange(this, range, false);
                }
            };

            selProto.setRanges = function(ranges) {
                this.removeAllRanges();
                var rangeCount = ranges.length;
                if (rangeCount > 1) {
                    createControlSelection(this, ranges);
                } else if (rangeCount) {
                    this.addRange(ranges[0]);
                }
            };
        } else {
            module.fail("No means of selecting a Range or TextRange was found");
            return false;
        }

        selProto.getRangeAt = function(index) {
            if (index < 0 || index >= this.rangeCount) {
                throw new DOMException("INDEX_SIZE_ERR");
            } else {
                // Clone the range to preserve selection-range independence. See issue 80.
                return this._ranges[index].cloneRange();
            }
        };

        var refreshSelection;

        if (useDocumentSelection) {
            refreshSelection = function(sel) {
                var range;
                if (api.isSelectionValid(sel.win)) {
                    range = sel.docSelection.createRange();
                } else {
                    range = getBody(sel.win.document).createTextRange();
                    range.collapse(true);
                }

                if (sel.docSelection.type == CONTROL) {
                    updateControlSelection(sel);
                } else if (isTextRange(range)) {
                    updateFromTextRange(sel, range);
                } else {
                    updateEmptySelection(sel);
                }
            };
        } else if (isHostMethod(testSelection, "getRangeAt") && typeof testSelection.rangeCount == NUMBER) {
            refreshSelection = function(sel) {
                if (implementsControlRange && implementsDocSelection && sel.docSelection.type == CONTROL) {
                    updateControlSelection(sel);
                } else {
                    sel._ranges.length = sel.rangeCount = sel.nativeSelection.rangeCount;
                    if (sel.rangeCount) {
                        for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                            sel._ranges[i] = new api.WrappedRange(sel.nativeSelection.getRangeAt(i));
                        }
                        updateAnchorAndFocusFromRange(sel, sel._ranges[sel.rangeCount - 1], selectionIsBackward(sel.nativeSelection));
                        sel.isCollapsed = selectionIsCollapsed(sel);
                    } else {
                        updateEmptySelection(sel);
                    }
                }
            };
        } else if (selectionHasAnchorAndFocus && typeof testSelection.isCollapsed == BOOLEAN && typeof testRange.collapsed == BOOLEAN && features.implementsDomRange) {
            refreshSelection = function(sel) {
                var range, nativeSel = sel.nativeSelection;
                if (nativeSel.anchorNode) {
                    range = getSelectionRangeAt(nativeSel, 0);
                    sel._ranges = [range];
                    sel.rangeCount = 1;
                    updateAnchorAndFocusFromNativeSelection(sel);
                    sel.isCollapsed = selectionIsCollapsed(sel);
                } else {
                    updateEmptySelection(sel);
                }
            };
        } else {
            module.fail("No means of obtaining a Range or TextRange from the user's selection was found");
            return false;
        }

        selProto.refresh = function(checkForChanges) {
            var oldRanges = checkForChanges ? this._ranges.slice(0) : null;
            var oldAnchorNode = this.anchorNode, oldAnchorOffset = this.anchorOffset;

            refreshSelection(this);
            if (checkForChanges) {
                // Check the range count first
                var i = oldRanges.length;
                if (i != this._ranges.length) {
                    return true;
                }

                // Now check the direction. Checking the anchor position is the same is enough since we're checking all the
                // ranges after this
                if (this.anchorNode != oldAnchorNode || this.anchorOffset != oldAnchorOffset) {
                    return true;
                }

                // Finally, compare each range in turn
                while (i--) {
                    if (!rangesEqual(oldRanges[i], this._ranges[i])) {
                        return true;
                    }
                }
                return false;
            }
        };

        // Removal of a single range
        var removeRangeManually = function(sel, range) {
            var ranges = sel.getAllRanges();
            sel.removeAllRanges();
            for (var i = 0, len = ranges.length; i < len; ++i) {
                if (!rangesEqual(range, ranges[i])) {
                    sel.addRange(ranges[i]);
                }
            }
            if (!sel.rangeCount) {
                updateEmptySelection(sel);
            }
        };

        if (implementsControlRange && implementsDocSelection) {
            selProto.removeRange = function(range) {
                if (this.docSelection.type == CONTROL) {
                    var controlRange = this.docSelection.createRange();
                    var rangeElement = getSingleElementFromRange(range);

                    // Create a new ControlRange containing all the elements in the selected ControlRange minus the
                    // element contained by the supplied range
                    var doc = getDocument(controlRange.item(0));
                    var newControlRange = getBody(doc).createControlRange();
                    var el, removed = false;
                    for (var i = 0, len = controlRange.length; i < len; ++i) {
                        el = controlRange.item(i);
                        if (el !== rangeElement || removed) {
                            newControlRange.add(controlRange.item(i));
                        } else {
                            removed = true;
                        }
                    }
                    newControlRange.select();

                    // Update the wrapped selection based on what's now in the native selection
                    updateControlSelection(this);
                } else {
                    removeRangeManually(this, range);
                }
            };
        } else {
            selProto.removeRange = function(range) {
                removeRangeManually(this, range);
            };
        }

        // Detecting if a selection is backward
        var selectionIsBackward;
        if (!useDocumentSelection && selectionHasAnchorAndFocus && features.implementsDomRange) {
            selectionIsBackward = winSelectionIsBackward;

            selProto.isBackward = function() {
                return selectionIsBackward(this);
            };
        } else {
            selectionIsBackward = selProto.isBackward = function() {
                return false;
            };
        }

        // Create an alias for backwards compatibility. From 1.3, everything is "backward" rather than "backwards"
        selProto.isBackwards = selProto.isBackward;

        // Selection stringifier
        // This is conformant to the old HTML5 selections draft spec but differs from WebKit and Mozilla's implementation.
        // The current spec does not yet define this method.
        selProto.toString = function() {
            var rangeTexts = [];
            for (var i = 0, len = this.rangeCount; i < len; ++i) {
                rangeTexts[i] = "" + this._ranges[i];
            }
            return rangeTexts.join("");
        };

        function assertNodeInSameDocument(sel, node) {
            if (sel.win.document != getDocument(node)) {
                throw new DOMException("WRONG_DOCUMENT_ERR");
            }
        }

        // No current browser conforms fully to the spec for this method, so Rangy's own method is always used
        selProto.collapse = function(node, offset) {
            assertNodeInSameDocument(this, node);
            var range = api.createRange(node);
            range.collapseToPoint(node, offset);
            this.setSingleRange(range);
            this.isCollapsed = true;
        };

        selProto.collapseToStart = function() {
            if (this.rangeCount) {
                var range = this._ranges[0];
                this.collapse(range.startContainer, range.startOffset);
            } else {
                throw new DOMException("INVALID_STATE_ERR");
            }
        };

        selProto.collapseToEnd = function() {
            if (this.rangeCount) {
                var range = this._ranges[this.rangeCount - 1];
                this.collapse(range.endContainer, range.endOffset);
            } else {
                throw new DOMException("INVALID_STATE_ERR");
            }
        };

        // The spec is very specific on how selectAllChildren should be implemented and not all browsers implement it as
        // specified so the native implementation is never used by Rangy.
        selProto.selectAllChildren = function(node) {
            assertNodeInSameDocument(this, node);
            var range = api.createRange(node);
            range.selectNodeContents(node);
            this.setSingleRange(range);
        };

        selProto.deleteFromDocument = function() {
            // Sepcial behaviour required for IE's control selections
            if (implementsControlRange && implementsDocSelection && this.docSelection.type == CONTROL) {
                var controlRange = this.docSelection.createRange();
                var element;
                while (controlRange.length) {
                    element = controlRange.item(0);
                    controlRange.remove(element);
                    dom.removeNode(element);
                }
                this.refresh();
            } else if (this.rangeCount) {
                var ranges = this.getAllRanges();
                if (ranges.length) {
                    this.removeAllRanges();
                    for (var i = 0, len = ranges.length; i < len; ++i) {
                        ranges[i].deleteContents();
                    }
                    // The spec says nothing about what the selection should contain after calling deleteContents on each
                    // range. Firefox moves the selection to where the final selected range was, so we emulate that
                    this.addRange(ranges[len - 1]);
                }
            }
        };

        // The following are non-standard extensions
        selProto.eachRange = function(func, returnValue) {
            for (var i = 0, len = this._ranges.length; i < len; ++i) {
                if ( func( this.getRangeAt(i) ) ) {
                    return returnValue;
                }
            }
        };

        selProto.getAllRanges = function() {
            var ranges = [];
            this.eachRange(function(range) {
                ranges.push(range);
            });
            return ranges;
        };

        selProto.setSingleRange = function(range, direction) {
            this.removeAllRanges();
            this.addRange(range, direction);
        };

        selProto.callMethodOnEachRange = function(methodName, params) {
            var results = [];
            this.eachRange( function(range) {
                results.push( range[methodName].apply(range, params || []) );
            } );
            return results;
        };

        function createStartOrEndSetter(isStart) {
            return function(node, offset) {
                var range;
                if (this.rangeCount) {
                    range = this.getRangeAt(0);
                    range["set" + (isStart ? "Start" : "End")](node, offset);
                } else {
                    range = api.createRange(this.win.document);
                    range.setStartAndEnd(node, offset);
                }
                this.setSingleRange(range, this.isBackward());
            };
        }

        selProto.setStart = createStartOrEndSetter(true);
        selProto.setEnd = createStartOrEndSetter(false);

        // Add select() method to Range prototype. Any existing selection will be removed.
        api.rangePrototype.select = function(direction) {
            getSelection( this.getDocument() ).setSingleRange(this, direction);
        };

        selProto.changeEachRange = function(func) {
            var ranges = [];
            var backward = this.isBackward();

            this.eachRange(function(range) {
                func(range);
                ranges.push(range);
            });

            this.removeAllRanges();
            if (backward && ranges.length == 1) {
                this.addRange(ranges[0], "backward");
            } else {
                this.setRanges(ranges);
            }
        };

        selProto.containsNode = function(node, allowPartial) {
            return this.eachRange( function(range) {
                return range.containsNode(node, allowPartial);
            }, true ) || false;
        };

        selProto.getBookmark = function(containerNode) {
            return {
                backward: this.isBackward(),
                rangeBookmarks: this.callMethodOnEachRange("getBookmark", [containerNode])
            };
        };

        selProto.moveToBookmark = function(bookmark) {
            var selRanges = [];
            for (var i = 0, rangeBookmark, range; rangeBookmark = bookmark.rangeBookmarks[i++]; ) {
                range = api.createRange(this.win);
                range.moveToBookmark(rangeBookmark);
                selRanges.push(range);
            }
            if (bookmark.backward) {
                this.setSingleRange(selRanges[0], "backward");
            } else {
                this.setRanges(selRanges);
            }
        };

        selProto.saveRanges = function() {
            return {
                backward: this.isBackward(),
                ranges: this.callMethodOnEachRange("cloneRange")
            };
        };

        selProto.restoreRanges = function(selRanges) {
            this.removeAllRanges();
            for (var i = 0, range; range = selRanges.ranges[i]; ++i) {
                this.addRange(range, (selRanges.backward && i == 0));
            }
        };

        selProto.toHtml = function() {
            var rangeHtmls = [];
            this.eachRange(function(range) {
                rangeHtmls.push( DomRange.toHtml(range) );
            });
            return rangeHtmls.join("");
        };

        if (features.implementsTextRange) {
            selProto.getNativeTextRange = function() {
                var sel, textRange;
                if ( (sel = this.docSelection) ) {
                    var range = sel.createRange();
                    if (isTextRange(range)) {
                        return range;
                    } else {
                        throw module.createError("getNativeTextRange: selection is a control selection");
                    }
                } else if (this.rangeCount > 0) {
                    return api.WrappedTextRange.rangeToTextRange( this.getRangeAt(0) );
                } else {
                    throw module.createError("getNativeTextRange: selection contains no range");
                }
            };
        }

        function inspect(sel) {
            var rangeInspects = [];
            var anchor = new DomPosition(sel.anchorNode, sel.anchorOffset);
            var focus = new DomPosition(sel.focusNode, sel.focusOffset);
            var name = (typeof sel.getName == "function") ? sel.getName() : "Selection";

            if (typeof sel.rangeCount != "undefined") {
                for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                    rangeInspects[i] = DomRange.inspect(sel.getRangeAt(i));
                }
            }
            return "[" + name + "(Ranges: " + rangeInspects.join(", ") +
                    ")(anchor: " + anchor.inspect() + ", focus: " + focus.inspect() + "]";
        }

        selProto.getName = function() {
            return "WrappedSelection";
        };

        selProto.inspect = function() {
            return inspect(this);
        };

        selProto.detach = function() {
            actOnCachedSelection(this.win, "delete");
            deleteProperties(this);
        };

        WrappedSelection.detachAll = function() {
            actOnCachedSelection(null, "deleteAll");
        };

        WrappedSelection.inspect = inspect;
        WrappedSelection.isDirectionBackward = isDirectionBackward;

        api.Selection = WrappedSelection;

        api.selectionPrototype = selProto;

        api.addShimListener(function(win) {
            if (typeof win.getSelection == "undefined") {
                win.getSelection = function() {
                    return getSelection(win);
                };
            }
            win = null;
        });
    });
    

    /*----------------------------------------------------------------------------------------------------------------*/

    // Wait for document to load before initializing
    var docReady = false;

    var loadHandler = function(e) {
        if (!docReady) {
            docReady = true;
            if (!api.initialized && api.config.autoInitialize) {
                init();
            }
        }
    };

    if (isBrowser) {
        // Test whether the document has already been loaded and initialize immediately if so
        if (document.readyState == "complete") {
            loadHandler();
        } else {
            if (isHostMethod(document, "addEventListener")) {
                document.addEventListener("DOMContentLoaded", loadHandler, false);
            }

            // Add a fallback in case the DOMContentLoaded event isn't supported
            addListener(window, "load", loadHandler);
        }
    }

    return api;
}, this);
/**
 * Selection save and restore module for Rangy.
 * Saves and restores user selections using marker invisible elements in the DOM.
 *
 * Part of Rangy, a cross-browser JavaScript range and selection library
 * https://github.com/timdown/rangy
 *
 * Depends on Rangy core.
 *
 * Copyright 2015, Tim Down
 * Licensed under the MIT license.
 * Version: 1.3.0
 * Build date: 10 May 2015
 */
(function(factory, root) {
    if (typeof define == "function" && define.amd) {
        // AMD. Register as an anonymous module with a dependency on Rangy.
        define(["./rangy-core"], factory);
    } else if (typeof module != "undefined" && typeof exports == "object") {
        // Node/CommonJS style
        module.exports = factory( require("rangy") );
    } else {
        // No AMD or CommonJS support so we use the rangy property of root (probably the global variable)
        factory(root.rangy);
    }
})(function(rangy) {
    rangy.createModule("SaveRestore", ["WrappedRange"], function(api, module) {
        var dom = api.dom;
        var removeNode = dom.removeNode;
        var isDirectionBackward = api.Selection.isDirectionBackward;
        var markerTextChar = "\ufeff";

        function gEBI(id, doc) {
            return (doc || document).getElementById(id);
        }

        function insertRangeBoundaryMarker(range, atStart) {
            var markerId = "selectionBoundary_" + (+new Date()) + "_" + ("" + Math.random()).slice(2);
            var markerEl;
            var doc = dom.getDocument(range.startContainer);

            // Clone the Range and collapse to the appropriate boundary point
            var boundaryRange = range.cloneRange();
            boundaryRange.collapse(atStart);

            // Create the marker element containing a single invisible character using DOM methods and insert it
            markerEl = doc.createElement("span");
            markerEl.id = markerId;
            markerEl.style.lineHeight = "0";
            markerEl.style.display = "none";
            markerEl.className = "rangySelectionBoundary";
            markerEl.appendChild(doc.createTextNode(markerTextChar));

            boundaryRange.insertNode(markerEl);
            return markerEl;
        }

        function setRangeBoundary(doc, range, markerId, atStart) {
            var markerEl = gEBI(markerId, doc);
            if (markerEl) {
                range[atStart ? "setStartBefore" : "setEndBefore"](markerEl);
                removeNode(markerEl);
            } else {
                module.warn("Marker element has been removed. Cannot restore selection.");
            }
        }

        function compareRanges(r1, r2) {
            return r2.compareBoundaryPoints(r1.START_TO_START, r1);
        }

        function saveRange(range, direction) {
            var startEl, endEl, doc = api.DomRange.getRangeDocument(range), text = range.toString();
            var backward = isDirectionBackward(direction);

            if (range.collapsed) {
                endEl = insertRangeBoundaryMarker(range, false);
                return {
                    document: doc,
                    markerId: endEl.id,
                    collapsed: true
                };
            } else {
                endEl = insertRangeBoundaryMarker(range, false);
                startEl = insertRangeBoundaryMarker(range, true);

                return {
                    document: doc,
                    startMarkerId: startEl.id,
                    endMarkerId: endEl.id,
                    collapsed: false,
                    backward: backward,
                    toString: function() {
                        return "original text: '" + text + "', new text: '" + range.toString() + "'";
                    }
                };
            }
        }

        function restoreRange(rangeInfo, normalize) {
            var doc = rangeInfo.document;
            if (typeof normalize == "undefined") {
                normalize = true;
            }
            var range = api.createRange(doc);
            if (rangeInfo.collapsed) {
                var markerEl = gEBI(rangeInfo.markerId, doc);
                if (markerEl) {
                    markerEl.style.display = "inline";
                    var previousNode = markerEl.previousSibling;

                    // Workaround for issue 17
                    if (previousNode && previousNode.nodeType == 3) {
                        removeNode(markerEl);
                        range.collapseToPoint(previousNode, previousNode.length);
                    } else {
                        range.collapseBefore(markerEl);
                        removeNode(markerEl);
                    }
                } else {
                    module.warn("Marker element has been removed. Cannot restore selection.");
                }
            } else {
                setRangeBoundary(doc, range, rangeInfo.startMarkerId, true);
                setRangeBoundary(doc, range, rangeInfo.endMarkerId, false);
            }

            if (normalize) {
                range.normalizeBoundaries();
            }

            return range;
        }

        function saveRanges(ranges, direction) {
            var rangeInfos = [], range, doc;
            var backward = isDirectionBackward(direction);

            // Order the ranges by position within the DOM, latest first, cloning the array to leave the original untouched
            ranges = ranges.slice(0);
            ranges.sort(compareRanges);

            for (var i = 0, len = ranges.length; i < len; ++i) {
                rangeInfos[i] = saveRange(ranges[i], backward);
            }

            // Now that all the markers are in place and DOM manipulation over, adjust each range's boundaries to lie
            // between its markers
            for (i = len - 1; i >= 0; --i) {
                range = ranges[i];
                doc = api.DomRange.getRangeDocument(range);
                if (range.collapsed) {
                    range.collapseAfter(gEBI(rangeInfos[i].markerId, doc));
                } else {
                    range.setEndBefore(gEBI(rangeInfos[i].endMarkerId, doc));
                    range.setStartAfter(gEBI(rangeInfos[i].startMarkerId, doc));
                }
            }

            return rangeInfos;
        }

        function saveSelection(win) {
            if (!api.isSelectionValid(win)) {
                module.warn("Cannot save selection. This usually happens when the selection is collapsed and the selection document has lost focus.");
                return null;
            }
            var sel = api.getSelection(win);
            var ranges = sel.getAllRanges();
            var backward = (ranges.length == 1 && sel.isBackward());

            var rangeInfos = saveRanges(ranges, backward);

            // Ensure current selection is unaffected
            if (backward) {
                sel.setSingleRange(ranges[0], backward);
            } else {
                sel.setRanges(ranges);
            }

            return {
                win: win,
                rangeInfos: rangeInfos,
                restored: false
            };
        }

        function restoreRanges(rangeInfos) {
            var ranges = [];

            // Ranges are in reverse order of appearance in the DOM. We want to restore earliest first to avoid
            // normalization affecting previously restored ranges.
            var rangeCount = rangeInfos.length;

            for (var i = rangeCount - 1; i >= 0; i--) {
                ranges[i] = restoreRange(rangeInfos[i], true);
            }

            return ranges;
        }

        function restoreSelection(savedSelection, preserveDirection) {
            if (!savedSelection.restored) {
                var rangeInfos = savedSelection.rangeInfos;
                var sel = api.getSelection(savedSelection.win);
                var ranges = restoreRanges(rangeInfos), rangeCount = rangeInfos.length;

                if (rangeCount == 1 && preserveDirection && api.features.selectionHasExtend && rangeInfos[0].backward) {
                    sel.removeAllRanges();
                    sel.addRange(ranges[0], true);
                } else {
                    sel.setRanges(ranges);
                }

                savedSelection.restored = true;
            }
        }

        function removeMarkerElement(doc, markerId) {
            var markerEl = gEBI(markerId, doc);
            if (markerEl) {
                removeNode(markerEl);
            }
        }

        function removeMarkers(savedSelection) {
            var rangeInfos = savedSelection.rangeInfos;
            for (var i = 0, len = rangeInfos.length, rangeInfo; i < len; ++i) {
                rangeInfo = rangeInfos[i];
                if (rangeInfo.collapsed) {
                    removeMarkerElement(savedSelection.doc, rangeInfo.markerId);
                } else {
                    removeMarkerElement(savedSelection.doc, rangeInfo.startMarkerId);
                    removeMarkerElement(savedSelection.doc, rangeInfo.endMarkerId);
                }
            }
        }

        api.util.extend(api, {
            saveRange: saveRange,
            restoreRange: restoreRange,
            saveRanges: saveRanges,
            restoreRanges: restoreRanges,
            saveSelection: saveSelection,
            restoreSelection: restoreSelection,
            removeMarkerElement: removeMarkerElement,
            removeMarkers: removeMarkers
        });
    });
    
    return rangy;
}, this);
(function() {
    'use strict';

    /**
     * Alert module
     *
     * @author  The Spotful Team
     * @since   2016/9/8
     */
    angular.module('ui.alert', []);
})();

/**
 *
 * This module provides all features necessary to parse a json object that describes the schema of editable templates into an editing interface.
 * @namespace EditorParser
 * @memberOf SpotfulUi
 */
angular.module('ui.editor-parser', []);

/**
 * Popup
 */
angular.module('ui.popup', []);

angular.module('ui.popup').run(['$rootScope', 'PopupEditorManager', '$q', function($rootScope, PopupEditorManager, $q) {

    $rootScope.$on("$routeChangeStart", function(event, next, current) {

        //Clears all element in the stack;
        PopupEditorManager.clear();
    });


}]);

angular.module('ui.richtext', ['textAngular']);

/**
 * Spotful Ui Module
 * @class  SpotfulUi
 * 
 */
angular.module('ui', ['ui.editor-parser', 'ui.popup', 'ui.alert', 'ui.richtext']);

angular.module('ui').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('src/alert/partials/alerts.html',
    "<div class=\"notifier--container\">\n" +
    "\n" +
    "    <div class=\"notifier--alert__{{a.type}}\" ng-repeat=\"a in alerts\" ng-class=\"{ '-is--active' : a.show , '-is--inactive' : !a.show}\">\n" +
    "        \n" +
    "        <label class=\"notifier--alert__message\" ng-bind-html=\"a.message\">\n" +
    "            <!--{{a.message}}-->\n" +
    "        </label>\n" +
    "\n" +
    "        <button class=\"btn--notifier__{{btn.type}}\" ng-repeat=\"btn in a.buttons\" type=\"button\" ng-click=\"btn.callback()\">\n" +
    "            {{btn.label}}\n" +
    "        </button>\n" +
    "\n" +
    "	</div>\n" +
    "\n" +
    "</div>	\n" +
    "\n"
  );


  $templateCache.put('src/auto-update-input/partials/auto-update-input.html',
    "<div style=\"width:100%;\">\n" +
    "\n" +
    "    <input class=\"input--box\" type=\"text\" ng-model=\"ngModel\" ng-keyup=\"checkEndEdit($event)\" ng-focus=\"startEdit()\" ng-blur=\"endEdit()\" type=\"text\" tabindex=\"-1\">\n" +
    "                            \n" +
    "    <div class=\"validation--input\">\n" +
    "        <img width=\"20\" ng-hide=\"status == 'inactive'\" ng-src=\"{{statusImage}}\"/>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('src/color-field/partials/color-field.html',
    "<div class=\"input--group\">\n" +
    "    \n" +
    "    <label class=\"label--primary\">\n" +
    "        {{label}}\n" +
    "    </label>\n" +
    "\n" +
    "\n" +
    "	<label class=\"label--meta\" ng-if=\"description\">\n" +
    "	    {{description}}\n" +
    "	</label>\n" +
    "\n" +
    "    <input class=\"input--box__color colorpicker\" size=\"8\" />\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('src/duration-field/partials/duration-field.html',
    "<div class=\"input--group row\">\n" +
    "    <label class=\"label--primary\">\n" +
    "       \n" +
    "    </label>\n" +
    "\n" +
    "    <div class=\"col-49\">\n" +
    "        <input class=\"input--editor\" type=\"number\" step=\"{{step}}\" min=\"{{min}}\" max=\"{{data.end}}\" placeholder=\"{{placeholder}}\" ng-model=\"data.start\">\n" +
    "        <label class=\"label--secondary\">START</label>  \n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-49\">\n" +
    "        <input class=\"input--editor\" type=\"number\" step=\"{{step}}\" min=\"{{data.start}}\" max=\"{{max}}\" placeholder=\"{{placeholder}}\" ng-model=\"data.end\">     \n" +
    "        <label class=\"label--secondary\">END</label>   \n" +
    "    </div>\n" +
    "</div> "
  );


  $templateCache.put('src/editor-parser/partials/list-parser.html',
    "\n" +
    "<label class=\"label--section\">\n" +
    "    {{$ctrl.label}}\n" +
    "</label>\n" +
    "\n" +
    "<label class=\"label--meta\" ng-if=\"$ctrl.description\">\n" +
    "    {{$ctrl.description}}\n" +
    "</label>\n" +
    "\n" +
    "<section class=\"editor-panel--section\" ng-repeat=\"item in $ctrl.items\" ng-class=\"{'-is-removing' : item.stateRemoving, '-anim--item-shrink' : item.animRemove, '-anim--fadein' : !animRemove && !stateRemoving}\">\n" +
    "\n" +
    "    <spotful-item-parser data=\"item.data\" schema=\"item.schema\" onupdate=\"$ctrl.updateItem(item, data)\">\n" +
    "    </spotful-item-parser>\n" +
    "\n" +
    "    <button class=\"badge--danger\" ng-click=\"$ctrl.removeItem(item)\">\n" +
    "        <i class=\"spoticon icon-close\"></i>\n" +
    "    </button>\n" +
    "\n" +
    "    <!-- <div spotful-dropdown>\n" +
    "    \n" +
    "        <div class=\"editor-panel--menu__toggle\" title=\"Item Options\" spotful-dropdown-toggle>\n" +
    "            <i class=\"spoticon icon-options\"></i>\n" +
    "        </div>\n" +
    "    \n" +
    "        <ul class=\"settings--menu\" spotful-dropdown-target>\n" +
    "            <li class=\"settings--menu__item\" ng-click=\"$ctrl.removeItem(item)\" title=\"Remove this item\">\n" +
    "                Remove Item\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    \n" +
    "    </div> -->\n" +
    "\n" +
    "</section>\n" +
    "\n" +
    "<button class=\"btn--outline__action btn-u--multi\" spotful-dropdown ng-if=\"!$ctrl.hasOneItem\">\n" +
    "\n" +
    "    <div class=\"btn-u--multi__text\" ng-click=\"$ctrl.addItem($ctrl.lastSelectedOption)\" spotful-dropdown-toggle>\n" +
    "        + {{$ctrl.lastSelectedOption.label}}\n" +
    "    </div>\n" +
    "\n" +
    "    <span class=\"btn-u--multi__toggle\" spotful-dropdown-toggle>\n" +
    "    </span>\n" +
    "\n" +
    "    <ul class=\"btn-u--multi__menu\" spotful-dropdown-target>\n" +
    "        <li ng-repeat=\"itemOption in $ctrl.itemsOptions\" class=\"menu--item\" ng-click=\"$ctrl.addItem(itemOption)\">\n" +
    "            {{itemOption.label}}\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "\n" +
    "</button>\n" +
    "\n" +
    "<button class=\"btn--outline__action btn-u--block btn-u--sm mar-t_lg\" ng-click=\"$ctrl.addItem($ctrl.lastSelectedOption)\" ng-if=\"$ctrl.hasOneItem\">\n" +
    "    + {{$ctrl.lastSelectedOption.label}}\n" +
    "</button>\n" +
    "\n" +
    "\n"
  );


  $templateCache.put('src/editor-parser/partials/section-parser.html',
    "<section class=\"editor-section-full\" ng-class=\"{ '-is-open' : $ctrl.showSection, '-collapsible' : $ctrl.collapsible }\">\n" +
    "\n" +
    "    <div class=\"row editor-section-header\" ng-if=\"$ctrl.collapsible\" ng-click=\"$ctrl.toggleSection()\">\n" +
    "       \n" +
    "        <div class=\"img--thumb__sm\">\n" +
    "            <div class=\"editor-section-avatar\" ng-show=\"!$ctrl.section.sectionThumbnail\">{{$ctrl.initials}}</div>\n" +
    "            <img ng-src=\"{{$ctrl.section.sectionThumbnail}}\" ng-show=\"$ctrl.section.sectionThumbnail\">\n" +
    "        </div> \n" +
    "        \n" +
    "        <label class=\"editor-section-header-label\">\n" +
    "            {{$ctrl.section.sectionLabel}}\n" +
    "        </label> \n" +
    "\n" +
    "        <i class=\"spoticon icon-angle-down\"></i>\n" +
    "\n" +
    "    </div>\n" +
    "    \n" +
    "    <div class=\"editor-section-body\">\n" +
    "        <label class=\"label--section\" ng-if=\"$ctrl.label\">\n" +
    "            {{$ctrl.label}}\n" +
    "        </label>\n" +
    "        <spotful-item-parser ng-repeat=\"item in $ctrl.items\" schema=\"item\" data=\"$ctrl.data[item.name]\" onupdate=\"$ctrl.updateItem(item, data)\"></spotful-item-parser>\n" +
    "    </div>\n" +
    "    \n" +
    "</section>\n"
  );


  $templateCache.put('src/email-field/partials/email-field.html',
    "<div class=\"input--group\">\n" +
    "    \n" +
    "    <label class=\"label--primary\" ng-if=\"label\">\n" +
    "        {{label}}\n" +
    "    </label>\n" +
    "\n" +
    "	<label class=\"label--meta\" ng-if=\"description\">\n" +
    "	    {{description}}\n" +
    "	</label>\n" +
    "\n" +
    "    <input type=\"text\" class=\"input--editor\" ng-model-options=\"{ debounce: 200 }\" placeholder=\"{{placeholder}}\" ng-model=\"data\" />\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('src/image-field/partials/image-field-partial.html',
    "<div>\n" +
    "\n" +
    "    <label>{{$ctrl.label}}</label>\n" +
    "\n" +
    "    <!-- {{$ctrl.data}} -->\n" +
    "\n" +
    "     <!-- <input type=\"file\" id=\"file\"  ng-model=\"$ctrl.data.src\"/> -->\n" +
    "     \n" +
    "    <input class=\"input--editor\" type=\"text\" id =\"file\"  ng-model=\"$ctrl.data.src\" placeholder=\"Enter image url\"/>\n" +
    " </div>"
  );


  $templateCache.put('src/json-field/partials/json-field.html',
    "<textarea></textarea>"
  );


  $templateCache.put('src/loading-screen/loading-screen.html',
    "<div class=\"loading-screen\" ng-class=\"{'-is--active' : !stateLoaded, '-is--inactive' :  stateLoaded}\">\n" +
    "\n" +
    "    <div class=\"loading-screen--content\">\n" +
    "        <div class=\"loading-screen--image\">\n" +
    "            <img src=\"/assets/img/status-loading.gif\">\n" +
    "        </div>\n" +
    "        <div class=\"loading-screen--message\">\n" +
    "          {{ loadingMessage }}  \n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('src/location-field/partials/location-field.html',
    "<section class=\"editor-panel--section\">\n" +
    "\n" +
    "    <div class=\"input--group\">\n" +
    "    \n" +
    "        <label class=\"label--primary\">\n" +
    "            Map Address\n" +
    "        </label>\n" +
    "        <input class=\"input--editor\" type=\"search\" placeholder=\"{{placeholder}}\" name=\"searchField\" id=\"searchField\">\n" +
    "\n" +
    "    </div> \n" +
    "\n" +
    "    <div id=\"placeservice-init\"></div>\n" +
    "\n" +
    "</section>"
  );


  $templateCache.put('src/number-field/partials/number-field.html',
    "<div class=\"input--group\">\n" +
    "    \n" +
    "    <label class=\"label--primary\">\n" +
    "        {{label}}\n" +
    "    </label>\n" +
    "    \n" +
    "    <label class=\"label--secondary\" ng-if=\"description\">\n" +
    "        {{description}}\n" +
    "    </label>\n" +
    "    \n" +
    "    <input type=\"number\" class=\"input--editor\" placeholder=\"{{placeholder}}\" ng-model=\"data\" step=\"{{step}}\" min=\"{{min}}\" max=\"{{max}}\">\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('src/option-field/partials/option-field.html',
    "<div class=\"input--group\">\n" +
    "    \n" +
    "    <label class=\"label--primary\">\n" +
    "        {{label}}\n" +
    "    </label>\n" +
    "\n" +
    "    <label class=\"label--secondary\" ng-if=\"description\">\n" +
    "        {{description}}\n" +
    "    </label>\n" +
    "\n" +
    "        <label class=\"radio-btn--container tooltip--trigger\" ng-repeat=\"option in options\" >\n" +
    "\n" +
    "            <input type=\"radio\" ng-value=\"{{option.value}}\" ng-model=\"data\"/>\n" +
    "\n" +
    "            <div class=\"radio-btn--icon\" ng-class=\"{ '-is--active' : option.value == data }\">\n" +
    "                <div ng-hide=\"true\" class=\"spoticon icon-circleshape\"></div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"tooltip--content__top -sm -dark\">\n" +
    "                {{option.label}} \n" +
    "            </div>\n" +
    "\n" +
    "        </label>\n" +
    "</div>"
  );


  $templateCache.put('src/password-field/partials/password-field.html',
    "<div class=\"input--group\">\n" +
    "    \n" +
    "    <label class=\"label--primary\">\n" +
    "        \n" +
    "    </label>\n" +
    "    <input type=\"password\" class=\"input--editor\" placeholder=\"\" name=\"\" ng-model=\"\">\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('src/popup/partials/default-popup.html',
    "<article class=\"popup--card__sm\">\n" +
    "\n" +
    "	<div class=\"popup--card__close\" ng-click=\"cancel()\" ng-show=\"config.showModalCloseControl\">\n" +
    "		<span class=\"spoticon icon-close\"></span>\n" +
    "	</div>\n" +
    "\n" +
    "	<img ng-srcset=\"/assets/img/modal-{{config.modalImage}}@2x.png 2x, /assets/img/modal-{{config.modalImage}}.png 1x\" ng-src=\"/assets/img/modal-{{config.modalImage}}.png\" class=\"popup--card__img\" ng-show=\"config.modalImage\">\n" +
    "\n" +
    "	<h3 class=\"popup--card__heading\">\n" +
    "		{{config.modalHeading}}\n" +
    "	</h3>\n" +
    "\n" +
    "	<label class=\"popup--card__message\">\n" +
    "		{{config.modalDescription}}\n" +
    "	</label>\n" +
    "	\n" +
    "	<div class=\"popup--card__actions\">\n" +
    "\n" +
    "		<button class=\"btn--clear__neutral\" ng-click=\"cancel()\" type=\"button\" ng-show=\"config.modalCancel\" id=\"Cancel\">\n" +
    "			{{config.modalCancel}}\n" +
    "		</button>\n" +
    "\n" +
    "		<a ng-href=\"{{config.modalSubmitLink}}\" ng-show=\"config.modalSubmit\">\n" +
    "			<button ng-class=\"{'btn--outline__danger' : config.modalType == 'danger', 'btn--outline__action' : config.modalType == 'neutral', 'btn--outline__action' : config.modalType == 'action'}\" ng-click=\"submit()\" type=\"button\" id=\"Delete\">\n" +
    "				{{config.modalSubmit}}\n" +
    "			</button>\n" +
    "		</a>\n" +
    "\n" +
    "	</div>\n" +
    "\n" +
    "</article>\n"
  );


  $templateCache.put('src/popup/partials/editor-popup.html',
    "<div ng-repeat=\"popupeditoritem in popupeditoritems\">\n" +
    "	<div class=\"editor-dialog\" ng-class=\"{ '-is-entering' : popupeditoritem }\">\n" +
    "		<div class=\"editor-dialog-content\">\n" +
    "			<editor-popup-item config=\"popupeditoritem.config\" data=\"popupeditoritem.data\" submit=\"popupeditoritem.resolve\" cancel=\"popupeditoritem.reject\" then=\"popupeditoritem.promise.then\" catch=\"popupeditoritem.promise.catch\"></editor-popup-item>\n" +
    "		</div>\n" +
    "	</div>\n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('src/popup/partials/slide-popup.html',
    "<div class=\"slide-dialog--content\" ng-show=\"show\" ng-model-options=\"{ debounce: 250 }\">\n" +
    "    \n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('src/range-field/partials/range-field.html',
    "<div class=\"input--group\">\n" +
    "\n" +
    "    <label class=\"label--primary\">\n" +
    "        {{label}}\n" +
    "    </label>\n" +
    "\n" +
    "    <label class=\"label--secondary\" ng-if=\"description\">\n" +
    "        {{description}}\n" +
    "    </label>\n" +
    "\n" +
    "    <div class=\"input--group row\">\n" +
    "\n" +
    "        <div class=\"range--input__container\">\n" +
    "            <input class=\"range--input\" ng-model=\"data\" ng-change=\"updateData()\" type=\"range\" name=\"{{name}}\" min=\"{{min}}\" max=\"{{max}}\" step=\"{{step}}\">\n" +
    "            <div class=\"range--input__buffer\" ng-style=\"{ 'width' : 100*data/max + '%' }\"></div>\n" +
    "            <div class=\"range--input__labels\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "        <input class=\"input--editor__sm\" type=\"number\" ng-model=\"data\" ng-model-options=\"{debounce: 250}\" ng-change=\"updateData()\" min=\"{{min}}\" max=\"{{max}}\">\n" +
    "\n" +
    "    </div>\n" +
    "</div>"
  );


  $templateCache.put('src/richtext-field/partials/richtext-field.html',
    "<div class=\"input--group\">\n" +
    "    \n" +
    "    <label class=\"label--primary\">\n" +
    "        {{ label }}\n" +
    "    </label>\n" +
    "    <label class=\"label--secondary\" ng-if=\"description\">\n" +
    "        {{ description }}\n" +
    "    </label>\n" +
    "\n" +
    "    <div class=\"richtext--editor\" text-angular=\"text-angular\" ta-toolbar=\"[['h1','h2', 'p','bold','italics','ul','ol','quote','insertImage','insertLink','justifyLeft','justifyCenter','html']]\" ng-model=\"dataHtml\" placeholder=\"{{placeholder}}\"></div>\n" +
    "\n" +
    "</div>  "
  );


  $templateCache.put('src/search-field/partials/search-field.html',
    "<div class=\"input--group\">\n" +
    "    <label class=\"label--input\">\n" +
    "        {{label}}\n" +
    "    </label>\n" +
    "    <label class=\"label--secondary\" ng-if=\"description\">\n" +
    "        {{description}}\n" +
    "    </label>\n" +
    "    <div class=\"input--group\">\n" +
    "        <input class=\"input--editor\" ng-class=\"{ '-is-loading' : stateLoading }\" ng-modal-options=\"{debounce: 500}\" placeholder=\" {{placeholder}}\" ng-model=\"searchField\" type=\"search\">\n" +
    "        <i class=\"spoticon icon-search\"></i>\n" +
    "        <ul class=\"input--dropdown__box\" ng-class=\"{ '-is--active' : hasResults }\">\n" +
    "            <li class=\"input--dropdown__item\" ng-repeat=\"item in results\" ng-click=\"selectItem(item)\">\n" +
    "                <figure class=\"list--media__img img--thumb__sm\">\n" +
    "                    <img ng-src=\"{{item.thumbnail}}\" alt=\"Avatar for {{item.label}}\">\n" +
    "                </figure>\n" +
    "                <label class=\"list--media__title\">{{item.label}}</label>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "</div>"
  );


  $templateCache.put('src/search-link/partials/search-link-item-vimeo.html',
    "<div class=\"badge-xs left mar-r_sm\">\n" +
    "	<img ng-src=\"{{link.data.thumbnail_url}}\"/>\n" +
    "</div>\n" +
    "<div class=\"left col-10\">\n" +
    "	<div class=\"truncate\">{{link.name}}</div>\n" +
    "	<div class=\"text-sm text-color -gray truncate\">{{link.url}}</div>\n" +
    "</div>"
  );


  $templateCache.put('src/search-link/partials/search-link-item-youtube.html',
    "<div class=\"badge-xs left mar-r_sm\">\n" +
    "	<img ng-src=\"{{link.thumbnail}}\"/>\n" +
    "</div>\n" +
    "<div class=\"left col-10\">\n" +
    "	<div class=\"truncate\">{{link.name}}</div>\n" +
    "	<div class=\"text-sm text-color -gray truncate\">{{link.url}}</div>\n" +
    "</div>"
  );


  $templateCache.put('src/search-link/partials/search-link.html',
    "<input class=\"input--editor\" ng-change=\"parseLink()\" placeholder=\"Add URL here\" type=\"text\" name=\"Link url\" ng-model=\"searchLinkField\" autofocus/>\n" +
    "\n" +
    "\n" +
    "\n"
  );


  $templateCache.put('src/select-field/partials/select-field.html',
    "<div class=\"input--group\">\n" +
    "    <label class=\"label--primary\">\n" +
    "        {{label}}\n" +
    "    </label>\n" +
    "    <label class=\"label--secondary\" ng-if=\"description\">\n" +
    "        {{description}}\n" +
    "    </label>\n" +
    "    \n" +
    "    <div class=\"input--group\">\n" +
    "            \n" +
    "    	<select class=\"input--editor__select\" ng-model=\"data\" ng-change=\"updateData()\" name=\"{{name}}\">\n" +
    "            <option value=\"{{option.value}}\" ng-repeat=\"option in options\">{{option.label}}</option>\n" +
    "    	</select>\n" +
    "    \n" +
    "    	<i class=\"spoticon icon-angle-down\"></i>\n" +
    "    \n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n"
  );


  $templateCache.put('src/switch-field/partials/switch-field.html',
    "<div class=\"input--group\">\n" +
    "\n" +
    "    <label class=\"label--primary\">\n" +
    "        {{label}}\n" +
    "    </label>\n" +
    "    <label class=\"label--secondary\" ng-if=\"description\">\n" +
    "        {{description}}\n" +
    "    </label>\n" +
    "\n" +
    "    <label class=\"ui--switch\" >\n" +
    "\n" +
    "    	<input type=\"checkbox\" ng-change=\"updateData()\" name=\"{{name}}\" ng-model=\"data\"></input>\n" +
    "\n" +
    "    	<div class=\"ui--switch__container\">\n" +
    "    		<div class=\"ui--switch__track\">\n" +
    "    			<div class=\"ui--switch__thumb\">\n" +
    "    			</div>\n" +
    "    		</div>\n" +
    "            <span class=\"ui--switch__label label--true\">\n" +
    "                On\n" +
    "            </span>\n" +
    "            <span class=\"ui--switch__label label--false\">\n" +
    "                Off\n" +
    "            </span>\n" +
    "    	</div>\n" +
    "    </label>\n" +
    "\n" +
    "</div>\n" +
    "   \n"
  );


  $templateCache.put('src/text-field/partials/text-field.html',
    "<div class=\"input--group\">\n" +
    "    \n" +
    "    <label class=\"label--primary\">\n" +
    "        {{label}}\n" +
    "    </label>\n" +
    "\n" +
    "	<label class=\"label--meta\" ng-if=\"description\">\n" +
    "	    {{description}}\n" +
    "	</label>\n" +
    "\n" +
    "    <input type=\"text\" ng-model-options=\"{ debounce: 250 }\" class=\"input--editor\" placeholder=\"{{placeholder}}\" name=\"{{name}}\" ng-model=\"data\" value=\"{{default}}}\">\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('src/url-field/partials/url-field.html',
    "<div class=\"input--group\">\n" +
    "    \n" +
    "    <label class=\"label--primary\">\n" +
    "        {{label}}\n" +
    "    </label>\n" +
    "    <input type=\"url\" class=\"input--editor\" placeholder=\"{{placeholder}}\" ng-model=\"data\" ng-model-options=\"{ debounce: 250 }\">\n" +
    "\n" +
    "</div>"
  );

}]);

/**
 * @memberof SpotfulUi 
 * @name Alerts directive
 *
 * @ngdoc directive
 */
angular.module('ui.alert').directive('spotfulAlerts', ['$compile', 'AlertService', '$timeout', function($compile, AlertService, $timeout) {
    return {
        restrict: 'E',
        templateUrl: 'src/alert/partials/alerts.html',

        scope: {},

        link: {

            pre: function(scope, attr, element) {

                // Alerts stack in current scope.
                scope.alerts = [];

                // Override onAlert service method in order to customize alert rendering.
                AlertService.onAlert = function(a) {
                    // Slip alert at the bottom of the stack.
                    scope.alerts.push(a);

                    // Show the 1st alert in the stack.
                    if (scope.alerts.length === 1) {
                        showNextAlert();
                    }

                    // Implement alert dismiss logic.
                    a.dismiss = function() {
                        // Get the index of the alert in the stack.
                        var index = scope.alerts.indexOf(a);

                        // Is the given alert in the stack?
                        if (index != -1) {
                            //If so,

                            // Set "show" to false to start the active animation.
                            a.show = false;

                            $timeout(function() {
                                // Remove alert from the stack.
                                scope.alerts.splice(index, 1);
                                showNextAlert();
                            }, 500);
                        }
                    };
                };


                // Function to show the next alert in the stack.
                function showNextAlert() {
                    if (scope.alerts.length > 0) {
                        var current = scope.alerts[0];

                        if (current.show == false) {
                            $timeout(function() {
                                current.show = true;

                                // Should we dismiss the alert automatically?
                                if (current.timeout > 0) {
                                    // If yes,
                                    $timeout(function() {
                                        current.dismiss();
                                    }, current.timeout);
                                }
                            }, 200);
                        }
                    }
                };
            },

            post: function(scope, element, attr) {
                if (window.session_status != undefined) {
                    // Looks up in the session_status global variable
                    AlertService.message(window.session_status);

                    // clean up
                    window.session_status = undefined;
                }
            }

        }
    }
}]);

/**
 * @memberof SpotfulUi 
 * @ngdoc service
 * @author  The Spotful Team
 * @since   2016/9/8
 */
angular.module('ui.alert').service('AlertService', [function() {

    // Store this reference.
    var self = this;

    // Alerts queue.
    this.alerts = [];

    // Abstraction to be overridden in the directive.
    this.onAlert = function() {}

    // Function to call the alert-service.
    this.message = function(message, type, options) {

        if (!this.isValidType(type)) {
            type = 'neutral';
        }

        // Build alert object.
        var a = this.buildAlert(message, type, options);

        // Bubble event.
        this.onAlert(a);

        return a;
    };

    // Function to verify alert type.
    this.isValidType = function(type) {
        var validType = ['neutral', 'action', 'danger'];

        if (validType.indexOf(type) != -1) {
            return true;
        }

        return false;
    }

    // Function to build an alert object.
    this.buildAlert = function(message, type, options) {

        //If not options passed in the alert box build a option object.
        options = (options != undefined) ? options : {};

        var alert = {
            show: false,
            message: message,
            type: type,
            dismiss: function() {} // Abstract method.
        }

        alert.timeout = (options.timeout != undefined) ? options.timeout : 5000;

        alert.buttons = (options.buttons != undefined) ? options.buttons : [{
                type: 'dismiss',
                label: 'Hide',
                callback: function() {
                    alert.dismiss();
                }
            }
            // Optionally :
            // { type : 'action', label : '{some-action}', callback : {some-callback}  }
        ];

        return alert;
    };
}]);

/**
 * AutoUpdateInput
 * Allows you to hook up a auto update flow to an input field. 
 * 
 * @example <auto-update-input on-update="fn" ng-model="importantText"></auto-update-input>
 * 
 * @param on-update handles the function to fire when an update is invoked. If you want to track the status of your query simply return que $q promise pattern to your function. The directives will rely on those to monitor the status of the query.
 * @param ngModel handles the value bound to it. (exactly like ng-model already behaves.)
 */
angular.module('ui').directive('autoUpdateInput', ['$timeout', function($timeout) {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'src/auto-update-input/partials/auto-update-input.html',

        scope: {
            onUpdate: "&",
            ngModel: "="
        },

        link: function(scope, element, attr) {

            scope.status = "inactive";
            //List of supported status
            //scope.status = editing;
            //scope.status = pending;
            //scope.status = success;

            var imageSuccess = "/assets/img/status-success.gif";
            var imagePending = "/assets/img/status-loading.gif";
            var imageEditing = "/assets/img/status-editing.gif";

            scope.statusImage;


            //Triggered on focus
            scope.startEdit = function() {

                //We turn on the editiing state.
                // scope.status = "editing";
                // scope.statusImage = imageEditing;

                scope.status = "inactive";
                scope.statusImage;
            }

            //Triggered on blur
            scope.endEdit = function() {

                if (typeof scope.onUpdate === "function") {

                    var promise = scope.onUpdate();

                    ///Only if the defer pattern is availble we can handle the updating cycle
                    if (typeof promise.then == "function") {

                        scope.status = "updating";
                        scope.statusImage = imagePending;

                        promise.then(function(data) {

                            scope.status = "updated";
                            scope.statusImage = imageSuccess;

                            /*	$timeout(function () {
                            		scope.status = "inactive";
                            		scope.statusImage = null;
                            	}, 3500);*/

                        });
                    }

                    if (typeof promise.catch == "function") {

                        promise.catch(function(error) {

                            scope.status = "inactive";
                            scope.statusImage = null;

                        });
                    }
                }

            }

            //Check whether the user pressed enter key, if so submit invoke end edit
            scope.checkEndEdit = function(event) {

                if (event.keyCode == 13) {

                    event.target.blur();
                }
            }

        }
    }
}]);

/**
 * Allows you to pick colors from an interactive color picker pallette.  American colors.  Huge colors.  The greatest colors.  I suppose it lets you pick any colour, however.  
 * This ui components is using jquery minicolor. To consult the documentation : http://labs.abeautifulsite.net/jquery-minicolors/
 * 
 * @memberof SpotfulUi 
 * @name Color Field 
 * @param { String } data The colour specified in hexadecimal format (00FF00 for Green, for example).
 * @param { String } label The label to be applied to the colour picker ("Select a colour!", for eample).
 * @param { String } description The description for that field (optional).
 * @param { String } default The default value to start with.
 * @param { Function } This function will fire when the color changed.
 * @example <spotful-color-field data="data" label="Murica" onupdate="parentUpdateItem(data)"></spotful-color-field>
 * @ngdoc directive
 */

angular.module('ui').directive('spotfulColorField', ['$timeout', function($timeout) {
    return {
        restrict: 'E',
        templateUrl: 'src/color-field/partials/color-field.html',

        scope: {

            data: "<",
            default:"@",
            label: "@",
            description: "@",
            onupdate: "&"

        },
        link: function(scope, element, attr) {

            var color = '';
            var colorpicker_field = element.find('.colorpicker');

            //We check if there is a default value.
            if(scope.data == undefined && scope.default != undefined) {

                scope.data = scope.default;

                scope.onupdate({
                    data: scope.data
                });

            }

            if (scope.data != undefined) {

                //We set the local color reference.
                color = scope.data;

            }

            colorpicker_field.minicolors({
                changeDelay: 0,
                defaultValue: color,
                change: function(hex, opacity) {

                    //Only update when the color is actually different
                    if (color != hex) {
             
                        color = hex;
                        scope.onupdate({
                            data: hex
                        });
             
                    }

                }
            
            });

            //We watch for any updates coming from the parent.
            scope.$watch('data', function() {

                //If undefined don't updated the field.
                if (scope.data == undefined || color == scope.data) {
                    return;
                }

                //We set the local color reference.
                color = scope.data;

                colorpicker_field.minicolors('value', {
                    color: color
                });

            });

        }
    }
}]);

/**
 * Rolls down a menu interface. 
 * @memberOf SpotfulUi
 * @name  Dropdown Menu
 * @ngdoc directive
 */
angular.module('ui').directive('spotfulDropdown', ['$timeout', function($timeout) {
    return {

        restrict: 'A',

        link: function(scope, element, attr) {

            // To use:
            // add the attribute `spotful-dropdown` to the parent element
            element.find('[spotful-dropdown-toggle]').click(function(event) {

                element.find('[spotful-dropdown-target]').toggleClass('-is-visible');

                $timeout(function() {

                    $(window).bind('click', closeDropdown);

                }, 10);

            });

            var closeDropdown = function(event) {
                
                element.find('[spotful-dropdown-target]').removeClass('-is-visible');

                $timeout(function() {

                    $(window).unbind('click', closeDropdown);

                }, 10);

            }

        }

    };

}]);

angular.module('ui').directive('spotfulDurationField', [function() {

    return {
        restrict: 'E',

        // Min and Max required for both?
        // Secondary labels required for both?
        // Talk to me!
        scope: {
            label: "@",
            description: "@",
            placeholder: "@",
            min: "@",
            max: "@",
            step: "@",

            data: "<",
            default : "<",
            onupdate: "&"
        },

        templateUrl: 'src/duration-field/partials/duration-field.html',

        link: function(scope, element, attr) {

              //We check if there is a default value.
            if(scope.data == undefined && scope.default != undefined) {

                if(scope.default.start != undefined) {

                    scope.default.start = Number(scope.default.start);

                }

                if(scope.default.end != undefined) {

                    scope.default.end = Number(scope.default.end);

                }

                scope.data = scope.default;

                scope.onupdate({
                    data: scope.data
                });

            }

            if(scope.data == undefined) {

                scope.data = {
                    start : scope.max,
                    end : scope.min
                }
            }
 
            scope.updateData = function() {

                scope.onupdate({
                    data: scope.data
                });

            }

        }

    };

}]);

/**
 * The item parser provides dynamcity in the system. This item behaves as a wrapper on each 
 * item of the template to inject the appropriate item according to its type.
 * 
 * @class SpotfulItemParser
 * @memberof SpotfulEditorParser
 * @ngdoc directive
 * @example <spotful-item-parser data="data" schema="schema" onupdate="parentUpdateItem(itemKey, data)"></spotful-item-parser>
 */
angular.module('ui.editor-parser').directive('spotfulItemParser', ['$compile', 'SpotfulEditorParser', function($compile, SpotfulEditorParser) {
    return {

        restrict: 'E',

        scope: {
            data: "<",
            schema: "<",
            onupdate: "&"
        },

        link: {

            pre: function($scope, $element, attrs) {


            },

            post: function($scope, $element, attrs) {

                $scope.$watch('schema', function() {

                    compile();

                }, true);


                var compile = function() {

                    if ( $scope.schema == undefined ) {

                        return;
                    }

                    var editorTypeComponent = SpotfulEditorParser.getComponentFieldByType($scope.schema.type);

                    if (editorTypeComponent != undefined) {

                        var element = document.createElement(editorTypeComponent.element);

                        // We pass the schema object as the child.
                        element.setAttribute('schema', 'schema');

                        // We directly pass the data to the child.
                        element.setAttribute('data', 'data');

                        var attributes = editorTypeComponent.attributes;

                        // We provide extended attributes to the component specification 
                        for (var i in attributes) {

                            element.setAttribute(i, attributes[i]);

                        }
                   
                        //We inject all attributes coming from the schema specification.
                        for (var i in $scope.schema) {

                            //We exclude unwanted attributes
                            if (i == '$$hashKey' ||
                                i == 'fields' ||
                                i == 'type' ||
                                i == 'data') {

                                continue;
                            }

                            if(typeof $scope.schema[i] == 'object') {
                                
                                element.setAttribute(i, 'schema.'+i);
                            
                            } else {
                                
                                element.setAttribute(i, $scope.schema[i]);
                            
                            }

                            

                        }

                        //We provide the update accessor to the child.
                        element.setAttribute('onupdate', 'updateItem(data)');

                        $element.html('');

                        $element.append(element);

                        $compile($element.contents())($scope);

                    }

                }

                /**
                 * Accessor method for updating item. This method takes care of ditributing the data to the parent context by maintaining its key.
                 * 
                 * @param  {Object} data Payload of the data 
                 * @memberof SpotfulEditorParser.SpotfulItemParser
                 * 
                 */
                $scope.updateItem = function(data) {

                    $scope.onupdate({
                        item: $scope.schema,
                        data: data
                    });

                }

            }

        },

    };
}]);

/**
 * @class SpotfulList
 * @ngdoc component
 * @memberof EditorParser
 * @description The MultiList item allows to set a dynamic list of multiple type item. 
 * @example
 *  // This is how you would specify a section in your manifest
 *  {
 *    "type" : "multilist",
 *    "name" : "Gallery",
 *    "label" : "Multimedia Gallery",
 *    "fields" : [
 *        { "type" : "image",
 *          "name" : "Image"},
 *        { "type" : "video",
 *          "name" : "Video"}
 *    ]
 *  }
 *  // Every first level item in the field will be used as optional item to add. 
 *  // Therefore in this example you have image option and a video option.  
 *  
 * @param {Object} data The object describing the nested payload of the section.
 * @param {Object} schema The object describing the nested structure of the section.
 * @param {Function} onupdate The function to fire everytime an item is being changed in the section structure.

 */

SpotfulListParserController.$inject = [
'$log',
'$scope'
]

function SpotfulListParserController($log, $scope) {

    var ctrl = this;

    ctrl.items = [];

    //The data used to track the payload
    ctrl.itemsData = {};

    ctrl.itemsOptions = [];

    //The last selected option will be used for the choices available in the dropdown.
    ctrl.lastSelectedOption = {};

    ctrl.hasOneItem = false;

    ctrl.title = '';
    ctrl.label = '';
    ctrl.description = '';

    ctrl.$onChanges = function(changes) {


        if (changes.schema != undefined) {

            ctrl.itemsOptions = ctrl.schema.fields;

            //We add the first item as the last selected item.
            if(ctrl.itemsOptions[0] != undefined) {

                ctrl.setLastSelectedItemOption(ctrl.itemsOptions[0]);

            }

            if(ctrl.itemsOptions.length == 1) {

                ctrl.hasOneItem = true;

            }

        }

        if (changes.data != undefined) {

            for (var i in ctrl.data) {

                 var item = ctrl.getItem(ctrl.data[i].id);


                //If the payload doesnt have an index try to add the item to the list
                if(item == undefined) {

                    var schema = getItemOption(ctrl.data[i].item);


                    ctrl.addItem(schema, ctrl.data[i].data);

                } else {

                   
                    item.data = ctrl.data[i].data;
                    
                }



            }


        }


        ctrl.title = ctrl.schema.name;
        ctrl.label = ctrl.schema.label;
        ctrl.description = ctrl.schema.description;

    };


    ctrl.generateUniqueId = function () {


        return Math.floor(Math.random()*100000000000000);

    }

    ctrl.setLastSelectedItemOption = function (itemOption) {

        ctrl.lastSelectedOption = itemOption;

    }

    /**
     * Finds the corresponding item schema according to the name provided.
     * 
     * @param  {String} name the name of the item schema to return.
     * @return {Object} returns the object of the schema item.
     */
    var getItemOption = function(name) {

        for (var i in ctrl.itemsOptions) {

            if (name == ctrl.itemsOptions[i].name) {

                return ctrl.itemsOptions[i];
            }
        }
    }

    /**
     * Adds an new item to the list.
     * 
     * @class SpotfulListParser 
     * @param {Object} itemStructure The schema of the new item being created.
     * @param {Object} itemData The data to inject in the item being added (optional).
     */
    ctrl.addItem = function(itemStructure, itemData) {

        var item = {

            schema : angular.copy(itemStructure)

        };

        console.log(item.schema);

        //We set the last selected item to the current selected item option
        ctrl.setLastSelectedItemOption(itemStructure);


   
        if(item.id == undefined) {

            item.id = ctrl.generateUniqueId();
        }

        //We inject an id to the item
        if (item.schema.id == undefined) {

            item.schema.id = item.id;

        }

        if (itemData != undefined) {
            item.data = itemData;
        }

        ctrl.items.push(item);
        

    }

    var generatePayload = function(schema, data) {

        if (ctrl.itemsData == undefined) {
            ctrl.itemsData = {};
        }

        if (schema.id == undefined) {

            schema.id = ctrl.generateUniqueId();
        }


        var item = {

            "data" : data,
            "id"   : schema.id,
            "schema" : schema
        }


       //Lets add the id of the item in the payload.
       
        for(var i in ctrl.items) {

            if(ctrl.items[i].id == item.id) {

                ctrl.items[i] = item;

            } 
        }

    }

    ctrl.getItem = function (id) {

        for(var i in ctrl.items) {

            if(ctrl.items[i].id == id) {

                return ctrl.items[i];

            } 
        }
    }

    ctrl.removeItem = function(item) {

        item.stateRemoving = true;
        item.animRemove = true;

        setTimeout( function() {
            
            item.stateRemoving = false;
            item.animRemove = false;

            //We remove the item from the payload.
            delete ctrl.itemsData[item.schema.id];

            //We remove the item from the interface.
            var index = ctrl.items.indexOf(item);

            if (index > -1) {
                ctrl.items.splice(index, 1);
            }

            ctrl.update();

            $scope.$digest();

        }, 350);

    }

    ctrl.updateItem = function(schema, data) {


        console.log(schema, data);

        if(schema == undefined || data == undefined) {

            return;
        }

        var item = {

            "data" : data,
            "id"   : schema.id,
            "schema" : schema
        }


       //Lets add the id of the item in the payload.
       
        for(var i in ctrl.items) {

            if(ctrl.items[i].id == undefined) {

            }

            if(ctrl.items[i].id == item.id) {

                if(ctrl.items[i].data != item.data) {

                    ctrl.items[i].data = item.data;

                }
               
            } 
        }


        ctrl.update();

    }

    ctrl.update = function () {

        var formatedData = [];

        for (var i in ctrl.items) {

            formatedData.push({

                "data" : ctrl.items[i].data,
                "item" : ctrl.items[i].schema.name,
                "id"   : ctrl.items[i].id

            });
        }

        ctrl.onupdate({
            'data': formatedData
        });

    }

}

angular.module('ui.editor-parser').component('spotfulListParser', {

    templateUrl: 'src/editor-parser/partials/list-parser.html',
    controller: SpotfulListParserController,
    bindings: {

        data: "<",
        schema: "<",
        onupdate: "&",
        label : "@",
        description : "@"

    }
});

/**
 * @description  A section is a structural node that allows to regroup multiple items in a section. <br/>
 * It is a primitive type of the editor.<br/>
 * To express the section in a template manifest you need to specify the sub <em>Fields</em> of your item.
 * 
 *  @example 
 *  //This is how you would specify a section in your manifest.
 *  {
 *   "type": "section",
 *   "name" : "Image",
 *   "label": "Image Item",
 *   "fields": [
 *       { },
 *       ...
 *   ]
 *
 *   } 
 *   @example 
 *   <!--This is how you would inject the component as root in the structure.-->
 *   <spotful-section-parser manifest="manifestObj" data="dataObj" udpate="saveToServer(data)"></spotful-section-parser>
 *   <!--manifestObj being your object that represents the structure of your section, 
 *       dataObj being the payload object of your section and update being the function to
 *       fire once the data is updated.-->
 *
 * @param {Object} data The object describing the nested payload of the section.
 * @param {Object} schema The object describing the nested structure of the section.
 * @param {Function} onupdate The function to fire everytime an item is being changed in the section structure.
 * @class SpotfulSectionParser
 * @ngdoc component
 * @memberof EditorParser
 */

angular.module('ui.editor-parser').component('spotfulSectionParser', {
    
    templateUrl: 'src/editor-parser/partials/section-parser.html',
    controller: ['$log', '$scope', SpotfulSectionParserController],
    bindings: {
        data: "<", 
        schema: "<", 
        onupdate: "&",
        label : "@",
        description : "@"
    }
});
function SpotfulSectionParserController($log,$scope) {

    // Used for empty items
    var defaultLabel = "Empty item"
    var ctrl = this;
    var itemsData = {};
    ctrl.label = '';
    ctrl.description = '';
    ctrl.section = {};
    ctrl.showSection = false ; // controls the -is-active class given to the html to hide or show the section body
    ctrl.collapsible = false; // a flag that corresponds to the value given in the manifest , it determins if a section is collapsible or not 
    ctrl.$onChanges = function(changes) {

        
        if (changes.data != undefined && ctrl.data != undefined) {

            for (var i in ctrl.data) {
                itemsData[i] = ctrl.data[i];
            }

        }

        // SCHEMA is the payload received from the manifest 
        // schema = undefined means no new changes 
        // ctrl.schema carries the exposed payload on the scope 
        if (changes.schema != undefined && ctrl.schema != undefined) {
            //if there is a header , we should display it instead of just the label
            if(ctrl.schema.header != undefined){
                //expose the collapsible flag     
                ctrl.collapsible = true;

                handleCollapsibleSection(ctrl.schema, ctrl.data);
            }
            
            
            ctrl.items = ctrl.schema.fields;
            
            ctrl.label = ctrl.schema.label;
            
            ctrl.description = ctrl.schema.description;

        }

    };

    ctrl.toggleSection = function (){
        
        ctrl.showSection = !ctrl.showSection;

    }

    var checkLabel = function(sectionLabel,sectionThumbnail,data){
         // if data of that retference exists 
         if (data[sectionLabel] !== undefined && data[sectionLabel] !== "") {
            //get the value of that key and expose it to the scope 
            ctrl.section.sectionLabel = data[sectionLabel];
            
        } else if ( data[sectionThumbnail] ) {
           
            if (data[sectionThumbnail].title != undefined && data[sectionThumbnail].src !== undefined && data[sectionThumbnail].src !== "") {
                ctrl.section.sectionLabel = data[sectionThumbnail].title;      
            }else{
                ctrl.section.sectionLabel = defaultLabel;
            }
            
        } else {
            ctrl.section.sectionLabel = defaultLabel;
        }

    }
    var checkThumbnail = function(sectionThumbnail,sectionLabel,data){
         // if the thumbnail is available 
        if (data[sectionThumbnail] !== undefined && data[sectionThumbnail] !== "" && data[sectionThumbnail].src !== undefined && data[sectionThumbnail].src !== "") {
            // and if the src of the thumbnail is available  
            //get the value of that key and expose it to the scope 
            ctrl.section.sectionThumbnail = data[sectionThumbnail].src;
            // if no src available 
        } else {
            ctrl.section.sectionThumbnail = "";
        }

    }
    var handleCollapsibleSection = function (item, data){
        
        console.log('data',data)
        var sectionLabel = item.header.label_reference;
        var sectionThumbnail = item.header.thumbnail_reference;
        
        if (data === undefined) {
            ctrl.section.sectionThumbnail = "";
            ctrl.section.sectionLabel = defaultLabel;

            getInitial(ctrl.section.sectionLabel);
            
            return;
        } 
        
        // if label ref is available 
        checkLabel(sectionLabel,sectionThumbnail,data);
        
        // if thumbnail reference exists 
        checkThumbnail(sectionThumbnail,sectionLabel,data); 

        // Create the avatar from the label
        getInitial(ctrl.section.sectionLabel);
        
    }

    /**
     * getInitial
     * @memberOf EditorParser.SpotfulSectionParser
     * @param  {String} name used to pull the first initial from and display instead of image
     */
    var getInitial = function(name) {
        ctrl.initials = name.charAt(0).toUpperCase();
    }

    /**
     * updateItem
     * @memberOf EditorParser.SpotfulSectionParser
     * @param  {Object} item The item reference of the updated item.
     * @param  {Object} data The data payload of the updated item.
     */
    ctrl.updateItem = function(item, data) {
        
        
        // console.log('item : ' ,item , 'data : ', data , "ctrl.schema",ctrl.schema, "ctrl.data", ctrl.data)
        if (item == undefined || item.name == undefined) {

            $log.error("Item reference is missing.");
            return;

        } 

        itemsData[item.name] = data;

        ctrl.onupdate({
            'data': itemsData
        });
        
        // console.log('itemsData : ', itemsData);
        if(ctrl.schema.header !== undefined){
            
            handleCollapsibleSection(ctrl.schema, itemsData);

            // Create the avatar
            getInitial(ctrl.section.sectionLabel);

        }
    }
}



/**
 * This service allows you to extend parsable fields in the editor. 
 * 
 * @class SpotfulEditorParserService
 * @ngdoc service
 * @memberof EditorParser
 */
angular.module('ui.editor-parser').service('SpotfulEditorParser', ['$log', function($log) {

    var self = this;

    var types = {

        "section": {
            element: "spotful-section-parser"
        },
        "list": {
            element: "spotful-list-parser"
        },
        "image": {
            element: "spotful-image-parser"
        },
        "text": {
            element: "spotful-text-field"
        },
        "color" : {
            element: "spotful-color-field"
        },
        "email": {
            element: "spotful-email-field"
        },
        "range": {
            element: "spotful-range-field"
        },
        "select" : {
            element: "spotful-select-field"
        },
        "duration": {
            element: "spotful-duration-field"
        },
        "number": {
            element: "spotful-number-field"
        },
        "url": {
            element: "spotful-url-field"
        },
        "image": {
            element: "spotful-image-field"
        },
        "boolean": {
            element: "spotful-switch-field"
        },
        "richtext": {
            element: "spotful-richtext-field"
        }

    }

    /**
     * Returns the component tag markup according to the type of field provided.  This function is an internal process.  
     * 
     * @memberOf  EditorParser.SpotfulEditorParserService
     * @param  {String} type The type to retrive the markup from. 
     * @return {Object}      The component definition to be injected.
     */
    this.getComponentFieldByType = function(type) {

        var component = types[type];

        if (component == undefined) {
            $log.error("Unknown Field type " +type+ ", please review your manifest specs.");
        }

        return component;
    }

    /**
     * Allows to register a new component to a field type. This can be used to override field to point to a new component.<br/>
     * <br/>
     * To use this tool, you will have to create a new component available by the system. Then you will have to inject the corresponding tagname to the desired field.
     * <br/>
     *
     *  To implement your component or directive in the system properly, you will neeed :<br/>
     *      <ul>
     *      <li>a one-way-binding "data" object to provide the pre-exisiting payload of your field.</li>
     *      <li>a one-way-biding "schema" object to provide the configuration of your field.</li>
     *      <li> "onupdate" function accessor that will be provided by the parent context that you 
     *       will call at everytime your payload needs to be updated.</li>
     *       </ul>
     *       
     * @example
     *
     *    // Using the tag : <new-image-field></new-image-field> 
     *
     *    //We will inject the field like so :
     *    
     *    SpotfulEditorParser.setComponentField('image', 'new-image-field');<br/><br/>
     *
     *    //We will have to define the field with that pattern :
     *    
     *    angular.module('NewModule').component('newImageField', {
     *  
     *          controller : NewImageController,
     *          bindings : {
     *              data : "<",
     *              schema : "<",
     *              onupdate : "&"
     *          
     *              }
     *      });
     *
     *
     *     function NewImageController () {
     *
     *          //A function invoked in the ui when an update sequence is required (when a new image is seleted)
     *          this.updateItem = function () {
     *            
     *            //You will have to pass in your payload as the 'data' attribute.
     *            ctrl.onupdate({ data :ctrl.data });
     *
     *          }
     *
     *      }
     * 
     * @memberOf  EditorParser.SpotfulEditorParserService
     * @param {String} type      The type of the field that 
     * @param {String} element The element markup for the component to bind to.
     * @param {Object} attributes Extra attributes to inject on component.
     */
    this.setComponentField = function(type, element, attributes) {

        if (attributes == undefined) {
            attributes = {};
        }

        if (type != undefined) {

            types[type] = {
                element: element,
                attributes: attributes
            };

        }

    }

}]);

/**
 * SpotfulEmailField
 * @memberOf SpotfulUi
 */
angular.module('ui').directive('spotfulEmailField', ['$timeout', function($timeout) {

    return {
        restrict: 'E',
        replace: true,

        scope: {

            data: "<",
            default:"@",
            label: "@",
            description : "@",

            placeholder: "@",
            onupdate: "&",

        },

        templateUrl: 'src/email-field/partials/email-field.html',

        link: function(scope, element, attr) {

            //We check if there is a default value.
            if(scope.data == undefined && scope.default != undefined) {

                scope.data = scope.default;

                scope.onupdate({
                    data: scope.data
                });

            }


            //Placeholder default value
            if (scope.placeholder == undefined) {

                scope.placeholder = 'Enter your email...';

            }

            //Label default value
            if (scope.label == undefined) {
                scope.label = '';
            }

            scope.$watch('data', function() {
                
                if(scope.data == undefined) {
                    return;
                }

                scope.onupdate({
                    data: scope.data
                });

            });

        }

    };

}]);

/**
 * @class SpotfulTextField
 * @memberof SpotfulUi
 */
function SpotfulImageFieldController($scope, $element) {

    var ctrl = this;

    this.label = '';

    this.$onChanges = function() {


        // console.log('from image element onchange',ctrl.data.src );
        if (ctrl.data !== undefined) {
            $element.find('input').value = ctrl.data.src;
        }
        

        this.label = this.schema.Label;

    }

    $element.find('input').on('change', function(event) {

        // console.log('from image element',ctrl.data.src );

        if ( ctrl.data !== undefined ) {
            ctrl.data.src = this.value;
        }

        ctrl.updateItem();

    });

    this.updateItem = function() {

        ctrl.onupdate({
            data: ctrl.data
        });

    }

}

angular.module('ui.editor-parser').component('spotfulImageField', {

    templateUrl: 'src/image-field/partials/image-field-partial.html',
    controller: SpotfulImageFieldController,
    bindings: {
        data: "<",
        schema: "<",
        onupdate: "&"

    }
});

/**
 * @class JsonField
 * @memberof SpotfulUi
 */
function SpotfulJsonFieldController($scope, $element) {

    var ctrl = this;

    var textarea = document.createElement('textarea');

    $element.append(textarea);

    textarea.style.width = "300px";
    textarea.style.height = "300px";


    this.$onChanges = function(changes) {

        if (changes.data != undefined) {

            textarea.value = JSON.stringify(ctrl.data, null, '  ');
        }


    }

    textarea.onkeyup = function(event) {


        ctrl.updateItem(textarea.value);

    };

    this.updateItem = function(value) {

        try {

            var data = JSON.parse(value);


            ctrl.onupdate({
                data: data
            });

        } catch (e) {
            console.log('Could not update json.');
        }


    }

}

angular.module('ui').component('spotfulJsonField', {

    controller: SpotfulJsonFieldController,
    bindings: {
        data: "<",
        onupdate: "&"

    }
});

/**
 * Allows for easy addition of a loading screen to any view. 
 * 
 * @memberof SpotfulUi 
 * @name Loading Screen
 * @param { String } LoadingMessage Override the array of messages from the $SpotfulConfiguration object.
 * @param { Function } loadedEvent The function that will be fired when the view is ready (from the parent). This function will HIDE the loading screen.
 * @example <loading-screen loadedEvent="{parentReadyEvent}" loadingMessage="My custom message"></loading-screen>
 * @ngdoc directive
 */

angular.module('ui').directive('loadingScreen', ['$timeout', function($timeout) {
    return {

        restrict: 'E',
        templateUrl: 'src/loading-screen/loading-screen.html',

        scope: {

            loadedEvent: '=',
            loadingMessage: '@'

        },

        link: function(scope, element, attr) {

            var loadingScreen = element.find('.loading-screen');

            // Default the READY state to FALSE
            scope.stateLoaded = false;
            loadingScreen.addClass('-is--entering');

            // If there's no custom message specified, 
            //  randomly select one from the $SpotfulConfiguration object.
            if (scope.loadingMessage == undefined) {

                scope.loadingMessage = window.$SpotfulConfiguration.getInspiration();

            } else {
                scope.loadingMessage = scope.loadingMessage;
            }

            scope.$watch('loadedEvent', function() {
                // Do stuff when the ready event is fired...

                // Default the READY state to FALSE
                scope.stateLoaded = false;
                loadingScreen.addClass('-is--entering');

                if (scope.loadedEvent != undefined && scope.loadedEvent == true) {

                    loadingScreen.addClass('-is--leaving');
                    loadingScreen.removeClass('-is--entering');

                    $timeout(function() {

                        scope.stateLoaded = true;
                        loadingScreen.removeClass('-is--leaving');

                    }, 1300);

                }

            });

        }
    }

}])

/**
 * Allows you to find a google place id representing a location on google map. 
 * 
 * @memberof SpotfulUi 
 * @name Location Field 
 * @param { String } data The google place id value of the location.
 * @param { String } label The label of the field.
 * @param { Function } onupdate The function that will be fired when the location changed.
 * @example <spotful-location-field data="data" label="Where do you want to go?" onupdate="parentUpdateItem(data)"></spotful-location-field>
 * @ngdoc directive
 */
angular.module('ui').directive('spotfulLocationField', [function() {
    return {

        restrict: 'E',
        replace: true,
        templateUrl: 'src/location-field/partials/location-field.html',

        scope: {

            label: '@',
            placeholder: '@',
            default:'@',

            data: '<',
            onupdate: '&'

        },

        link: function(scope, element, attrs) {


            //We check if there is a default value.
            if(scope.data == undefined && scope.default != undefined) {

                scope.data = scope.default;

                scope.onupdate({
                    data: scope.data
                });

            }

            if (scope.placeholder == undefined) {
                scope.placeholder = "Search for a location...";
            }

            var input = element.find('#searchField')[0];

            var options = {

            };

            scope.$watch('data', function() {

                if (scope.data != undefined) {

                    var service = new google.maps.places.PlacesService(element.find("#placeservice-init")[0]);

                    service.getDetails({
                        placeId: scope.data
                    }, function(place, status) {

                        scope.place = place;

                        input.value = place.formatted_address;

                    });

                }

            });


            var autocomplete = new google.maps.places.Autocomplete(input, options);

            google.maps.event.addListener(autocomplete, 'place_changed', function() {


                scope.place = autocomplete.getPlace();

                scope.onupdate({
                    data: scope.place.place_id
                });

                scope.$apply();

            });


        }


    }
}]);

angular.module('ui').directive('spotfulMatchValidation', ['$timeout', function($timeout) {
    return {
        require: 'ngModel',
        link: function($scope, elem, attrs, ctrl) {

            var checkMatch = function() {
                //get the value of the first password
                var e1 = $scope.$eval(attrs.ngModel);

                //get the value of the other password
                var e2 = $scope.$eval(attrs.spotfulMatchValidation);


                console.log(e1, e2, e1 == e2);

                //set the form control to valid if both
                //passwords are the same, else invalid
                ctrl.$setValidity("match", e1 == e2);

                $scope.$apply();

            }

            elem.on('blur', function(evt) {

                checkMatch();

            });

            var cancelTimeout = $timeout(function() {}, 0);

            elem.on('keyup', function(evt) {

                $timeout.cancel(cancelTimeout);

                cancelTimeout = $timeout(function() {

                    checkMatch();

                }, 1000);


            });
        }
    }
}]);

angular.module('ui').directive('spotfulNumberField', ['$timeout', '$rootScope', function($timeout, $rootScope) {

    return {
        restrict: 'E',
        replace: true,

        scope: {

            label: "@",
            description: "@",
            placeholder: "@",
            min: "@",
            max: "@",
            step: "@",

            default : "@",

            data: "<",
            onupdate: "&"
        },

        templateUrl: 'src/number-field/partials/number-field.html',

        link: function(scope, element, attr) {

            //We check if a default value is provided.
            if(scope.data == undefined && scope.default != undefined) {

                scope.data = Number(scope.default);

                scope.onupdate({
                    data: scope.data
                });

            }

            //Placeholder default value
            if (scope.placeholder == undefined) {

                scope.placeholder = '0';

            }

            var update = function () {

                if (validate()) {

                    scope.onupdate({
                        data: scope.data
                    });

                    scope.$apply();

                } 

            }

            element.find('input').bind('mouseup', update);
            element.find('input').bind('keyup', update);


            /**
             * Performs validation and return true or false according on whether the validation passed or not.
             * @return {boolean} A boolean that represents whether validation passed or not.
             */
            var validate = function() {

                if (scope.min != undefined && Number(scope.min) > scope.data) {

                    return false;

                }

                if (scope.max != undefined && Number(scope.max) < scope.data) {

                    return false;
                    
                }

                return true;

            }


        }

    };

}]);

/**
 * SpotfulOptionField
 * 
 */
angular.module('ui').directive('spotfulOptionField', ['$timeout', function($timeout) {

    return {
        restrict: 'E',

        scope: {

            data: "<",
            schema: "<",

            label: "@",

            options: "<",

            onupdate: "&"


        },

        templateUrl: 'src/option-field/partials/option-field.html',

        link: function(scope, element, attr) {


        }

    };

}]);

angular.module('ui').directive('spotfulPasswordField', [function() {

    return {
        restrict: 'E',
        replace: true,

        scope: {

        },

        templateUrl: window.$SpotfulConfiguration.APP_URL + 'ui/password-field/password-field.html',

        link: function(scope, element, attr) {

        }

    };

}]);

var defaultPopup = function() {

    function link(scope, element, attrs) {};

    return {
        restrict: "E",
        templateUrl: 'src/popup/partials/default-popup.html',
        link: link
    }
}

angular.module('ui.popup')
    .directive("defaultPopup", defaultPopup);

angular.module('ui.popup').directive("editorPopupItem", ['$compile', 'PopupEditorManager', '$timeout', function($compile, PopupEditorManager, $timeout) {
    /*------------------------------------------------------------------------------------------------------------------------------------*/
    /*-  The Q defer pattern is used to support our popup framework.  The 'submit' process actually initiates the  -*/
    /*-  defer's resolve method and the cancel method invokes the defer's reject method.                           -*/
    /*------------------------------------------------------------------------------------------------------------------------------------*/

    return {
        restrict: 'E',

        scope: {
            data: "=",
            config: "=",
            submit: "=",
            then: "=",
            cancel: "=",
            catch: "=",
        },

        link: function($scope, element, attr) {

            $scope.$watch("config", function(config) {

                element.html(config.content).show();
                $compile(element.contents())($scope);

            });


        }

    }

}]);

angular.module('ui.popup').directive('popupeditor', ['$compile', 'PopupEditorManager', '$timeout', function($compile, PopupEditorManager, $timeout) {

    return {
        restrict: 'E',
        templateUrl: 'src/popup/partials/editor-popup.html',
        scope: {},

        link: function(scope, element, attr) {

            // Establishing a tightly bound relation from the service.
            scope.popupeditoritems = PopupEditorManager.popupeditoritems;

            // Cancel the popup editor item  when the user clicks on cancel.
            scope.cancel = function(popupeditoritem) {
                popupeditoritem.cancel();
            }

            // Adds class to body tag stop the scrolling
            scope.$watchCollection('popupeditoritems', function() {

                if (scope.popupeditoritems.length > 0) {
                    $('body').addClass('popup-open');
                } else {
                    $('body').removeClass('popup-open');
                }

            });

            scope.$on('$destroy', function() {
                $('body').removeClass('popup-open');
            });

        }
    };
}]);

angular.module('ui.popup').directive('slidepopup', ['$compile', 'SlidePopupManager', function($compile, SlidePopupManager) {

    return {

        restrict: 'E',

        templateUrl: 'src/popup/partials/slide-popup.html',

        replace: true,

        scope: {},

        link: function(scope, element, attr) {

            scope.show = false;
            scope.data = {};

            SlidePopupManager.init(scope);

            element.find('[toggle]').fadeOut("fast", "linear");

            scope.$on('submit', function(event, data) {

                scope.close();

            });

            scope.$watch('show', function(newValue, oldValue) {

                if (newValue) {

                    element.fadeIn("fast", "linear");

                } else {

                    element.fadeOut("fast", "linear");

                }

            });

            scope.$watchCollection('content', function(newValue, oldValue) {

                if (newValue) {

                    $('.slide-dialog--content').empty();
                    $('.slide-dialog--content').append(angular.element(scope.content));

                    $compile($('.slide-dialog--content').contents())(scope);

                    element.closest(".window").find('[toggle]').fadeOut("fast", "linear");
                    element.closest(".slide").find('[toggle]').fadeOut("fast", "linear");

                }

            });

            scope.cancel = function() {

                scope.close();
                scope.$emit('cancel');

            };

            scope.close = function() {

                element.closest(".slide").find('[toggle]').fadeIn("fast", "linear");
                element.closest(".window").find('[toggle]').fadeIn("fast", "linear");

                scope.show = false;
                scope.content = '';

                $('.slide-dialog--content').empty();

            };

        }

    }

}]);

/**
 * PopupEditorManager is a service for interfacing the popup interface.
 * @memberOf SpotfulUi
 * @namespace PopupEditorManager
 * @ngdoc service
 */
angular.module('ui.popup').service('PopupEditorManager', ['$timeout', '$q', function($timeout, $q) {

    var self = this;

    this.popupeditoritems = [];


    this.clear = function() {
        //  This is a very important piece.  
        //  Angular watches break when the hashId of the variable changes 
        //  i.e.: changing an array to a new instance of an array -- [] -- instead of emptying it via recursive splice -EB
        this.popupeditoritems.splice(0, this.popupeditoritems.length); // = [];
    }


    /**
     * Show a popup item
     * 
     * @param {Object} [config]  The configuration of the popup.
     * @param {String} [config.modalType] The type of popup message. You have the choice between send, success, danger
     * @param {String} [config.modalHeading] The text to put has header.
     * @param {String} [config.modalDescription] The text to put in the body text
     * @param {String} [config.modalImage] An image to inject in the popup.
     * @param {String} [config.modalImage2x] A second image to inject in the popup.
     * @param {String} [config.modalSubmitLink] A link to point to when popup hits submit.
     * @param {String} [config.modalSubmit] The text to put in the submit button.
     * @param {String} [config.modalCancel] The text to put in the cancel button.
     * @param {String} [config.content] This field allows you to override the default popup to a custom popup. The content field, can contain any html and directives registered in your app. 
     * @param {Object} [data] The data that is being passed in to the popup.
     * @return {Object}        returns a promise pattern that will be resolved when the submit sequence will be invoked. 
     */
    this.show = function(config, data) {

        var deferred = $q.defer();

        if (config == undefined) {
            config = {};
        }

        if (config.showModalCloseControl == undefined) {

            config.showModalCloseControl = true;
        }

        if (config.content == undefined) {

            // You must provide config related items in order to use the default-modal below:
            config.content = "<default-popup></default-popup>";
        }

        deferred.config = config;
        deferred.data = data;

        self.popupeditoritems.push(deferred);

        var length = self.popupeditoritems.length;

        // Gets rid of the element in the stack
        $timeout(function() {

            if (deferred == undefined) {
                return;
            }

            self.popupeditoritems[length - 1].promise.then(function() {
                var index = self.popupeditoritems.indexOf(deferred);
                self.popupeditoritems.splice(index, 1);
            });


            self.popupeditoritems[length - 1].promise.catch(function() {
                var index = self.popupeditoritems.indexOf(deferred);
                self.popupeditoritems.splice(index, 1);
            });

        }, 0);

        return deferred.promise;
    };


}]);

angular.module('ui.popup').service('SlidePopupManager', [function() {

    var popupStack = [];

    this.init = function(popup) {

        popupStack[popup.$parent.$id] = popup;

    };

    this.cancel = function(popup) {

        var depth = 0;

        if (popup != undefined && popup != null && popup.$id != undefined) {

            // Try to identify the popup scope.
            while (popup != undefined && popupStack[popup.$id] == undefined) {

                popup = popup.$parent;
                depth += 1;

                // Bail if we have not found the popup scope and we've reached some cutoff.
                if (depth == 10) {
                    break;
                }

            }

            if (popup != undefined && popupStack[popup.$id] != undefined) {

                popupStack[popup.$id].cancel();

            }

        }

    }

    this.show = function(content, popup) {

        var depth = 0;

        if (popup != undefined) {

            while (popupStack[popup.$id] == undefined) {

                popup = popup.$parent;
                depth += 1;

                // Bail if we have not found the parent and we've reached some cutoff.
                if (depth == 10) {
                    break;
                }

            }

            popupStack[popup.$id].show = true;
            popupStack[popup.$id].content = content;

            return popupStack[popup.$id];

        }

    }

}]);

/**
 * The range field allows you to interface a given number with a range and steps.
 * 
 * @memberof SpotfulUi 
 * @name Range Field
 * @param { Number } data The number value provided for the field.
 * @param { String } label The label of the field.
 * @param { String } description The description of the field.
 * @param { Number} min The minimal value of the number.
 * @param { Number } max The maximal value of the number.
 * @param { Number } step Incremental or decremental value.
 * @param { Number } default Fallback value.
 * @param { Function } onupdate The function that will be fired when the number changed.
 * @example <spotful-range-field data="data" label="Where do you want to go?" onupdate="parentUpdateItem(data)"></spotful-range-field>
 * @ngdoc directive
 */
angular.module('ui').directive('spotfulRangeField', [function() {

    return {
        restrict: 'E',

        scope: {

            data: "<",
            default : "@",
            onupdate: "&",

            label: "@",
            description: "@",
            min: "@",
            max: "@",
            step: "@"

        },

        templateUrl: 'src/range-field/partials/range-field.html',

        link: function(scope, element, attr) {


            //We check if there is a default value.
            if(scope.data == undefined && scope.default != undefined) {

                scope.data = Number(scope.default);
                
                scope.onupdate({
                    data: scope.data
                });
                
            }

            scope.updateData = function() {

                scope.onupdate({
                    data: scope.data
                });

            }

        }

    };

}]);

/**
 * Allows you to enter and format rich text into an HTML editor.  Trump tower not included.
 * This richtext is a wrapper of textangular. Look up documentation for more information  http://textangular.com/
 * 
 * @memberof SpotfulUi 
 * @name Rich Text Field
 * @param { String } data The HTML string representing the content entered into the SpotfulRichTextField.
 * @param { String } label The label to be applied to the SpotfulRichTextField editor ("Do a barrel roll!", for eample).
 * @param { Object } onupdate The function that will be called when the data has been updated.
 * @example <spotful-richtext-field data="data" label="Kittens" onupdate="parentUpdateItem(data)"></spotful-richtext-field>
 * 
 * @ngdoc directive
 */
angular.module('ui.richtext').directive('spotfulRichtextField', [function() {
    return {
        restrict: 'E',
        templateUrl: 'src/richtext-field/partials/richtext-field.html',
        replace: true,

        scope: {
            data : '<',
            label : '@',
            description : '@',
            placehodler : '@',
            default : '@',

            onupdate : "&"

        },
        link: function(scope, element, $attr) {


            //We check if a default value is provided.
            if(scope.data == undefined && scope.default != undefined) {

                scope.data = scope.default;

                scope.onupdate({
                    data: scope.data
                });                

            }

            if (typeof scope.data == 'string') {

                scope.dataHtml = scope.data;

            } else {

                scope.dataHtml = '';

            }

            scope.$watch('dataHtml', function() {

                if (scope.dataHtml == undefined) {
                    return;
                }

                scope.onupdate({
                    'data': scope.dataHtml
                });
            })

        }
    };
}]);

/**
 * The range field allows you to interface a given number with a range and steps.
 * 
 * @memberof SpotfulUi 
 * @name Search Field
 * @param {String} label The label of the field.
 * @param {String} description The description of the field.
 * @param {String} placeholder The placeholder of the field.
 * @param {Function} load First param is the `query`, must return a deferred pattern
 * @param {Function} onload Will be fired every time a result is returned
 * @param {Function} onupdate Will be fired when an item is selected
 * @example <spotful-search-field label="Where do you want to go?" onupdate=""></spotful-search-field>
 * @ngdoc directive
 */

angular.module('ui').directive('spotfulSearchField', ['$timeout', function($timeout) {
    return {
        restrict: 'E',

        templateUrl: 'src/search-field/partials/search-field.html',

        scope: {
            label: "@",
            description: "@",
            placeholder: "@",
            load: "&",
            //onload: "&",
            onupdate: "&"
        },

        link: function(scope, element, attr) {

            scope.hasResults = false;
            scope.stateLoading = false;

            if ( scope.label == undefined || scope.label == "" ) {
                scope.label = "Search";
            }

            if ( scope.placeholder == undefined || scope.placeholder == "" ) {
                scope.placeholder = "Search term...";
            }

            scope.results = [];
    
            scope.$watch("searchField", function() {
                
                if ( scope.searchField == undefined || scope.searchField == "" ) {
                    
                    scope.results = [];
                    scope.hasResults = false;

                    return;
                }

                var query = {
                    "search": scope.searchField
                }

                scope.stateLoading = true;

                scope.load({ "query": query }).then( function(results) {
                    
                    scope.results = results;
                    scope.stateLoading = false;
                    scope.hasResults = true;

                }).catch(function(err) {

                    console.error(err);

                    scope.hasResults = false;
                    scope.stateLoading = false;

                })

            });

            scope.selectItem = function(item) {
                scope.onupdate({data: item});

                scope.hasResults = false;
                scope.stateLoading = false;
            }


        }
    };
}]);

(function() {
    'use strict';

    angular.module('ui').directive('searchlink', ['MediaService', '$timeout', function(MediaService, $timeout) {
        return {
            restrict: 'E',

            templateUrl: 'src/search-link/partials/search-link.html',

            scope: {
                data: "=",
                onupdate: "&"
            },
            link: function($scope, element, attr) {

                if ($scope.data != undefined && $scope.data.url != undefined) {
                    $scope.searchLinkField = $scope.data.url;
                } else {
                    $scope.searchLinkField = "";
                }

                var resetSearch = $timeout(function() {}, 0);

                $scope.parseLink = function() {

                    $timeout.cancel(resetSearch);

                    resetSearch = $timeout(function() {

                        if ($scope.searchLinkField != undefined) {

                            var filter = {};

                            if (attr.type != undefined) {
                                filter.type = attr.type;
                            }

                            if (attr.source != undefined) {
                                filter.media_source = attr.source;
                            }

                            ////////console.log(filter.media_source);


                            var media = MediaService.parseUrl($scope.searchLinkField, filter);

                            //If parsing has result load the meta.
                            if (media != undefined) {

                                media.getMeta().then(function(data) {

                                    //If parsing worked
                                    $scope.data = data;

                                    if ($scope.onupdate != undefined) {

                                        $scope.onupdate($scope.data);
                                    }


                                });

                            } else {

                            }

                        }

                    }, 500);

                };

                element.on("$destroy", function() {

                    //clearWatchNgModel();

                });


                $scope.$watch('data.url', function() {

                    if ($scope.data == undefined) {
                        return;
                    }

                    if ($scope.data.url == undefined) {

                        $scope.searchLinkField = "";
                    }

                });

            }
        };
    }]);


})();

(function() {
    'use strict';

    angular.module('ui').service('LinkService', ['$q', 'YoutubeService', 'VimeoService', 'MediaService', function($q, YoutubeService, VimeoService, MediaService) {

        this.parseUrl = function(url, type) {

            var link = {};

            link.url = url;

            var media = MediaService.parseByUrl(link.url, type);

            var defered = $q.defer();

            if (media != undefined) {


                ///Populating the link object with the new media information.
                link.media_source = media.media_source;
                link.type = media.type;

                //Whether put it into link.data.icon or create a new field in the database
                link.icon = media.icon;

                MediaService.getMeta(link).then(function(link) {

                    defered.resolve(link);

                });

            } else {

                //Nothing was found reject the parsing.
                defered.reject();

            }


            return defered.promise;

        }

    }]);
})();

/**
 * Generates a select list of item provided by the options parameter. 
 * @memberOf SpotfulUi
 * @name  Select Field
 * @param {Object} default an object reflecting the default value.
 * @param {String} label the text of the label
 * @param {String} description the text of the description
 * @param {Object} data The initial value to be inserted in the field.
 * @param {Array}  options The list of available options. Each list items should be an object having a name parameter and value parameter.
 * @param {Function} onupdate A function to invoke when data changes. 
 * @example <spotful-select-field data="data" label="label" options="options" onupdate="fn()"></spotful-select-field>
 * @ngdoc directive
 */
angular.module('ui').directive('spotfulSelectField', ['$timeout', function($timeout) {
    return {
        restrict: 'E',
        templateUrl: 'src/select-field/partials/select-field.html',
        scope: {

            data: "<",
            default : "@",
            label: "@",
            description: "@",
            placeholder: "@",
            options: "<",
            onupdate: "&"

        },

        link: function(scope, element, attr) {

            //We check if there is a default value.
            if(scope.data == undefined && scope.default != undefined) {

                scope.data = scope.default;

                scope.onupdate({
                    data: scope.data
                });

            }


            scope.updateData = function() {

                scope.onupdate({
                    data: scope.data
                });
            }
        }
    };
}]);

(function() {
    'use strict';

    angular.module('ui').directive('uiSlidetabs', [function() {
        return {
            restrict: 'A',

            link: function(scope, element, attr) {

                var nav = element.find('[data-slidetab-ref]'); // the slidetabs nav item that gets clicked
                var numberOfTabs = nav.size(); // get the numberOfTabs
                var activetab = element.find('[data-slidetab-active]'); // get the active tab
                var nextTrigger = element.find('[data-slidetab-next]'); // get trigger for nextTab

                // Set the proper width of the slidetab container (STATIC)
                activetab.css('width', numberOfTabs * 100 + '%');

                // this is the NEXT button
                $(nextTrigger).click(function() {

                    var currentTab = Number(activetab.attr('data-slidetab-active')) + 1;
                    var position = currentTab * -100 + '%';

                    activetab.css('left', position);

                    // Update appearance of navigation to show currently active tab
                    nav.removeClass('-is--active');
                    $(nav[currentTab]).addClass('-is--active');

                    // set the `data-slidetab-active` attribute with the current index
                    var activetabnumber = activetab.attr('data-slidetab-active', currentTab);

                    if (currentTab == (numberOfTabs - 1)) {
                        scope.lasttab = true;
                    } else {
                        scope.lasttab = false;
                    }
                    scope.$apply();

                });

                // loop through each nav...
                nav.each(function(index) {

                    // change position based on the index and the active slidetab
                    var tabposition = index * -100;

                    // navigation through the nav
                    $(this).click(function() {

                        // Update appearance of navigation to show currently active tab
                        nav.removeClass('-is--active');
                        $(this).addClass('-is--active');

                        // set the `data-slidetab-active` attribute with the current index
                        var activetabnumber = activetab.attr('data-slidetab-active', index);

                        // call the function that moves the tabset
                        activetab.css('left', tabposition + '%'); // update the css to reflect `tabposition`

                        // check if it's the last tab, to change the navigation.
                        scope.lasttab = false;

                        if (index == numberOfTabs - 1) {
                            // evaluates to true if it is the last tab
                            scope.lasttab = true;
                        } else {
                            scope.lasttab = false;
                        }

                        scope.$apply();

                    });

                });

            }
        };

    }]);
})();

// This is the snippet that allows on-page anchor navigation to smoothscroll
/*$('a.tabset--nav__item').bind('click', function(event) {
    var $anchor = $(this);

    if(/\/?\#[a-z0-9_\-]+/i.test($anchor.attr('href')) == false) {
        return;
    }

    var $anchorTarget = $($anchor.attr('href').replace(/^\//, ''));

    if (typeof $anchorTarget.offset() !== 'undefined') {
        $('html, body').stop().animate({
            scrollTop: ($anchorTarget.offset().top - 90)
        }, 450, 'easeOutQuad');

        return false;
    }

});*/

// This is a snippet from jQuery Easing Animation Lib
// t: current time, b: begInnIng value, c: change In value, d: duration
/*jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
	def: 'easeOutQuad',
	swing: function (x, t, b, c, d) {
		//alert(jQuery.easing.default);
		return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
	},
	easeInQuad: function (x, t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	easeOutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	}
});*/

/**
 * Generates a switch that will toggle a boolean value to true or false 
 * @memberOf SpotfulUi
 * @name  Switch Field
 * @param {Boolean} data The initial value to be inserted in the field. This needs to be a boolean.
 * @param {String} label The text for the label.
 * @param {Function} onupdate This function will fire when the data changed.
 * @example <spotful-switch-field data="data" label="label" onupdate="fn()"></spotful-switch-field>
 * @ngdoc directive
 */
angular.module('ui').directive('spotfulSwitchField', [function() {

    return {

        restrict: 'E',

        scope: {

            label: "@",
            default : "@",
            description: "@",
            default: "@",
            onupdate: "&",
            data: "<"
        },

        templateUrl: 'src/switch-field/partials/switch-field.html',

        link: function(scope, element, attr) {

            //We check if there is a default value.
            if(scope.data == undefined && scope.default != undefined) {

                scope.data = scope.default == 'true';

                scope.onupdate({
                    data: scope.data
                });

            }


            scope.updateData = function() {

                scope.onupdate({
                    data: scope.data
                });

            }

        }

    }

}]);

/**
 * Simple textfield for interfacing text.
 * 
 * @memberof SpotfulUi 
 * @name Text Field 
 * @param { String } data The text value 
 * @param { String } label The label to be used for the text field.
 * @param { String } placeholder The placeholder to be used for the text field.
 * @param { Function } The function invoked when the field updated
 * @example <spotful-text-field data="data" label="Murica" onupdate="parentUpdateItem(data)"></spotful-text-field>
 * @ngdoc directive
 */
angular.module('ui').directive('spotfulTextField', ['$timeout', function($timeout) {

    return {
        restrict: 'E',
        replace: true,

        scope: {

            data: "<",
            default:"@",
            label: "@",

            placeholder: "@",
            description : "@",
            onupdate: "&",
            max: "@"

        },

        templateUrl: 'src/text-field/partials/text-field.html',

        link: function(scope, element, attr) {

            
            //We check if there is a default value.
            if(scope.data == undefined && scope.default != undefined) {

                scope.data = scope.default;

                scope.onupdate({
                    data: scope.data
                });

            }

            //Placeholder default value
            if (scope.placeholder == undefined) {
                scope.placeholder = 'Enter your text...';
            }

            //Label default value
            if (scope.label == undefined) {
                scope.label = '';
            }


            scope.$watch('data', function() {

                if(scope.data == undefined) {

                    return;

                }

                var max = Number(scope.max);
                var length = scope.data.length;

                if (scope.max != undefined) {

                    if (max > length) {
                        scope.onupdate({
                            data: scope.data
                        });
                    }

                    return;

                } else {

                    scope.onupdate({
                        data: scope.data
                    });

                    return;

                }

            });



        }

    };

}]);

angular.module('ui').directive('spotfulUrlField', ['$timeout', function($timeout) {

    return {
        restrict: 'E',
        replace: true,

        scope: {

            data: '<',
            default: '@',
            label: '@',
            placeholder: '@',
            onupdate: '&'

        },

        templateUrl: 'src/url-field/partials/url-field.html',

        link: function(scope, element, attr) {
            
            //We check if there is a default value.
            if(scope.data == undefined && scope.default != undefined) {

                scope.data = scope.default;

                scope.onupdate({
                    data: scope.data
                });

            }

            //Placeholder default value
            if (scope.placeholder == undefined) {
                scope.placeholder = 'Enter a URL...';
            }

            //Label default value
            if (scope.label == undefined) {
                scope.label = '';
            }


            scope.$watch('data', function() {

                if(scope.data == undefined) {
                    return;
                }

                scope.onupdate({
                    data: scope.data
                });

            });


        }

    };

}]);

//# sourceMappingURL=spotful-ui.js.map