<style>
tr:hover {
  background-color: #DDD;
}
tr.preview {
  background-color: #BBB;
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
var StimlistView = TemplateView.extend({
  stim: null,
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
    var stim = new Stim(states[index]);
    pane_manager.set(1, stim.$el);

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
          this.$('button').flag({text: 'Saved successfully', fade: 3000});
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
