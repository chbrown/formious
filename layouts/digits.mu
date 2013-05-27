<style>
.input {
  text-align: center;
}
.emoticon {
  text-align: center;
  font-size: 20em;
}

.allies {
  visibility: hidden;
}
.allies td {
  padding: 4px;
}
.allies span {
  font-weight: bold;
}

.user-judgment {
  text-align: center;
}
.user-judgment input {
  text-align: center;
  width: 50px;
}
</style>

<h4><i>Scenario:</i></h4>
<p>Your task is to disarm a bomb, but to do so, you must read the deactivation code from a broken digital display.
Your colleagues on the bomb squad are disarming bombs in nearby locations, but <i>all the bombs have the same code</i>.
The displays that each of your colleagues see may be more or less broken than the one you have access to.
<p>These are trying times. You will have to disarm more than one bomb.
Luckily, you and your allies are operating remotely; while lives depend on your diligence, yours does not,
and you will receive feedback on whether your guess was correct.

<hr />

<div class="container">
  <div id="root"></div>
</div>

<script src="/static/compiled.js"></script>

<!-- <script>DEBUG=true</script> -->
<script src="/static/templates.js"></script>

<script src="/static/local.js"></script>
<script src="http://chbrown.github.io/clock-js/clock.js"></script>
<script>
var assignmentId = "{{assignmentId}}";
var config = {
  task_started: {{task_started}},
  host: '{{host}}',
  batches_per_HIT: {{batches_per_HIT}},
  scenes_per_batch: {{scenes_per_batch}},
  allies_per_scene: {{allies_per_scene}},
  feedback_duration: {{feedback_duration}},
  workerId: '{{workerId}}',
  version: 'digits_v1'
};

var Scene = Backbone.Model.extend({
  // allies: Array[5], truth: "enemy", id: 1, image_id: 35, src: "enemy-35-050.jpg", width: 50
  saveResponse: function(choice) {
    var scene = _.omit(this.toJSON(), 'allies', 'id');
    var allies = this.get('allies');
    var attrs = _.extend(scene, config, {
      scene_id: this.id,
      choice: choice,
      reliabilities: _.map(allies, function(ally) { return ally.reliability.toFixed(4); }),
      judgments: _.pluck(allies, 'judgment'),
      time: now() - this.get('shown'),
    });
    var response = new Response(attrs);
    // console.log('response', response.isNew());
    response.save();
  },
  next: function() {
    return this.collection.get(this.id + 1);
  }
});
var SceneCollection = Backbone.Collection.extend({
  model: Scene,
});

var Batch = Backbone.Model.extend({
  // prior: 0.5, scenes: Array[50], total_enemy: 25, total_friendly: 25
  initialize: function(opts) {
    var batch_id = this.id;
    // type raise .scenes
    var scenes = new SceneCollection(this.get('scenes'));
    scenes.each(function(scene) { scene.set('batch_id', batch_id); });
    this.set('scenes', scenes);
  },
  next: function() {
    return this.collection.get(this.id + 1);
  }
  // toJSON: function() {
  //   return _.extend({batch_id: this.id}, this.attributes);
  // }
});
var BatchCollection = Backbone.Collection.extend({model: Batch});
var batches = new BatchCollection({{{JSON.stringify(batches)}}});

var BatchView = TemplateView.extend({
  template: 'digits-batch.mu',
  // className: 'auto-hmargin',
  postRender: function(ctx) {
    var $digits = this.$('#digits');
    this.scene_views = this.model.get('scenes').map(function(scene) {
      var scene_view = new SceneView({model: scene});
      $digits.append(scene_view.el);
      return scene_view;
    });
    var first_scene_view = this.scene_views[0];
    setTimeout(function() {
      console.log(first_scene_view.$('input').length);
      first_scene_view.$('input').focus();
    }, 100);
    // purely aesthetic. never shrink!
    setTimeout(function() {
      var scene_size = $('.container').measureBox();
      $('.container').css('min-height', scene_size.height);
    }, 200);
  },
  events: {
    'click button': function(ev) {
      var self = this;
      // var choice = ev.target.value;
      var correct = true;
      this.scene_views.map(function(scene_view) {
        var scene = scene_view.model;
        var choice = scene_view.$('input').val();
        scene_view.model.saveResponse(choice);
        // we want fuzzy equivalence here, since choice is a string and truth is a number
        correct = correct && (scene.get('truth') == choice);
        console.log(scene.get('truth'), choice, correct);
      });
      new BatchFeedbackView({correct: correct, model: this.model, replace: this.$el});
    },
    'keyup input': function(ev) {
      var missing = this.$('input').filter(function (){return this.value == ''}).length;
      if (missing == 0) {
        this.$('button').text('Submit').prop('disabled', false);
        // catch enter
        if (ev.which == 13) {
          this.$('button').click();
        }
      }
      else {
        this.$('button').text(missing + ' left').prop('disabled', true);
      }
    }
  },
  disable: function() {
    noty({text: 'Disabled (Unclaimed HIT)', type: 'error', layout: 'bottomRight'});
  },
});

var SceneView = TemplateView.extend({
  tagName: 'td',
  template: 'digits-scene.mu',
  preRender: function(ctx) {
    this.model.set('shown', now());
  },
  postRender: function(ctx) {
    var scene = this.model;
    this.$('.image').digit(scene.get('degraded_segments'),
      {hmargin: 20, width: 110, height: 145, background: 'brown', foreground: 'orange', noise: 32});
  },
  events: {
    'focus input': function(ev) {
      this.$('.allies').css('visibility', 'visible');
    },
    'blur input': function(ev) {
      if (isNaN(ev.target.value)) {
        var message = '"' + ev.target.value + '" is not a number';
        noty({text: message, type: 'warning', layout: 'bottomRight', timeout: 2000});
      }
      this.$('.allies').css('visibility', 'hidden');
    }
  }
});

var BatchFeedbackView = TemplateView.extend({
  template: 'feedback.mu',
  postRender: function(ctx) {
    var self = this;
    setTimeout(function() {
      self.next();
    }, config.feedback_duration);
  },
  next: function() {
    // if there is another scene in the batch, show it, otherwise, debrief
    var next_batch = this.model.next();
    if (next_batch) {
      new BatchView({model: next_batch, replace: this.$el});
    }
    else {
      new ConclusionView({model: this.model, replace: this.$el});
    }
  }
});

var ConclusionView = TemplateView.extend({
  template: 'digits-conclusion.mu',
  preRender: function(ctx) {
    console.log ("ConclusionView", this.model, ctx);
    var allies = this.model.get('scenes').first().get('allies');
    var ally_names = allies.map(function(ally, i) {
      var connector = (i + 1) == allies.length ? 'and ' : '';
      return connector + ally.title + ' ' + ally.name;
    });
    _.extend(ctx, config, {
      duration: now() - config.task_started,
      all_allies_string: ally_names.join(', ')
    });
  },
});

var ConsentView = TemplateView.extend({
  template: 'consent.mu',
  events: {
    'click button': 'next'
  },
  next: function() {
    var batch = batches.first();
    var batch_view = new BatchView({model: batch, replace: this.$el});
    if (assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE') {
      batch_view.disable();
    }
  }
});


$(function() {
  var consent_view = new ConsentView({replace: $('#root')});
  if (assignmentId == '' || assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE') {
    consent_view.next();
  }
});

</script>
