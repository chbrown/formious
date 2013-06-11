"use strict"; /*jslint indent: 2 */ /*globals _, $, Backbone, Handlebars */
function now() { return (new Date()).getTime(); }

$(document).on('click', 'a[data-method]', function(ev) {
  ev.preventDefault();
  $.ajax({
    url: this.href,
    method: this.getAttribute('data-method')
  }).done(function(data, textStatus, jqXHR) {
    $(ev.target).flag({anchor: 'r', align: 'm', text: data.message, fade: 3000});
  });
});


// handlebars debug / caching
var _cache = {};
function renderHandlebars(template_name, context, ajax) {
  // returns html, sync
  if (ajax === undefined) {
    ajax = window.DEBUG; // DEBUG is a special global, which may be missing.
  }

  var template;
  if (ajax) {
    // only cache once per page load (this is debug, after all)
    template = _cache[template_name];
    if (template === undefined) {
      $.ajax({
        url: '/templates/' + template_name + '.bars',
        async: false,
        success: function(template_src) {
          template = _cache[template_name] = Handlebars.compile(template_src);
        }
      });
    }
  }
  else {
    template = Handlebars.templates[template_name];
  }
  return template(context);
}




function makeTable(cols, rows) {
  var trs = rows.map(function(cells) {
    return '<td>' + cells.join('</td><td>') + '</td>';
  });
  var thead = '<thead><tr><th>' + cols.join('</th><th>') + '</th></tr></thead>';
  var tbody = '<tbody><tr>' + trs.join('</tr><tr>') + '</tr></tbody>';
  return '<table>' + thead + tbody + '</table>';
}


// requires Backbone and Handlebars to be loaded
var TemplateView = Backbone.View.extend({
  initialize: function(opts) {
    // prePreRender
    var ctx = _.extend(this.model ? this.model.toJSON() : {}, opts);
    this.render(ctx);
    if (this.postInitialize) this.postInitialize(ctx);
  },
  render: function(ctx) {
    var self = this;
    if (this.preRender) this.preRender(ctx);
    self.el.innerHTML = renderHandlebars(this.template, ctx);
    if (this.postRender) this.postRender(ctx);
    if (ctx.replace) {
      // if .replace is given, it's the parent node that this new view should
      // attach to, replacing the old contents.
      ctx.replace.replaceWith(this.$el);
    }
    return this;
  }
});

var TemplatedCollection = Backbone.Collection.extend({
  renderTo: function($el, View) {
    var fragment = document.createDocumentFragment();
    this.each(function(model) {
      var ctx = model.toJSON();
      ctx.model = model;
      var view = new View(ctx);
      fragment.appendChild(view.el);
    });
    $el.append(fragment);
  }
});

var FormInput = TemplateView.extend({
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

// ####### ADMIN #######
var HIT = Backbone.Model.extend({});
var HITCollection = TemplatedCollection.extend({url: 'hits'});
var HITView = TemplateView.extend({
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
var AssignmentView = TemplateView.extend({
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

