<style>
  button {
    font-size: 90%;
    text-transform: capitalize;
  }
  .emoticon {
    text-align: center;
    font-size: 20em;
  }
  .allies td {
    padding: 8px 4px;
  }
  .allies .judgment {
    font-weight: bold;
    text-transform: capitalize;
  }
  .allies .judgment.friend {
    color: #00C;
  }
  .allies .judgment.enemy {
    color: #C00;
  }
</style>

<h4><i>Scenario:</i></h4>
<p>You are a battleship gunner in a WWII air battle. Your job is to
identify aircraft and determine whether they are friends or enemies.
You will receive feedback on your judgments.
<p>Your vision is sometimes limited due to angle or distance. Your allies are
identifying the same aircraft and provide estimates to the best of their
ability, given their positions.
<p>You will see a number of different scenes. You must advance through one at a time. Do not refresh the page.

<hr />

<div id="batch_display"></div>

<script src="/static/lib.js"></script>
<script src="/static/local.js"></script>
<script src="/templates/compiled.js"></script>
<script>
var config = {
  task_started: {{task_started}},
  assignmentId: "{{assignmentId}}",
  workerId: "{{workerId}}",
  host: "{{host}}",
  hitId: "{{hitId}}"
};
var raw_batches = (function() { return {{{JSON.stringify(batches)}}}; })();

var feedback_duration = 200;
// var scene_index = -1;
// never shrink!
// var scene_size = $('#scene').measureBox();
// $('#scene').css('min-height', scene_size.height);

// Handlebars;

// head.js(b+'handlebars.js', '/templates/compiled.js', function() {
// });


// var b = '/static/lib/js/';
// head.js(b+'jquery.js', b+'backbone_pkg.js', b+'jquery.flags.js', '/static/local.js', function() { });
var Response = Backbone.Model.extend({
  url: '/responses'
  // this.save();
  // $.ajax({
  //   url: '/responses',
  //   type: 'POST',
  //   dataType: 'json',
  //   data: JSON.stringify(response)
  //   // success: function(data, textStatus) {}
  // });
});

var Scene = Backbone.Model.extend({
  // allies: Array[5], gold: "enemy", id: 1, image_id: 35, src: "enemy-35-050.jpg", width: 50
  saveResponse: function(choice, correct) {
    var response = new Response({
      workerId: config.workerId,
      task_started: config.started,
      prior: config.prior,
      scene_index: this.id,
      reliabilities: _.map(this.get('allies'), function(ally) { return ally.reliability.toFixed(4); }),
      judgments: _.pluck(this.get('allies'), 'judgment'),
      gold: this.get('gold'),
      choice: choice,
      correct: correct,
      image_id: this.get('image_id'),
      width: this.get('width'),
      time: now() - this.get('shown')
    });
    response.save();
  },
  next: function() {
    return this.collection.get(this.id + 1);
  },
  toJSON: function() {
    return _.extend(this.collection.batch.toJSON(), this.attributes);
  }
});
var SceneCollection = Backbone.Collection.extend({model: Scene});
var SceneView = TemplateView.extend({
  template_id: 'scene',
  // a scene is given exactly a model
  render: function(ctx) {
    this.model.set('shown', now());
    _.extend(ctx, this.model.toJSON());

    // prep the next image for instant loading
    var next = this.model.next();
    ctx.next = next ? next.toJSON() : null;

    this.constructor.__super__.render.apply(this, [ctx]);
    return this;
  },
  events: {
    'click button': function(ev) {
      this.trigger('end', ev);
    }
  }
});

var Batch = Backbone.Model.extend({
  // prior: 0.5, scenes: Array[50], total_enemy: 25, total_friendly: 25
  initialize: function(opts) {
    this.scenes = new SceneCollection(opts.scenes);
    this.unset('scenes'); // is there a better way to ignore that?
    this.scenes.batch = this;
  },
  next: function() {
    return this.collection.get(this.id + 1);
  },
  toJSON: function() {
    return _.extend({batch_id: this.id}, this.attributes);
  }
});
var BatchCollection = Backbone.Collection.extend({model: Batch});
var BatchDisplay = TemplateView.extend({
  template_id: 'batch',
  // initialize: function(opts) {
  //   // opts: {collection: some_batch_collection}
  //   this.constructor.__super__.initialize.apply(this, opts);
  //   this.collection = opts.collection;
  // },
  render: function(ctx) {
    this.constructor.__super__.render.apply(this, [ctx]);
    this.batch = this.collection.get((this.batch ? this.batch.id : 0) + 1);
    this.nextScene();
    // this.constructor.__super__.initialize.apply(this, opts);
  },
  nextScene: function() {
    // advance scene
    var self = this;
    this.scene = this.batch.scenes.get((this.scene ? this.scene.id : 0) + 1);

    var scene_display = new SceneView({el: this.$('#batch_root'), model: this.scene});
    scene_display.once('end', function(ev) {
      var choice = $(ev.target).text().toLowerCase();
      var correct = choice == self.scene.get('gold');
      self.scene.saveResponse(choice, correct);

      new FeedbackView({el: self.$('#batch_root'), correct: correct})

      setTimeout(function() {
        // advance!
        self.nextScene();
      }, feedback_duration);
      // if (this.render()) {
      // }
      // else {
        // this.collection.batch.next().show();
      // }
    });
  }
});


var ConclusionView = TemplateView.extend({
  template_id: 'conclusion',
  render: function() {
    var ctx = _.extend({duration: now() - config.started}, config);
    this.constructor.__super__.render.apply(this, ctx);
  }
});

var ConsentView = TemplateView.extend({
  template_id: 'consent',
  events: {
    'click button': start
  }
});

var FeedbackView = TemplateView.extend({
  template_id: 'feedback'
});

function start() {
  var batch_collection = new BatchCollection(raw_batches);
  // window.batch_collection = batch_collection;
  var batch_view = new BatchDisplay({el: $('#batch_display'), collection: batch_collection});
}

$(function() {
  if (config.assignmentId == '' || config.assignmentId == "ASSIGNMENT_ID_NOT_AVAILABLE") {
    start();
  }
  else {
    new ConsentView({el: $('#batch_display')});
  }
});

</script>
