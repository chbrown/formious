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

<script src="/static/lib/jquery-flags.js"></script>
<script>
// have context to match the normal stimlist environment
// and might as well be connected to the current user
var context = {
  hit_started: {{hit_started}},
  workerId: '{{ticket_user._id}}'
};

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

var StimlistView = TemplatedView.extend({
  template: 'admin/stimlists/edit',
  postInitialize: function() {
    this.model.on('change', this.postRender, this);
  },
  postRender: function() {
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
      this.$('.states-form').flag({anchor: 't', html: message, fade: 3000});
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
    var stim = new StimView(state);

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
        creator: $('[name=creator]').val(),
        slug: $('[name=slug]').val(),
        raw: this.model.get('raw'),
        columns: this.model.get('columns'),
        states: this.model.get('states'),
        segmented: $('[name=segmented]').prop('checked'),
        segments: this.model.get('segments')
      };
      this.model.save(attrs, {
        patch: true,
        success: function(model, response, options) {
          var message = options.xhr.getResponseHeader('x-message') || 'Success!';
          $(ev.target).flag({text: message, fade: 3000});
        }
      });
    },
    'click tr': function(ev) {
      this.preview($(ev.currentTarget).index());
    },
    'change [name=upload]': function(ev) {
      var self = this;

      fileinputText(ev.target, function(err, file_contents, file_name, file_size) {
        if (err) return $(ev.target).flag({text: err});

        var message = 'Uploading ' + file_name + ' (' + file_size + ' bytes)';
        $(ev.target).flag({html: message, fade: 3000});
        self.model.loadRaw(file_contents, function(err) {
          if (err) return $(ev.target).flag({text: err});
        });
      });
    },
    'change [name=paste]': function(ev) {
      this.model.loadRaw(ev.target.value, function(err) {
        if (err) return $(ev.target).flag({text: err});
      });
    }
  }
});

var Stimlist = Backbone.Model.extend({
  urlRoot: '/admin/stimlists',
  idAttribute: '_id',
  loadRaw: function(csv_string, callback) {
    // callback: function(Error | null, Stimlist | null)
    var self = this;
    this.set('raw', csv_string);

    // outsource the csv processing, for now.
    $.ajax({
      url: '/sv',
      method: 'POST',
      data: csv_string,
      dataType: 'json'
    }).done(function(data, type, jqXHR) {
      self.set('columns', data.columns);
      self.set('states', data.rows);

      var segmented = _.contains(data.columns, 'participant');
      self.set('segmented', segmented);
      if (segmented) {
        var segments = _.pluck(data.rows, 'participant');
        self.set('segments', _.uniq(segments));
      }

      callback(null, self);
    }).fail(function(jqXHR, textStatus, errorThrown) {
      callback(errorThrown);
    });
  }
});

var stimlist = new Stimlist({{{JSON.stringify(stimlist)}}});
var stimlist_view = new StimlistView({model: stimlist});
$('#stimlist').append(stimlist_view.el);
</script>
