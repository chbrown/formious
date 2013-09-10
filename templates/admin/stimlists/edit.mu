<div id="preview" style="display: none;">
  <div class="controls">
    <button>Hide preview</button>
  </div>
  <div class="content"></div>
</div>
<script>
// move #preview outside the default .admin div
$('body').append($('#preview'));
$('#preview > .controls button').on('click', function(ev) {
  $('#preview').hide();
});
</script>

<div id="stimlist"></div>
<script>
// have context to match the normal stimlist environment
var context = {
  hit_started: {{hit_started}},
  workerId: '{{workerId}}'
};

var StimlistView = TemplatedView.extend({
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
      this.$('.states table').addClass('hoverable');
      var message = 'Processed csv into ' + data.length + ' rows.';
      this.$('.states-form').flag({html: message, fade: 3000});
    }
  },
  preview: function(index) {
    // throw out the old stim
    if (this.stim) {
      this.stim.stopListening('finish');
    }

    // create the new one and show it in the overlay
    var states = this.model.get('states');
    var state = states[index];
    _.extend(state, context);
    var stim = new Stim(state);

    $('#preview').show().children('.content').html(stim.$el);

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
$('#stimlist').append(stimlist_view.el);
</script>
