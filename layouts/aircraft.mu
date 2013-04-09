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

<div id="root"></div>

<script src="/static/compiled.js"></script>
<script>
var config = {
  task_started: {{task_started}},
  assignmentId: "{{assignmentId}}",
  workerId: "{{workerId}}",
  host: "{{host}}",
  hitId: "{{hitId}}"
};
// (function() { return ...; })();
var raw_batches = {{{JSON.stringify(batches)}}};

var feedback_duration = 200;
// never shrink!
// var scene_size = $('#scene').measureBox();
// $('#scene').css('min-height', scene_size.height);

var Response = Backbone.Model.extend({
  url: '/responses'
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

var SceneView = TemplateView.extend({
  template: 'aircraft-scene.mu',
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
      var self = this;
      var choice = $(ev.target).text().toLowerCase();
      var correct = choice == this.model.get('gold');
      this.model.saveResponse(choice, correct);

      var feedback = new FeedbackView({correct: correct});
      this.$el.replaceWith(feedback.$el);

      setTimeout(function() {
        self.trigger('end', ev);
      }, feedback_duration);
    }
  }
});

var BatchView = TemplateView.extend({
  template: 'aircraft-batch.mu',
  render: function(ctx) {
    this.constructor.__super__.render.apply(this, [ctx]);
    this.showBatch(this.collection.first());
  },
  showBatch: function(batch) {
    // this.batch = this.collection.get((this.batch ? this.batch.id : 0) + 1);
    var scene = batch.scenes.first();
    this.showScene(scene, batch);
  },
  showScene: function(scene, batch) {
    var self = this;
    if (scene) {
      var scene_display = new SceneView({model: scene});
      scene_display.once('end', function(ev) {
        self.showScene(scene.next(), batch);
      });
      this.$el.html(scene_display.$el);
    }
    else {
      var ctx = batch.toJSON();
      console.log(ctx);
      var scene_debriefing = new SceneDebriefingView(ctx);
      scene_debriefing.once('end', function(ev) {
        self.showBatch(batch.next());
      });
      this.$el.html(scene_debriefing.$el);
    }
  }
});

var ConclusionView = TemplateView.extend({
  template: 'aircraft-conclusion.mu',
  render: function() {
    var ctx = _.extend({duration: now() - config.started}, config);
    this.constructor.__super__.render.apply(this, [ctx]);
  }
});

var ConsentView = TemplateView.extend({
  template: 'aircraft-consent.mu',
  events: {
    'click button': function() {
      var batch_collection = new BatchCollection(raw_batches);
      var batch_view = new BatchView({collection: batch_collection});
      this.$el.replaceWith(batch_view.$el);
      // console.log(this.$el.parent(), batch_view.$el.html());
    }
  }
});

var FeedbackView = TemplateView.extend({
  template: 'aircraft-feedback.mu'
});

var SceneDebriefingView = TemplateView.extend({
  template: 'aircraft-scene-debriefing.mu',
  render: function(ctx) {
    // this.model.set('shown', now());

    // prep the next image for instant loading
    //   var next = this.model.next();
    // ctx = next ? next.toJSON() : null;

    this.constructor.__super__.render.apply(this, [ctx]);
    return this;
  },
  events: {
    'click button': function(ev) {
      this.trigger('end', ev);
    }
  }
});



$(function() {
  var consent_view = new ConsentView();
  $('#root').append(consent_view.$el);
  if (config.assignmentId == '' || config.assignmentId == "ASSIGNMENT_ID_NOT_AVAILABLE") {
    consent_view.$('button').click();
  }
});

</script>
