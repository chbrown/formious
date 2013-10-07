<div id="preview" style="display: none">
  <div class="controls"><span>&times;</span>Hide preview</div>
  <div class="content"></div>
</div>

<script>
// move #preview outside the default .admin div, so that .admin ... { /* etc. */ } css doesn't apply to it
// $('body').append($('#preview'));
$('#preview > .controls').on('click', function(ev) {
  $('#preview').hide();
});
</script>


<section>
  <h3>Stimlist: {{stimlist._id}}</h3>
  URL: <a href="/stimlists/{{stimlist._id}}">{{stimlist._id}}</a>
</section>

<div id="stimlist">
  <form action="/admin/stimlists/{{stimlist._id}}">
    <section class="box hform">
      <label><span>ID</span>
        <input name="_id" type="text" value="{{stimlist._id}}" />
      </label>

      <label><span>Creator</span>
        <input name="creator" type="text" value="{{stimlist.creator}}" />
      </label>

      <label>
        <input name="segmented" type="checkbox" {{#stimlist.segmented}}checked{{/}} />
        <span>Segmented (by participant)</span>
      </label>

      <button type="submit">Save</button>
    </section>

    <section class="box vform">
      <label><span>Prepend stim (show before each experiment)</span>
        <input name="pre_stim" type="text" value="{{stimlist.pre_stim}}" style="width: 250px" />
      </label>

      <label><span>Default stim (if no <code>stim</code> column is specified)</span>
        <input name="default_stim" type="text" value="{{stimlist.default_stim}}" style="width: 250px" />
      </label>

      <label><span>Append stim (show after each experiment)</span>
        <input name="post_stim" type="text" value="{{stimlist.post_stim}}" style="width: 250px" />
      </label>
    </section>

    <section class="box vform">
      <label>
        <span>Segments</span>
      </label>
      <input name="segments" type="array" class="array" />
    </section>

    <section class="box vform">
      <label>
        <span>Claimed segments</span>
      </label>
      <input name="segments_claimed" type="array" class="array" />
    </section>
  </form>

  <section class="fill vform">
    <label><span>Paste</span>
      <textarea placeholder="Paste csv here" id="paste" rows="1">
      </textarea>
    </label>

    <label><span>Upload</span>
      <input type="file" id="upload">
    </label>
  </section>

  <section class="states fill"></section>
</div>

<script src="/static/inputs.js"></script> <!-- For ListInput() and $.listinput -->
<script>
// have context to match the normal stimlist environment
// and might as well be connected to the current user
var context = {
  hit_started: {{hit_started}},
  workerId: '{{ticket_user._id}}'
};

var StimlistView = Backbone.View.extend({
  // template: 'admin/stimlists/edit',
  initialize: function() {
    // this.model.on('change', this.render, this);
    this.form = new Form(this.el);

    // initialize arrays (to be merged into form.set?)
    this.segments = $.listinput($('[name="segments"]'));
    this.segments_claimed = $.listinput($('[name="segments_claimed"]'));

    // final display step
    this.render();
  },
  render: function() {
    var stimlist_values = $.extend(true, {}, this.model.toJSON());

    this.form.set(stimlist_values);
    // set arrays (to be merged into form.set?)
    this.segments.set(this.model.get('segments'));
    this.segments_claimed.set(this.model.get('segments_claimed'));

    // render states:
    var states = this.model.get('states');
    var columns = this.model.get('columns');
    // states is a list of objects
    if (states.length) {
      if (columns === undefined || columns.length == 0) {
        columns = _.keys(states[0]);
      }

      var html = tabulate(states, columns);
      this.$('.states').html(html);
      this.$('.states table').addClass('hoverable');
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
    var stim_ctx = _.extend({}, {stim: this.model.get('default_stim')}, states[index], context);
    var stim = new StimView(stim_ctx);

    $('#preview').show().children('.content').html(stim.$el);

    // listen for next
    stim.on('finish', function() {
      this.preview(index + 1);
    }, this);

    // highlight the new row
    this.$('.states tbody tr').eq(index).addClass('preview').siblings().removeClass('preview');
  },
  events: {
    'submit form': function(ev) {
      ev.preventDefault();
      var $button = $(ev.target).find('button[type="submit"]');
      var url = $(ev.target).attr('action');

      var form_obj = this.form.get();
      var attrs = _.extend(this.model.toJSON(), form_obj);

      // Backbone doesn't let us set the URL in the request. So, that's dumb.
      // var save_xhr = this.model.save(attrs, {patch: true});
      var patch_xhr = $.ajax({
        url: url,
        method: 'PATCH',
        data: JSON.stringify(attrs),
        dataType: 'json',
      });
      patch_xhr.error(function(jqXHR, textStatus, errorThrown) {
        $button.flag({text: jqXHR.responseText, fade: 3000});
      });
      patch_xhr.success(function(data, textStatus, jqXHR) {
        var message = jqXHR.getResponseHeader('x-message') || 'Success!';
        $button.flag({text: message, fade: 3000});

        var redirect = jqXHR.getResponseHeader('location');
        if (redirect) {
          // pushState/replaceState arguments: (state_object, dummy, url)
          // history.pushState(form_obj, '', redirect);
          window.location = redirect;
        }
      });

      $button.flag({html: '<img src="/static/lib/img/throbber-16-black.gif" />', fade: 5000});
    },
    'click tr': function(ev) {
      this.preview($(ev.currentTarget).index());
    },
    'change #upload': function(ev) {
      var self = this;

      fileinputText(ev.target, function(err, file_contents, file_name, file_size) {
        if (err) return $(ev.target).flag({text: err});

        var message = 'Uploading ' + file_name + ' (' + file_size + ' bytes)';
        $(ev.target).flag({html: message, fade: 1000});
        self.model.loadRaw(file_contents, function(err) {
          if (err) return $(ev.target).flag({text: err});

          var message = 'Processed upload into ' + self.model.get('states').length + ' rows.';
          $(ev.target).flag({html: message, fade: 3000});

          // has made change, so render.
          self.render();
        });
      });
    },
    'change #paste': function(ev) {
      var self = this;
      this.model.loadRaw(ev.target.value, function(err) {
        if (err) return $(ev.target).flag({text: err});

        self.render();
      });
    }
  }
});

var Stimlist = Backbone.Model.extend({
  urlRoot: '/admin/stimlists',
  idAttribute: '_id',
  loadRaw: function(raw_string, callback) {
    // callback: function(Error | null, Stimlist | null)
    var self = this;
    this.set('raw', raw_string);

    // outsource the csv processing, for now.
    $.ajax({
      url: '/sv',
      method: 'POST',
      data: raw_string,
      dataType: 'json'
    }).done(function(data, type, jqXHR) {
      // infer things about the stimlist from what they just uploaded
      self.set('columns', data.columns);
      self.set('states', data.rows);

      var segmented = _.contains(data.columns, 'segment');
      self.set('segmented', segmented);
      if (segmented) {
        var segments = _.pluck(data.rows, 'segment');
        self.set('segments', _.uniq(segments));
      }

      callback(null, self);
    }).fail(function(jqXHR, textStatus, errorThrown) {
      callback(errorThrown);
    });
  }
});

var stimlist = new Stimlist({{{JSON.stringify(stimlist)}}});
var stimlist_view = new StimlistView({model: stimlist, el: $('#stimlist')});
$('#stimlist').append(stimlist_view.el);
</script>
