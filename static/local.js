"use strict"; /*jslint indent: 2 */ /*globals _, $, Backbone, Handlebars, TemplatedView, TemplatedCollection */
function time() { return (new Date()).getTime(); }

$(document).on('click', 'a[data-method]', function(ev) {
  ev.preventDefault();
  $.ajax({
    url: this.href,
    method: this.getAttribute('data-method')
  }).done(function(data, textStatus, jqXHR) {
    $(ev.target).flag({anchor: 'r', align: 'm', text: data.message, fade: 3000});
  });
});


function makeTable(cols, rows) {
  var trs = rows.map(function(cells) {
    return '<td>' + cells.join('</td><td>') + '</td>';
  });
  var thead = '<thead><tr><th>' + cols.join('</th><th>') + '</th></tr></thead>';
  var tbody = '<tbody><tr>' + trs.join('</tr><tr>') + '</tr></tbody>';
  return '<table>' + thead + tbody + '</table>';
}
function tabulate(objects) {
  // convert a list of objects to columns and rows, then render them to a table.
  // use just the first object for the set of key/columns
  var cols = _.keys(objects[0]);
  var rows = objects.map(function(object) {
    return cols.map(function(col) {
      return object[col];
    });
  });
  return makeTable(cols, rows);
}



// requires Backbone and Handlebars to be loaded

// a stim (aka., state, when in a list of stims) is the full
var Stim = TemplatedView.extend({
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
  events: {
    'click [type="submit"]': function(ev) {
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
          // the button
          response[$submit.attr('name')] = $submit.val();
        }

        if (_.isEmpty(response)) {
          // don't save empty responses
          self.trigger('finish');
        }
        else {
          // else fill it out with useful metadata
          // `context` and `stimlist` are globals that a Stim view will always have access to
          response.hit_started = context.hit_started;
          response.stimlist = stimlist.get('slug');
          response.submitted = time();
          new Response(response).save(null, {
            success: function(model, response, options) {
              // console.log('response.save cb', arguments);
              self.trigger('finish');
            },
            error: function(model, xhr, options) {
              // console.log('response.error cb', arguments);
              // alert('Failed');
              self.trigger('finish');
            }
          });
        }
      }
    }
  }
});

var Stimlist = Backbone.Model.extend({
  urlRoot: '/admin/stimlists',
  idAttribute: '_id'
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
    // console.log(this.$('input'),
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


var PaneManager = function(opts) {
  this.$el = $(opts.el);
  // initialize stuff
  this.$el.css({width: '100%', height: '100%'});
};
PaneManager.prototype.add = function($pane) {
  // $pane could actually be html, just as well
  this.$el.append($pane);
  this.layout();
};
PaneManager.prototype.limit = function(count) {
  this.$el.children().slice(count).remove();
  this.layout();
};
PaneManager.prototype.set = function(index, $pane) {
  var $panes = this.$el.children();
  if ($panes.length == index) {
    // just like this.add()
    this.$el.append($pane);
    this.layout();
  }
  else {
    // throw error or just don't do anything if $panes.length == 2 and we set(4, '<br/>'), e.g.
    $panes.eq(index).replaceWith($pane);
    this.layout();
  }
};
PaneManager.prototype.layout = function(orientation) {
  if (orientation === undefined) orientation = 'v';
  var $panes = this.$el.children().attr('style', '').css({overflow: 'auto'});
  // console.log('layout -> ', $panes.length);
  if ($panes.length == 1) {
    // $panes.css({width: '', height: ''});
    $panes.css({
      width: '100%',
      height: '100%'
    });
  }
  else if ($panes.length == 2) {
    if (orientation == 'v') {
      $panes.eq(0).css({width: '50%'});
      $panes.eq(1).css({
        'position': 'absolute',
        'top': 0,
        'left': '50%'
        // 'min-height': '100%'
      });
    }
    else {
      $panes.eq(0).css({height: '50%'});
      $panes.eq(1).css({
        'position': 'absolute',
        'top': '50%'
        // 'min-height': '50%'
      });
    }
  }
  else if ($panes.length == 3) {
    // the first is the biggest
    // var $panes.eq(1) = $panes.eq(2);
    if (orientation == 'v') {
      /*  +--+--+
          |  |  |
          |  +--+
          |  |  |
          +--+--+  */
      $panes.eq(0).css({width: '50%'});
      $panes.eq(1).css({left: '50%', height: '50%'});
      $panes.eq(2).css({left: '50%'});
    }
    else {
      /*  +--+--+
          |     |
          +--+--+
          |  |  |
          +--+--+  */
      $panes.eq(0).css({height: '50%'});
      $panes.eq(1).css({width: '50%'});
      $panes.eq(2).css({left: '50%'});
    }
  }
  else {
    throw new Error('Too many panes. Maximum is 3.');
  }
};

$.fn.panes = function(opts) {
  // only use the first item
  return new PaneManager({el: this[0]});
};


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

