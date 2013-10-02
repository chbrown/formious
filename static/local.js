"use strict"; /*jslint indent: 2 */ /*globals _, $, Backbone, Handlebars, TemplatedView, TemplatedCollection */
function time() { return (new Date()).getTime(); }

$(document).on('click', 'a[data-method]', function(ev) {
  ev.preventDefault();
  var method = this.getAttribute('data-method');
  $.ajax({
    url: this.href,
    method: method
  }).done(function(data, textStatus, jqXHR) {
    $(ev.target).flag({
      anchor: 'r',
      text: data.message,
      fade: 3000
    }).closest('.record').addClass(method);
  });
});


function makeTable(cols, rows) {
  var thead = '<thead><tr><th>' + cols.join('</th><th>') + '</th></tr></thead>';
  var trs = rows.map(function(cells) {
    return '<td>' + cells.join('</td><td>') + '</td>';
  });
  var tbody = '<tbody><tr>' + trs.join('</tr><tr>') + '</tr></tbody>';
  return '<table>' + thead + tbody + '</table>';
}
function tabulate(objects, keys) {
  // convert a list of objects to flat rows, using the given list of keys, then render them to a table.
  var rows = objects.map(function(object) {
    return keys.map(function(key) {
      return object[key];
    });
  });
  return makeTable(keys, rows);
}

function fileinputText(input, callback) {
  // callback: function(Error | null, file_contents, file_name, file_size)
  var files = input.files;
  var file = files[0];
  var reader = new FileReader();
  reader.onerror = function(err) {
    callback(err, null, file ? file.name : undefined, file ? file.size : undefined);
  };
  reader.onload = function(progress_event) {
    callback(null, progress_event.target.result, file.name, file.size);
  };
  reader.readAsText(file); //, opt_encoding
}

// requires Backbone and Handlebars to be loaded

// a stim (aka., state, when in a list of stims) is the full
var StimView = TemplatedView.extend({
  // usage new StimView({hit_started: Number, stimlist_slug: String, ...})
  template: 'stims/default',
  preRender: function(ctx) {
    if (ctx.stim) {
      this.template = 'stims/' + ctx.stim;
    }
    else {
      ctx.keyvals = _.map(ctx, function(val, key) {
        return {key: key, val: val};
      });
    }
  },
  submit: function(ev) {
    var self = this;
    var $submit = $(ev.target);
    var $form = $submit.closest('form');
    window.ev = ev;
    // we only hijack the submit if the form does not have an action
    // console.log('Submit', $form.serialize(), $form.serializeArray());
    // return false;
    if (!$form.attr('action')) {
      ev.preventDefault();
      // to catch the submit and serialize its values.
      var response = _.object($form.serializeArray());
      if ($submit.attr('name')) {
        // get the button's value, because otherwise it's not serialized
        response[$submit.attr('name')] = $submit.val();
      }

      if (_.isEmpty(response)) {
        // don't save empty responses
        self.trigger('finish');
      }
      else {
        // fill it out with useful metadata (which is stored in this.model)
        _.defaults(response, this.model.toJSON());
        response.submitted = time();
        new Response(response).save(null, {
          success: function(model, response, options) {
            self.trigger('finish');
          },
          error: function(model, xhr, options) {
            // alert('Failed');
            self.trigger('finish');
          }
        });
      }
    }
  },
  events: {
    'click form button': 'submit'
    // 'click [type="submit"]': 'submit'
  }
});


var FormInput = TemplatedView.extend({
  template: 'form-input',
  preRender: function(ctx) {
    this.id = ctx.id;
    ctx.label = ctx.label || this.id;
    ctx.value = localStorage[this.id];
  },
  postRender: function(ctx) {
    // window.form = this;
    this.$('input').css({width: ctx.width});
  },
  events: {
    'change input': function(ev) {
      // this.$('input')
      var value = ev.target.value;
      localStorage[this.id] = value;
    }
  }
});


// ####### ADMIN #######
var HIT = Backbone.Model.extend({});
var HITCollection = TemplatedCollection.extend({url: 'hits'});
var HITView = TemplatedView.extend({
  template: 'admin/HITs/one'
});
var MTWorker = Backbone.Model.extend({
  urlRoot: '../Workers'
});
var MTWorkerCollection = TemplatedCollection.extend({
  url: '../Workers'
});

var Assignment = Backbone.Model.extend({
  idAttribute: 'AssignmentId'
});
var AssignmentCollection = TemplatedCollection.extend({
  model: Assignment,
  url: '../Assignments'
});
var AssignmentView = TemplatedView.extend({
  className: 'assignment',
  template: 'admin/assignments/one',
  preRender: function(ctx) {
    // AssignmentStatus is one of Submitted | Approved | Rejected
    ctx[ctx.AssignmentStatus] = true;
    ctx.reason = localStorage.current_reason;
  },
  events: {
    'change input[name="reason"]': function(ev) {
      localStorage.current_reason = ev.target.value;
    },
    'click button.responses': function(ev) {
      var workerId = this.model.get('WorkerId');
      var worker = new MTWorker({id: workerId});
      worker.fetch({
        success: function(model, user, options) {
          var keys = {};
          user.responses.slice(0, 50).forEach(function(response) {
            _.extend(keys, response);
          });

          var cols = _.keys(keys).sort();
          var data = user.responses.map(function(response) {
            return cols.map(function(col) {
              return response[col];
            });
          });

          $(ev.target).replaceWith(makeTable(cols, data));
        }
      });
    },
    'click button[data-action]': function(ev) {
      var action = $(ev.target).attr('data-action');
      var params = {};
      if (action == 'GrantBonus') {
        params.BonusAmount = this.$('.bonus input[name="amount"]').val();
        params.Reason = this.$('.bonus input[name="reason"]').val();
        params.WorkerId = this.model.get('WorkerId');
      }
      // $.post( url [, data ] [, success(data, textStatus, jqXHR) ] [, dataType ] )
      $.post(this.model.url() + '/' + action, params, function(data, textStatus, jqXHR) {
        $(ev.target).flag({html: data.message, fade: 5000});
      });
    }
  }
});

// ####### EXPERIMENT #######
var Response = Backbone.Model.extend({
  url: '/responses'
});

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
