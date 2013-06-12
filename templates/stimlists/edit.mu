<style>
tr:hover {
  background-color: #DDD;
}
table td {
  font-size: 80%;
}
* { box-sizing: border-box; }
</style>

<div class="panes"></div>

<script src="/static/compiled.js"></script>
<script src="/static/templates.js"></script>
<script src="/static/local.js"></script>
<script>
function tabulate(objects) {
  // use just the first object for the set of key/columns
  var cols = _.keys(objects[0]);
  var rows = objects.map(function(object) {
    return cols.map(function(col) {
      return object[col];
    });
  });
  return makeTable(cols, rows);
}

// a stim (aka., state, when in a list of stims) is the full
var Stim = TemplateView.extend({
  template: 'stims/default',
  preRender: function(ctx) {
    console.log('preRender', ctx);
    if (ctx.stim) {
      this.template = 'stims/' + ctx.stim;
    }
    ctx.keyvals = _.map(ctx, function(val, key, list) { return {key: key, val: val}; });
  }
});

var Stimlist = Backbone.Model.extend({
  urlRoot: '/stimlists',
  idAttribute: '_id'
});
var StimlistView = TemplateView.extend({
  template: 'stimlists/edit',
  loadText: function(raw) {
    // console.log('loadText', raw);
    var self = this;
    // outsource the processing, for now.
    $.ajax({
      url: '/sv',
      method: 'POST',
      data: raw,
      dataType: 'json',
    }).done(function(data, type, jqXHR) {
      console.log('done', data, type);
      self.model.set('states', data);
      self.postRender();
    });
  },
  postRender: function(opts) {
    var data = this.model.get('states');
    console.log(data, opts);
    if (data.length) {
      var html = tabulate(data);
      this.$('.states').html(html);
      var message = 'Processed csv into ' + data.length + ' rows.';
      this.$('.states-form').flag({html: message, fade: 3000});
    }
  },
  preview: function(index) {
    var states = this.model.get('states');
    var state = states[index];

    var stim = new Stim(state);
    pane_manager.set(1, stim.$el);
  },
  events: {
    'click button': function(ev) {
      var attrs = {
        slug: $('[name=slug]').val(),
        creator: $('[name=creator]').val(),
        csv: this.model.get('csv'),
        states: this.model.get('states'),
      };
      this.model.save(attrs, {
        patch: true,
        success: function(model, xhr, options) {
          console.log(model, options);
        }
      });
    },
    'click tr': function(ev) {
      var $tr = $(ev.currentTarget);
      // console.log('click tr', ev, $tr, $tr.index());
      this.preview($tr.index());
    },
    'change [name=upload]': function(ev) {
      var self = this;
      var files = ev.target.files;
      var file = files[0];
      var reader = new FileReader();
      reader.onload = function(progress_event) {
        self.loadText(progress_event.target.result, ev.target);
      };
      reader.readAsText(file); // , opt_encoding
      var message = 'Uploading ' + file.name + ' (' + file.size + ' bytes)';
      this.$('.states-form').flag({html: message, fade: 3000});
    },
    'change [name=paste]': function(ev) {
      this.loadText(ev.target.value, ev.target);
    }
  }
});

var stimlist = new Stimlist({{{JSON.stringify(stimlist)}}});
var stimlist_view = new StimlistView({model: stimlist});
var pane_manager = $('.panes').append(stimlist_view.el).panes();
</script>
