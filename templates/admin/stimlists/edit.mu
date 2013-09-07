<div class="panes"></div>

<script src="/static/compiled.js"></script>
<script src="/static/templates.js"></script>
<script src="/static/local.js"></script>
<script>
// have context to match the normal stimlist environment
var context = {
  hit_started: {{hit_started}},
  workerId: '{{workerId}}'
};

var StimlistView = TemplatedView.extend({
  className: 'pane-padded',
  template: 'admin/stimlists/edit',
  loadText: function(raw) {
    var self = this;
    self.model.set('csv', raw);
    // outsource the processing, for now.
    $.ajax({
      url: '/sv',
      method: 'POST',
      data: raw,
      dataType: 'json',
    }).done(function(data, type, jqXHR) {
      self.model.set('states', data);
      self.postRender();
    });
  },
  postRender: function(opts) {
    var data = this.model.get('states');
    if (data.length) {
      var html = tabulate(data);
      this.$('.states').html(html);
      var message = 'Processed csv into ' + data.length + ' rows.';
      this.$('.states-form').flag({html: message, fade: 3000});
    }
  },
  preview: function(index) {
    // throw out the old stim
    if (this.stim) {
      this.stim.stopListening('finish');
    }

    // create the new one and show it in the right pane
    var states = this.model.get('states');
    var state = states[index];
    _.extend(state, context);
    var stim = new Stim(state);
    stim.$el.addClass('pane-padded');

    pane_manager.set(1, stim.$el);
    var $pane_hide = $('<button class="pane-control">&raquo;</button>').appendTo(stim.$el);
    $pane_hide.on('click', function(ev) {
      pane_manager.limit(1);
    });

    // listen for next
    stim.on('finish', function() {
      this.preview(index + 1);
    }, this);

    // highlight the new row
    this.$('.states tbody tr').eq(index).addClass('preview').siblings().removeClass('preview');
  },
  events: {
    'click button': function(ev) {
      var attrs = {
        slug: $('[name=slug]').val(),
        creator: $('[name=creator]').val(),
        csv: this.model.get('csv'),
        states: this.model.get('states')
      };
      this.model.save(attrs, {
        patch: true,
        success: function(model, response, options) {
          $(ev.target).flag({text: 'Saved successfully', fade: 3000});
        }
      });
    },
    'click tr': function(ev) {
      this.preview($(ev.currentTarget).index());
    },
    'change [name=upload]': function(ev) {
      var self = this;
      var files = ev.target.files;
      var file = files[0];
      var reader = new FileReader();
      reader.onload = function(progress_event) {
        self.loadText(progress_event.target.result);
      };
      reader.readAsText(file); // , opt_encoding
      var message = 'Uploading ' + file.name + ' (' + file.size + ' bytes)';
      $(ev.target).flag({html: message, fade: 3000});
    },
    'change [name=paste]': function(ev) {
      this.loadText(ev.target.value);
    }
  }
});

var stimlist = new Stimlist({{{JSON.stringify(stimlist)}}});
var stimlist_view = new StimlistView({model: stimlist});
var pane_manager = $('.panes').append(stimlist_view.el).panes();
</script>
