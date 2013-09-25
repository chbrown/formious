<div id="preview" style="display: none;">
  <div class="controls"><span>&times;</span>Hide preview</div>
  <div class="content"></div>
</div>

<script>
// move #preview outside the default .admin div, so that .admin ... { /* etc. */ } css doesn't apply to it
$('body').append($('#preview'));
$('#preview > .controls').on('click', function(ev) {
  $('#preview').hide();
});
</script>

<div id="stimlist"></div>

<!-- <script src="/static/lib/jquery-contextMenu.js"></script> -->
<!-- <script src="/static/lib/jquery-handsontable.min.js"></script> -->
<script>
// have context to match the normal stimlist environment
// and might as well be connected to the current user
var context = {
  hit_started: {{hit_started}},
  workerId: '{{ticket_user._id}}'
};

var StimlistView = TemplatedView.extend({
  template: 'admin/stimlists/edit',
  loadText: function(raw) {
    var self = this;
    this.model.set('raw', raw);

    // outsource the csv processing, for now.
    $.ajax({
      url: '/sv',
      method: 'POST',
      data: raw,
      dataType: 'json',
    }).done(function(data, type, jqXHR) {
      self.model.set('columns', data.columns);
      self.model.set('states', data.rows);
      self.postRender();
    });
  },
  postRender: function(opts) {
    var states = this.model.get('states');
    var columns = this.model.get('columns');
    // states is a list of objects
    if (states.length) {
      // var handson_columns = columns.map(function(column) { return {data: column}; })
      // this.$('.states').handsontable({
      //   colHeaders: columns,
      //   columns: handson_columns,
      //   minSpareRows: 1,
      //   data: states,
      //   // contextMenu: false,
      // });
      if (columns === undefined || columns.length == 0) {
        columns = _.keys(states[0]);
      }
      var html = tabulate(states, columns);
      this.$('.states').html(html);
      this.$('.states table').addClass('hoverable box');
      var message = 'Processed upload into ' + states.length + ' rows.';
      this.$('.states-form').flag({anchor: 't', align: 'c', html: message, fade: 3000});
    }
    else {
      this.$('.states').html('No states');
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
        raw: this.model.get('raw'),
        columns: this.model.get('columns'),
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
