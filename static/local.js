// "use strict"; /*jslint indent: 2 */ /*globals _, $, Backbone, Handlebars, TemplatedView, TemplatedCollection */
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
  preInitialize: function(ctx) {
    this.ctx = ctx;
    this.template = 'stims/' + (ctx.stim || 'default');
  },
  // preRender: function(ctx) {
    // ctx.keyvals = _.map(ctx, function(val, key) {
    //   return {key: key, val: val};
    // });
  // },
  submit: function(ev) {
    var self = this;
    var $submit = $(ev.target);
    var $form = $submit.closest('form');
    // window.ev = ev;
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
        console.log("Submitting with values from model:", self.ctx);
        _.defaults(response, self.ctx);
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
