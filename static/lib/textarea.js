"use strict"; /*jslint indent: 2 */
/** Copyright (c) 2013 Christopher Brown <io@henrian.com>, MIT Licensed

https://raw.github.com/chbrown/misc-js/master/textarea.js
http://chbrown.github.io/misc-js/textarea.js

Ace editor and CodeMirror are over the top. I just want tabs and block indentation.

And autofit (height-wise).

Your textarea should specify min-height and max-height, but not height.

*/
var Textarea = (function() {
  function copyStyle(source, target) {
    // also consider: window.getDefaultComputedStyle instead?
    var css_style_declaration = window.getComputedStyle(source);
    for (var i = 0; i < css_style_declaration.length; i++) {
      var property = css_style_declaration[i];
      target.style[property] = css_style_declaration[property];
    }
  }

  function copyStyleSubset(source, target, styles) {
    var css_style_declaration = window.getComputedStyle(source);
    for (var i = 0; i < styles.length; i++) {
      var property = styles[i];
      target.style[property] = css_style_declaration[property];
    }
  }

  function escapeHTML(html) {
    // this is for measuring the size of html,
    // so I don't actually think we need to substitute the newlines with a break. See
    //   * https://developer.mozilla.org/en-US/docs/Web/CSS/white-space
    //   * http://css-tricks.com/almanac/properties/w/whitespace/
    // '\n': '<br/>' /[\n]/g
    var replacements = {'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'};
    return html && html.replace(/[&<>"]/g, function(entity) {
      return replacements[entity];
    });
  }

  // these are a (the?) subset of styles that are relevant to the resulting size of a flow-sized element
  var shadow_sized_styles = [
    // padding
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    // border-width
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    // font sizing
    'font-weight', 'font-size', 'font-family', 'font-size-adjust',
    // kerning/leading
    'line-height', 'letter-spacing', 'word-spacing',
    'text-decoration', 'text-transform', 'text-align', 'text-indent',
    'direction',
    // and, really, the most important ones:
    'white-space', 'word-wrap'
    // box-sizing for various vendors
    // '-moz-box-sizing', '-webkit-box-sizing', 'box-sizing'
  ];

  var createShadowElement = function() {
    var div = document.createElement('div');
    // visibility: hidden how jQuery measures display: none elements
    // we want display: inline-block so that we can set clientWidth and have it stick
    div.setAttribute('style', 'position: absolute; visibility: hidden; display: block; border-style: solid');
    return div;
  };

  var dentSelection = function(textarea, dedent, tab) {
    /** dentSelection indents if dedent is false

    support this.selectionDirection? I think that'd just entail indexOf instead of lastIndexOf

    Edge case to handle: when your end selection is a line with only
    whitespace, and you dedent it all out you'd want to indent it back with
    the group, but once you hit 0-width on that line, the statelessness of
    this mechanism means that selection will be forgotten. But we don't want
    to select slightly into the next line, or otherwise if you triple-click,
    the end selection would start to select the next line (which is bad!).

    Other test cases:
    1. Select from first line somewhere into document. Should indent all of first line.
    2. Place cursor at beginning of line (0-width selection) -- should select to end of line.
    3. Triple click some portion (so that the last newline is technically selected) -- should not shift line below.
    4. TODO: dedent by fraction of a tab if, say, the tab is 4 spaces and there are only 2.

    */

    // if we have selected all the way to the beginning, we also want to indent the beginning of the string
    var dedent_pattern = new RegExp('(\n)' + tab, 'g');
    var indent_pattern = new RegExp('(\n)', 'g');

    // for begin, start at `selectionStart - 1` so that we don't catch the newline that the cursor is currently on
    var begin = textarea.value.lastIndexOf('\n', textarea.selectionStart - 1);
    // 0-width selections get special handling in case the cursor is sitting at the front of the line
    var selectionWidth = textarea.selectionEnd - textarea.selectionStart;
    var end = textarea.value.indexOf('\n', textarea.selectionEnd - (selectionWidth === 0 ? 0 : 1));

    // shrink/expand to their respective ends of the documents if no newline was found
    if (begin == -1) begin = 0;
    if (end == -1) {
      end = textarea.value.length;
    }

    // before + middle + end: '^blah\nblahblah' + '\nthisthis\nthatthat\nyesyes' + '\nsomething else'
    var before = textarea.value.slice(0, begin);
    var middle = textarea.value.slice(begin, end);
    var after = textarea.value.slice(end);

    // begin = 0 is special and I can't figure out a way to make regex multiline play nice
    if (begin === 0) {
      dedent_pattern = new RegExp('(^|\n)' + tab, 'g');
      indent_pattern = new RegExp('(^|\n)', 'g');
    }

    if (dedent) {
      // dedent
      middle = middle.replace(dedent_pattern, '$1');
      textarea.value = before + middle + after;
      // again, special handling for begin = 0
      textarea.setSelectionRange(begin === 0 ? 0 : begin + 1, begin + middle.length);
    }
    else {
      // indent
      middle = middle.replace(indent_pattern, '$1' + tab);
      textarea.value = before + middle + after;
      textarea.setSelectionRange(begin === 0 ? 0 : begin + 1, begin + middle.length);
    }
  };

  var Textarea = function(textarea, opts) {
    /** Textarea: tab and autoresize support

    textarea: DOM Element with tagName 'textarea'
    opts:
        tab: String
            string to insert at the front of the line when indenting, defaults to '  ' (2 spaces)
        buffer: Number
            pixels to add to the height when a positive resize is necessary, defaults to 0
    */
    if (this.opts === undefined) this.opts = {};
    if (this.opts.tab === undefined) this.opts.tab = '  ';
    if (this.opts.tab === undefined) this.opts.tab = '  ';

    this.textarea = textarea;


    this.initTabListener();
    this.initResizeToFit();
  };

  Textarea.prototype.initTabListener = function() {
    /** set up indentation (tab-hijacking)

    References:
      * https://github.com/wjbryant/taboverride
    */
    var tab = this.opts.tab;
    this.textarea.addEventListener('keydown', function(ev) {
      // 9 = tab
      if (ev.which == 9) {
        ev.preventDefault();
        // ev.shiftKey == true ? dedent : indent
        dentSelection(this, ev.shiftKey, tab);
      }
    }, false);

  };

  Textarea.prototype.initResizeToFit = function() {
    /** add autosizing functionality to the textarea

    References:
      * http://flaviusmatis.github.com/flexibleArea.js
      * https://github.com/jackmoore/autosize/blob/master/jquery.autosize.js
      * https://github.com/alexbardas/jQuery.fn.autoResize/blob/master/jquery.autoresize.js
      * https://github.com/akaihola/jquery-autogrow/blob/master/jquery.autogrow.js
    */
    if (this.textarea.style.width === '') {
      // allow horizontal resizing if there is no manual width setting
      this.textarea.style.horizontal = 'horizontal';
    }
    else {
      this.textarea.style.horizontal = 'none';
    }

    this.shadow = createShadowElement();
    document.body.appendChild(this.shadow);
    copyStyleSubset(this.textarea, this.shadow, shadow_sized_styles);

    // should resizeToFit be called with other args based on what happened?
    // i.e., target.resize vs. shadow.resize vs. target input vs. target style change
    var resizeToFit = this.resizeToFit.bind(this);
    // https://developer.mozilla.org/en-US/docs/Web/Reference/Events
    window.addEventListener('resize', resizeToFit, false);
    this.textarea.addEventListener('blur', resizeToFit, false);
    this.textarea.addEventListener('keyup', resizeToFit, false);
    this.textarea.addEventListener('change', resizeToFit, false);
    this.textarea.addEventListener('cut', resizeToFit, false);
    this.textarea.addEventListener('paste', resizeToFit, false);
    // maybe use https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver in the future once it's more widely supported
    // but for now, maybe poll the shadow div for changed height? (ewww, I know, polling)
    // ...

    // trigger a resize, to start us off
    this.resizeToFit();
  };

  Textarea.prototype.resizeToFit = function() {
    if (this.shadow.clientWidth != this.textarea.clientWidth) {
      var preresize_textarea_style = window.getComputedStyle(this.textarea);
      this.shadow.style.width = preresize_textarea_style.width;
    }

    var html = escapeHTML(this.textarea.value);
    // add extra white space to make sure the last line is rendered
    this.shadow.innerHTML = html + '&nbsp;';

    // element sizing, from quirskmode:
    // clientWidth and clientHeight (read/write):
    //   * The width and height of the content field, excluding border and scrollbar, but including padding
    // offsetWidth and offsetHeight (readonly):
    //   * The width and height of the entire element, including borders
    // scrollWidth and scrollHeight:
    //   * The width and height of the entire content field, including those parts that are currently hidden.
    //   * If there's no hidden content it should be equal to clientX/Y.
    var textarea_style = window.getComputedStyle(this.textarea);

    // we calculate the min/max height from the css, and have an absolute minimum of 2*line-height
    // var line_height = parseInt(textarea_style['line-height']) || parseInt(textarea_style['font-size']);
    var min_height = parseInt(textarea_style['min-height'], 10);
    var max_height = parseInt(textarea_style['max-height'], 10);

    // the shadow div should now have resized to match the contents of the textarea, so we measure it
    var shadow_style = window.getComputedStyle(this.shadow);
    var shadow_height = shadow_style.height;

    if (!isNaN(max_height) && shadow_style.height > max_height) {
      this.textarea.style.overflow = 'auto';
      this.textarea.style.height = '';
    }
    else if (!isNaN(min_height) && shadow_style.height < min_height) {
      this.textarea.style.overflow = 'auto';
      this.textarea.style.height = '';
    }
    else if (shadow_style.height != this.textarea.style.height) {
      // we are free to be flexible, just match the shadow!
      this.textarea.style.overflow = 'hidden';
      this.textarea.style.height = shadow_style.height;
    }
  };

  Textarea.enhance = function(textarea, opts) {
    /** enhance(): constructor wrapper */
    return new Textarea(textarea, opts);
  };

  return Textarea;
})();
