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
<p>You are an aircraft spotter in WWII air battles. Your job is to
identify aircraft and determine whether they are enemies or not.
You will receive feedback on your judgments.
<p>Your vision is sometimes limited due to angle or distance. Your allies are
identifying the same aircraft and give judgments to the best of their
ability, given their positions.
<p>You will see a number of different scenes. You must advance through one at a time. Do not refresh the page.

<hr />

<div id="root">
  <!-- <div id="notices" style="position: absolute; width: 280px; height: 0; right: 10px; bottom: 0"></div> -->
</div>

<script src="/static/compiled.js"></script>
<script src="/static/templates.js"></script>
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

var feedback_duration = 2000;

var Response = Backbone.Model.extend({
  url: '/responses'
});

var Scene = Backbone.Model.extend({
  // allies: Array[5], gold: "enemy", id: 1, image_id: 35, src: "enemy-35-050.jpg", width: 50
  saveResponse: function(choice, correct) {
    var response = new Response({
      workerId: config.workerId,
      task_started: config.task_started,
      prior: this.collection.batch.get('prior'),
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

// var BatchView = TemplateView.extend({
//   template: 'aircraft-batch.mu',
//   postRender: function(ctx) {
//     this.showBatch(this.collection.first());
//   },
//   showBatch: function(batch) {
//     var scene = batch.scenes.first();
//     this.showScene(scene, batch);
//   },
//   showScene: function(scene, batch) {
//     var self = this;
//   }
// });

var SceneView = TemplateView.extend({
  template: 'aircraft-scene.mu',
  // a scene is given exactly a model
  preRender: function(ctx) {
    this.model.set('shown', now());
    _.extend(ctx, this.model.toJSON());

    // prep the next image for instant loading
    var next = this.model.next();
    ctx.next = next ? next.toJSON() : null;
  },
  postRender: function(ctx) {
    // purely aesthetic. never shrink!
    setTimeout(function() {
      var scene_size = $('#root').measureBox();
      $('#root').css('min-height', scene_size.height);
    }, 100);
  },
  events: {
    'click button': function(ev) {
      var self = this;
      var choice = $(ev.target).attr('data-id');
      var correct = (choice == this.model.get('gold'));
      this.model.saveResponse(choice, correct);

      var feedback = new SceneFeedbackView({correct: correct, model: this.model});
      this.$el.replaceWith(feedback.$el);
    }
  },
  disable: function() {
    this.$('button').prop('disabled', true);
    noty({text: 'Disabled (Unclaimed HIT)', type: 'error', layout: 'bottomRight'});
  },
});

var SceneFeedbackView = TemplateView.extend({
  template: 'aircraft-scene-feedback.mu',
  postRender: function(ctx) {
    var self = this;
    setTimeout(function() {
      self.next();
    }, feedback_duration);
  },
  next: function() {
    // if there is another scene in the batch, show it, otherwise, debrief
    var next_scene = this.model.next();
    if (next_scene) {
      var view = new SceneView({model: next_scene});
      this.$el.replaceWith(view.$el);
    }
    else {
      var view = new BatchDebriefingView({model: this.model.collection.batch});
      this.$el.replaceWith(view.$el);
    }
  }
});

var BatchDebriefingView = TemplateView.extend({
  template: 'aircraft-batch-debriefing.mu',
  preRender: function(ctx) {
    _.extend(ctx, this.model.toJSON());
    ctx.bonus_available = ctx.bonus > 0;
  },
  events: {
    'click button': function(ev) {
      var choice = $(ev.target).attr('data-id');
      var bonus = this.model.get('bonus');
      if (bonus > 0) {
        $.post('/request-bonus', {amount: bonus, assignmentId: config.assignmentId}, 'json')
        .always(function(data, textStatus, jqXHR) {
          noty({text: data.message, type: 'information', layout: 'bottomRight', timeout: 5000});
        });
      }

      if (choice === 'stop') {
        var conclusion_view = new ConclusionView();
        this.$el.replaceWith(conclusion_view.$el);
      }
      else {
        this.next();
      }
    }
  },
  next: function() {
    var next_batch = this.model.next();
    if (next_batch) {
      var scene = next_batch.scenes.first();
      var scene_view = new SceneView({model: scene});
      this.$el.replaceWith(scene_view.$el);
    }
    else {
      var conclusion_view = new ConclusionView();
      this.$el.replaceWith(conclusion_view.$el);
    }
  }
});

var ConclusionView = TemplateView.extend({
  template: 'aircraft-conclusion.mu',
  preRender: function(ctx) {
    _.extend(ctx, {duration: now() - config.task_started}, config);
    console.log("conclusion", ctx);
  },
});

var ConsentView = TemplateView.extend({
  template: 'aircraft-consent.mu',
  events: {
    'click button': 'next'
  },
  next: function() {
    var batch_collection = new BatchCollection(raw_batches);
    var batch = batch_collection.first();
    window.batch_collection = batch_collection; // for debugging
    var scene = batch.scenes.first();

    var scene_view = new SceneView({model: scene});
    if (config.assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE') {
      scene_view.disable();
    }
    this.$el.replaceWith(scene_view.$el);
  }
});


$(function() {
  var consent_view = new ConsentView();
  $('#root').append(consent_view.$el);
  if (config.assignmentId == '' || config.assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE') {
    consent_view.next();
  }
});

</script>
