// Copyright 2011-2013, Christopher Brown <io@henrian.com>, MIT Licensed
// https://github.com/chbrown/misc-js :: jquery.flags.js
"use strict"; /*jslint indent: 2 */ /*globals $ */
(function($) {
  $.fn.measureBox = function() {
    return {
      width: this.width() +
        parseInt(this.css('border-left-width'), 10) +
        parseInt(this.css('border-right-width'), 10) +
        parseInt(this.css('padding-left'), 10) +
        parseInt(this.css('padding-right'), 10),
      height: this.height() +
        parseInt(this.css('border-top-width'), 10) +
        parseInt(this.css('border-bottom-width'), 10) +
        parseInt(this.css('padding-top'), 10) +
        parseInt(this.css('padding-bottom'), 10)
    };
  };

  var flag_counter = 0;

  function Flag($target, anchor, align, parent) {
    var self = this;
    this.anchor = anchor;
    this.align = align;
    this.$target = $target;
    this.parent = parent;

    this.$flag = $('<div class="flag"></div>').appendTo(parent).on('click', function() {
      self.remove();
    });
    this.bg_color = this.$flag.css('background-color');
    this.$sub = $('<div class="subflag"></div>').appendTo(this.$flag);
    this.$triangle = $('<div class="triangle"></div>').appendTo(this.$flag);
    this.triangle_radius = parseInt(this.$triangle.css('border-top-width'), 10);
  }
  Flag.prototype.redraw = function() {
    var self = this,
      target_offset = this.$target.offset(), // { left: 999, top: 999 }
      target_size = this.$target.measureBox(), // { width: 999, height: 999 }
      $content;
    this.$flag.fadeIn(80);
    if (this.onclick) {
      $content = $('<a href="#"></a>').click(function(ev) {
        ev.preventDefault();
        self.onclick();
      });
    }
    else if (this.href) {
      $content = $('<a href="' + this.href + '"></a>');
    }
    else {
      $content = $('<span></span>');
    }
    $content.appendTo(this.$sub.empty());
    if (this.html) {
      $content.html(this.html);
    }
    else {
      $content.text(this.text);
    }
    var flag_size = this.$flag.measureBox(); // { width: 999, height: 999 }

    if (this.anchor === 'r' || this.anchor === 'l') {
      // handle anchoring (left/right)
      if (this.anchor === 'r') {
        this.$flag.css({
          left: target_offset.left + target_size.width,
          'margin-left': this.triangle_radius
        });
        this.$triangle.css({
          left: -this.triangle_radius,
          'border-left-width': 0,
          'border-right-color': this.bg_color
        });
      }
      else {
        this.$flag.css({
          left: (target_offset.left - flag_size.width) - this.triangle_radius,
          'margin-right': this.triangle_radius
        });
        this.$triangle.css({
          // left: "auto",
          right: -this.triangle_radius,
          'border-right-width': 0,
          'border-left-color': this.bg_color
        });
      }

      // handle alignment (top/middle/bottom)
      if (this.anchor === 't') {
        this.$flag.css('top', target_offset.top);
      }
      else if (this.align === 'm') {
        this.$flag.css('top', target_offset.top + (target_size.height / 2) - (flag_size.height / 2));
      }
      else {
        this.$flag.css('top', target_offset.top + target_size.height - flag_size.height);
      }
      this.$triangle.css('top', (flag_size.height - (this.triangle_radius * 2)) / 2);
    }
  };
  Flag.prototype.remove = function() {
    this.$flag.fadeOut(80); // .remove()
  };

  $.flag = function(args) {
    if (args === undefined) args = {};
    var $target = args.element || $(args.selector),
        update = args.update === undefined ? true : args.update;

    var flag = $target.data('flag');
    if (!update || !flag) {
      flag = new Flag($target, args.anchor || 'r', args.align || 'm', args.parent || document.body);
    }
    $target.data('flag', flag);
    flag.href = args.href;
    flag.onclick = args.onclick;
    flag.html = args.html;
    flag.text = args.text;
    if (!flag.html && !flag.text)
      flag.text = '!!!';
    flag.redraw();

    if (args.fade !== undefined) {
      setTimeout(function() {
        flag.remove();
      }, args.fade);
    }
  };

  $.fn.flag = function(args) {
    // t: top, r: right, b: bottom, l: left, c: center, m: middle
    // @args.anchor: t | r | l | b // tr | rb | bl | tl
    // @args.align: l | c | r | t | m | b
    // @args.attach: $(document.body)'
    // @args.element: $('#text1') | @args.selector: '#text1'
    // @args.text: 'blah'
    if (typeof args === 'string') args = {text: args};
    return this.each(function() {
      args.element = $(this);
      $.flag(args);
    });
  };
})($);
