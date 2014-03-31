/*jslint browser: true */ /*globals $ */
/** Copyright 2011-2014, Christopher Brown <io@henrian.com>, MIT Licensed

https://raw.github.com/chbrown/misc-js/master/jquery.flags.js

Usage:

    $('button').click(function(ev) {
      $(ev.target).flag({text: 'Clicked!', fade: 3000});
    });

Suggested CSS:

.flag {
  position: absolute;
  background-color: black;
  border-radius: 3px;
  padding: 2px 6px;
  color: white;
}
.flag .triangle {
  position: absolute;
  border: 6px solid transparent;
}

*/
var Flag = (function($) {
  // lib functions
  function extend(target /*, sources... */) {
    if (target === undefined) target = {};
    // var sources = Array.prototype.slice.call(arguments, 1);
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (source.hasOwnProperty(key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  }
  function measureBox($el) {
    return {
      width: $el.width() +
        parseInt($el.css('border-left-width'), 10) +
        parseInt($el.css('border-right-width'), 10) +
        parseInt($el.css('padding-left'), 10) +
        parseInt($el.css('padding-right'), 10),
      height: $el.height() +
        parseInt($el.css('border-top-width'), 10) +
        parseInt($el.css('border-bottom-width'), 10) +
        parseInt($el.css('padding-top'), 10) +
        parseInt($el.css('padding-bottom'), 10)
    };
  }

  // var nesw2trbl = {n: 't', e: 'r', s: 'b', w: 'l'}; // cardinal direction to css direction
  var opposite_of = {t: 'b', r: 'l', b: 't', l: 'r'}; // opposite sides
  var full = {t: 'top', r: 'right', b: 'bottom', l: 'left', c: 'center', m: 'middle'};

  var template = '<div class="flag"><div class="content"></div><div class="triangle"></div></div>';

  var Flag = function(target, opts) {
    /** new Flag: create a new flag object

    Flag itself should predominantly use Underscore, and only require jQuery for DOM manipulation

    `target`: DOM Element
        node to point at (be positioned near)
    `anchor`: 't' | 'r' | 'b' | 'l'
        Edge of the target to be on. Defaults to "r".
    `gravity`: 't' | 'r' | 'b' | 'l' | null
        Side to drift toward along the anchor edge.
          If anchor == 't' or 'b', gravity = 'r' | 'l' | null
          If anchor == 'r' or 'l', gravity = 't' | 'b' | null
    `align`: 'l' | 'c' | 'r' | 't' | 'm' | 'b'
        Alignment within box.
          If anchor == 't' or 'b', align = 'l' | 'c' | 'r'
          If anchor == 'r' or 'l', align = 't' | 'm' | 'b'
        In many cases (if your message is only one line), this won't have any visible effect.
    `onclick`: function(Event) (optional)
        Attach a click handler to the flag
    `fade`: Number (optional)
        Fade out after this many milliseconds
    `html`: String (optional)
        Present the flag with this html
    `text`: String (optional)
        Present the flag with this text (defers to html if both are present)
    */
    this.target = target;


    this.opts = extend({
      anchor: 'r',
      parent: document.body
    }, opts);

    // todo? support updating
    // var flag = $target.data('flag');
    // if (!opts.update || !flag) {
    //   flag = new Flag($target, opts.anchor || 'r', opts.align || 'm', opts.parent || document.body);
    // }

    this.$el = $(template).appendTo(this.opts.parent);
    // this.el = this.$el[0];

    // Attach event handlers. Run this only once.
    this.$el.on('click', this.onclick.bind(this));

    this.render();
    // $(this.target).data('flag', this);
  };
  Flag.prototype.onclick = function(ev) {
    if (this.opts.onclick) {
      this.opts.onclick(ev);
    }
    this.$el.hide();
  };
  Flag.prototype.render = function() {
    /** render(): resize and show as needed to display the flag. Five steps:

    1. set html or text of element
    2. show it and create timeout to hide it if a fade is specified
    3. measure the way things are
    4. resize / reposition the whole flag
    5. resize the triangle

    rendering is (should be) idempotent
    */


    // #1. set html or text
    if (this.opts.html) {
      this.$el.children('.content').html(this.opts.html);
    }
    else if (this.opts.text) {
      this.$el.children('.content').text(this.opts.text);
    }
    else {
      // should we even display it, at this point?
    }


    // #2. show it and create timeout to hide it if a fade is specified
    this.$el.show();
    if (this.opts.fade !== undefined) {
      var self = this;
      setTimeout(function() {
        self.$el.hide();
      }, this.opts.fade);
    }


    // #3a. measure the target
    var $target = $(this.target);
    var target_offset = $target.offset(); // { left: 999, top: 999 }
    var target_size = measureBox($target); // { width: 999, height: 999 }
    // #3b. measure the flag and background color
    var flag_size = measureBox(this.$el); // { width: 999, height: 999 }
    var background_color = this.$el.css('background-color');
    // #3c. measure the triangle
    var $triangle = this.$el.children('.triangle');
    var triangle_radius = parseInt($triangle.css('border-top-width'), 10);

    var anchor = full[this.opts.anchor];
    var opposite = full[opposite_of[this.opts.anchor]];
    var orientation = (anchor == 'top' || anchor == 'bottom') ? 'horizontal' : 'vertical';
    var gravity = full[this.opts.gravity];
    var align = full[this.opts.align];


    // #4a. handle flag anchor
    var flag_css = {};
    // allot space to the triangle
    flag_css['margin-' + opposite] = triangle_radius;
    if (anchor == 'top') {
      flag_css.top = (target_offset.top - flag_size.height) - triangle_radius;
    }
    else if (anchor == 'right') {
      flag_css.left = target_offset.left + target_size.width;
    }
    else if (anchor == 'bottom') {
      flag_css.top = target_offset.top + target_size.height;
    }
    else if (anchor == 'left') {
      flag_css.left = (target_offset.left - flag_size.width) - triangle_radius;
    }
    else {
      throw new Error('Unsupported anchor: ' + anchor);
    }
    // upgrade position to fixed if the target is:
    if ($target.css('position') == 'fixed') {
      flag_css.position = 'fixed';
    }
    // #4b. handle align:
    if (orientation == 'horizontal') {
      // #4b.i. if anchor is t or b: l | c | r
      if (align == 'left') {
        flag_css.left = target_offset.left;
      }
      else if (align == 'center' || align === undefined) { // default
        flag_css.left = target_offset.left + (target_size.width / 2) - (flag_size.width / 2);
      }
      else if (align == 'right') {
        flag_css.left = target_offset.left + target_size.width - flag_size.width;
      }
      else {
        throw new Error('Unsupported align: ' + align);
      }
    }
    else {
      // #4b.ii. if anchor is r or l: t | m | b
      if (align == 'top') {
        flag_css.top = target_offset.top;
      }
      else if (align == 'middle' || align === undefined) { // default
        flag_css.top = target_offset.top + (target_size.height / 2) - (flag_size.height / 2);
      }
      else if (align == 'bottom') {
        flag_css.top = target_offset.top + target_size.height - flag_size.height;
      }
      else {
        throw new Error('Unsupported align: ' + align);
      }
    }
    this.$el.css(flag_css);

    // #5. render triangle
    // the triangle works because css borders are beveled; if you see only one side,
    // it'll look like a triangle pointing into the middle of the element that's bordered
    var triangle_css = {};
    // center it:
    if (orientation == 'horizontal') {
      triangle_css.left = (flag_size.width - (triangle_radius * 2)) / 2;
    } else {
      triangle_css.top = (flag_size.height - (triangle_radius * 2)) / 2;
    }
    // we want to show the same border color as the anchor side (which is the side near the flag)
    triangle_css['border-' + anchor + '-color'] = background_color;
    // and collapse the border that's in the same direction as the anchor (side toward from the target)
    triangle_css['border-' + opposite + '-width'] = 0;
    // and shift away from the target
    triangle_css[opposite] = -triangle_radius;
    $triangle.css(triangle_css);
  };

  $.flag = function(target, opts) {
    /** $.flag(target, opts) is not chainable:  */
    return new Flag(target, opts);
  };

  $.fn.flag = function(opts) {
    /** $(selector).flag(opts) is chainable, to accord with the general jQuery design pattern. */
    if (typeof opts === 'string') opts = {text: opts};
    return this.each(function(i, element) {
      // element === this
      $.flag(this, opts);
    });
  };

  return Flag;
})($);
