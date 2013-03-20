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
<p>You will see a number of different scenes. You must advance through one at a time.

<hr />

<div id="batch_display"></div>

<script type="text/mustache" id="template-consent">
  <h3>Consent form</h3>
  <p>
    You are invited to participate in a study, entitled "Learning in Social Networks". The study is being conducted by Colin Bannard in the Linguistics department of The University of Texas at Austin.
  <p>
    Department of Linguistics<br/>
    University of Texas at Austin,<br/>
    305 E. 23rd Street B5100,<br/>
    Austin, TX 78712, USA<br/>
    (512) 471-9022
  <p>The purpose of this study is to examine how people learn. We estimate that it will take about half a minute of your time to complete each question, and you will be paid 2 cents for each question you respond to. You are free to contact the investigator at the above address and phone number to discuss the survey.
  <p>Risks to participants are considered minimal. There will be no costs for participating. You will be paid for each HIT you complete, but will not otherwise benefit from participating. Your Amazon Mechanical Turk identification will be kept while we collect data for tracking purposes only. A limited number of research team members will have access to the data during data collection. This information will be stripped from the final dataset.
  <p>Your participation in this survey is voluntary. You may decline to answer any question and you have the right to withdraw from participation at any time without penalty. If you wish to withdraw from the study or have any questions, contact the investigator listed above.
  <p>If you have any questions, please email Colin Bannard at bannard@utexas.edu. You may also request a hard copy of the survey from the contact information above.
  <p>This study has been reviewed and approved by The University of Texas at Austin Institutional Review Board (IRB Study Number 2010-10-0051). If you have questions about your rights as a study participant, or are dissatisfied at any time with any aspect of this study, you may contact - anonymously, if you wish - the Institutional Review Board by phone at (512) 471-8871 or email at orsc@uts.cc.utexas.edu.
  <p>
  <button>I Consent</button>
</script>

<script type="text/mustache" id="template-batch">
  <div id="batch_root"></div>
</script>

<script type="text/mustache" id="template-scene">
  <h3>Batch <%batch_id%> / Scene <%id%></h3>
  <table>
    <tr>
      <td><img src="/static/aircraft/pixelated/<%src%>" id="sight" /></td>
      <td style="padding-left: 20px">
        <table class="stats">
          <tr><td>Estimated number of friendly aircraft in the sky:</td><td><%total_friendly%></td></tr>
          <tr><td>Estimated number of enemy aircraft in the sky:</td><td><%total_enemy%></td></tr>
        </table>

        <h3>Allies:</h3>
        <table class="allies">
          <%#allies%>
          <tr>
            <td><%title%>&nbsp;<%name%>:</td>
            <td><span class="judgment <%judgment%>"><%judgment%></span></td>
          </tr>
          <%/allies%>
        </table>

        <h3>Your decision:</h3>
        <div>
          <button>Friend</button>
          <button>Enemy</button>
        </div>
      </td>
    </tr>
  </table>
  <div style="display: none">
   <%#next%>
      <img src="/static/aircraft/pixelated/<%src%>" />
   <%/next%>
  </div>
</script>

<script type="text/mustache" id="template-conclusion">
  <form method="POST" action="<%host%>/mturk/externalSubmit">
    <input type="hidden" name="assignmentId" value="<%assignmentId%>" />
    <input type="hidden" name="turkerId" value="<%workerId%>" />
    <input type="hidden" name="originalHitId" value="<%hitId%>" />
    <input type="hidden" name="duration" value="<%duration%>" />

    <h3>Debriefing</h3>
    <p>Was this task unclear, mispriced, or frustrating? If we could make it better, let us know!</p>

    <h4>Comments</h4>
    <textarea rows="4" cols="80" name="comments"></textarea>

    <div class="clear" style="padding: 10px">
      <input type="submit" value="Submit Responses" />
    </div>
  </form>
</script>

<script type="text/mustache" id="template-feedback">
  <div class="emoticon">
    <%#correct%>
      <img src="/static/smile.gif" alt="☺" />
    <%/correct%>
    <%^correct%>
      <img src="/static/frown.gif" alt="☹" />
    <%/correct%>
  </div>
</script>

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

var b = '/static/lib/js/';
head.js(b+'jquery.js', b+'backbone_pkg.js', b+'hogan.js', b+'jquery.flags.js', '/static/local.js', function() {
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

      console.log(ctx)

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
});

</script>
<!--
  A batch shows scenes, so we start with the batch.
  When a batch starts, it's given a batchmodel, which contains a collection of scenes
  A scene must attach inside a batch


-->
