/*jslint browser: true */ /*globals $ */
(function($) {
  // requires $ and $.fn.flag
  var ListInput = function(element, opts) {
    var $element = $(element);
    this.name = $element.attr('name');
    var css_classes = $element.attr('class');
    this.$container = $('<div />').replaceAll(element).attr('class', css_classes);

    this.value = [];

    // set up events
    var self = this;
    this.$container.on('click', '.add', function(ev) {
      ev.preventDefault();

      self.value.push('');
      self.render();
      // render first, then feedback
      self.$container.find('input:last').flag({text: 'Added empty item', fade: 2000, anchor: 'l'});
    });
    this.$container.on('click', '.remove', function(ev) {
      ev.preventDefault();

      var index = $(ev.target).closest('div').index();
      var removed = self.value.splice(index, 1);

      // feedback first, then render
      $(ev.target).flag({text: 'Removed "' + removed + '"', fade: 3000, anchor: 'r'});
      self.render();
    });
    this.$container.on('change input', function(ev) {
      var index = $(ev.target).closest('div').index();
      self.value[index] = $(ev.target).val();
    });

    this.render();
  };
  ListInput.prototype.get = function() {
    return this.value;
  };
  ListInput.prototype.set = function(value) {
    this.value = value;
    this.render();
  };
  ListInput.prototype.render = function() {
    var $container = this.$container.empty();
    var name = this.name;
    this.value.forEach(function(value) {
      var context = {name: name, value: value};
      var item_html = ListInput.item_template.replace(/\{\{(\w+)\}\}/g, function(match, group) {
        return context[group];
      });
      $container.append(item_html);
    });
    $container.append('<div class="controls"><button class="add">+</button></div>');
  };

  ListInput.item_template = '<div><input type="text" value="{{value}}" name="{{name}}" /> <a class="remove">&times;</a></div>';

  $.listinput = function(element, opts) {
    return new ListInput(element, opts);
  };

  $.fn.listinput = function(opts) {
    return this.each(function(i, element) {
      // element === this
      $.listinput(this, opts);
    });
  };
})($);
