/*jslint browser: true */ /*globals $ */
/** Copyright 2011-2014, Christopher Brown <io@henrian.com>, MIT Licensed

https://raw.github.com/chbrown/misc-js/master/jquery.autocomplete.js

Usage:
  in your html: <input type="text" data-autocomplete="/users.json" />
  where /users.json?q=jo will respond in json
  then call: $('input[data-autocomplete]').ac();
  the actual Autocomplete object will be available at each element's .data('autocomplete') key

*/
(function($) {
  function measureBox($target) {
    return {
      width: $target.width() +
        parseInt($target.css('border-left-width'), 10) +
        parseInt($target.css('border-right-width'), 10) +
        parseInt($target.css('padding-left'), 10) +
        parseInt($target.css('padding-right'), 10),
      height: $target.height() +
        parseInt($target.css('border-top-width'), 10) +
        parseInt($target.css('border-bottom-width'), 10) +
        parseInt($target.css('padding-top'), 10) +
        parseInt($target.css('padding-bottom'), 10)
    };
  }

  function Autocomplete($input, url) {
    this.$input = $input;
    this.id = 'ac' + ((Math.random() * 99999) | 0);
    this.url = url;
    this.options = [];
    this.highlightedIndex = null;
    this.currentTerm = null;
    this.$ul = $('<ul class="autocomplete"></ul>').attr('id', this.id).appendTo('body');
    var self = this;
    $input.keydown(function(event) {
      if (event.which === 13) { // 13 == ENTER
        event.preventDefault();
      }
      else if (event.which === 38) { // 38 == UP arrow
        // Don't go lower than 0 when clicking up
        self.highlight(Math.max(0, self.highlightedIndex - 1));
      }
      else if (event.which === 40) { // 40 == DOWN arrow
        // Don't go higher than the last available option when going down
        self.highlight(Math.min(self.highlightedIndex + 1, self.options.length - 1));
      }
    }).keyup(function(event) {
      if (event.which === 13) { // 13 == ENTER
        // we don't want to ever bubble up a submit for one of these autocompletes, do we?
        if (self.highlightedIndex === -1 && self.options.length > 0)
          self.highlight(0);
        self.select(self.highlightedIndex);
      }
      else if (event.which !== 38 && event.which !== 40) {
        self.request(self.$input.val());
      }
      // just ignore the ups of the up and down arrows
    }).focus(function() {
      self.request(self.$input.val());
    }).blur(function() {
      self.select(self.highlightedIndex);
    }).click(function() {
      self.request(self.$input.val());
    }).attr('autocomplete', 'off'); // autocomplete off to turn off the browser's built-in cache of autocompletes
  }
  Autocomplete.prototype.request = function(term) {
    var self = this;
    if (this.currentTerm !== term) {
      // We aren't caching responses at the moment
      $.ajax({url: this.url, data: { q: term }, dataType: 'json',
        success: function(data) {
          self.update(data, term);
        }
      });
    }
    else if (this.$ul !== null) {
      // Whenever we activate the field without changing the text, still make sure the list shows.
      this.update(null, term);
    }
  };
  // response expects a list of objects with {label: 'str', value: 'str'} objects
  // if the objects don't have values, the labels will stand in as objects.
  Autocomplete.prototype.update = function(data, term) {
    // data may be null if we only want to show the box
    if (data !== null) {
      this.options = data;
      // Reset the highlighted index if this is a new query
      this.highlightedIndex = -1;
      this.currentTerm = term;
    }
    this.layout();
  };
  Autocomplete.prototype.layout = function() {
    if (this.options.length > 0) {
      this.$ul.show(); // only need to show it in case we didn't just create it

      var input_size = measureBox(this.$input);
      var input_offset = this.$input.offset();
      var position = {left: input_offset.left, top: input_offset.top + input_size.height};
      var limit = ($(window).height() - position.top) / 19 | 0;
      var lis = this.options.map(function(item) { return item.label || item.value; });
      this.$ul.css(position).html("<li>" + lis.slice(0, limit).join("</li><li>") + "</li>");

      var self = this;
      this.$ul.children('li').mouseover(function() {
        self.highlight($(this).index());
      }).mouseout(function() {
        self.unhighlight($(this).index());
      }).click(function() {
        self.select($(this).index());
      });
    }
    else
      this.$ul.hide();
  };
  Autocomplete.prototype.unhighlight = function(index) {
    this.$ul.children('li:eq(' + index + ')').removeClass('highlighted');
    this.highlightedIndex = -1;
  };
  Autocomplete.prototype.highlight = function(index) {
    if (this.highlightedIndex !== -1) {
      this.$ul.children('li:eq(' + this.highlightedIndex + ')').removeClass('highlighted');
    }
    this.$ul.children('li:eq(' + index + ')').addClass('highlighted');
    this.highlightedIndex = index;
  };
  Autocomplete.prototype.select = function(index) {
    var option = this.options[index];
    if (option !== undefined) {
      var html = option.label || option.value;
      var text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
      this.$input.val(text);
      if (this.postSelect)
        this.postSelect(option);
    }
    $('#' + this.id).hide();
  };

  $.fn.ac = function() {
    return this.each(function() {
      var $this = $(this);
      var url = $this.attr('data-autocomplete');
      var autocomplete = new Autocomplete($this, url);
      $this.data('autocomplete', autocomplete);
    });
  };
})($);
