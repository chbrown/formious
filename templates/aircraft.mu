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

<div id="scene"></div>
<div id="stage" style="display: none">
  <img src="" />
</div>

<script type="text/mustache" id="consent_template">
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

<script type="text/mustache" id="scene_template">
  <h3>Scene <%id%></h3>
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
          <button data-id="friend">Friend</button>
          <button data-id="enemy">Enemy</button>
        </div>
      </td>
    </tr>
  </table>
</script>

<script type="text/mustache" id="conclusion_template">
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

<script>
var task_started = {{task_started}};

var config = {
  assignmentId: "{{assignmentId}}",
  workerId: "{{workerId}}",
  host: "{{host}}",
  hitId: "{{hitId}}",
};

var feedback = { true: { img: '/static/smile.gif', text: '☺' }, false: { img: '/static/smile.gif', text: "☹" } };
var feedback_duration = 2000;
var scene_index = -1;

var b = '/static/lib/js/';
head.js(b+'jquery.js', b+'backbone_pkg.js', b+'hogan.js', b+'jquery.flags.js', '/static/local.js', function() {
  var scene_template = hoganTemplate('#scene_template');
  var conclusion_template = hoganTemplate('#conclusion_template');
  var consent_template = hoganTemplate('#consent_template');

  var Scene = Backbone.Model.extend({
    next: function() {
      return this.collection.get(this.id + 1);
    },
    prepare: function() {
      $('#stage img').attr('src', '/static/aircraft/pixelated/' + this.get('src'));
    },
    feedback: function(choice) {
      var self = this;
      var correct = choice == this.get('gold');
      $('#scene').html('<div class="emoticon"><img src="' + feedback[correct].img + '" alt="' + feedback[correct].text + '" /></div>');

      setTimeout(function() {
        self.next().show()
      }, feedback_duration);

      var response = {
        workerId: config.workerId,
        task_started: task_started,
        prior: config.prior,
        scene_index: this.id,
        reliabilities: _.map(this.get('allies'), function(ally) { return ally.reliability.toFixed(4); }),
        judgments: _.pluck(this.get('allies'), 'judgment'),
        gold: this.get('gold'),
        choice: choice,
        correct: correct,
        image_id: this.get('image_id'),
        width: this.get('width'),
        time: now() - scene_shown
      };

      $.ajax({
        url: '/save',
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify(response)
        // success: function(data, textStatus) {}
      });
    },
    show: function() {
      var self = this;
      var scene_html = scene_template.render(this.toJSON());
      $('#scene').html(scene_html);

      // never shrink!
      var scene_size = $('#scene').measureBox();
      // console.log(scene_size);
      $('#scene').css('min-height', scene_size.height);

      scene_shown = now();
      $('button').click(function() {
        var choice = $(this).attr('data-id');
        self.feedback(choice);
      });

      // prep the next image for instant loading
      if (self.next()) self.next().prepare();
    }
  });
  var SceneCollection = Backbone.Collection.extend({model: Scene});

  var scenes = new SceneCollection({{{JSON.stringify(scenes)}}});
  window.scenes = scenes;

  function showConclusion() {
    var ctx = _.extend({duration: now() - task_started}, config);
    $('#scene').html(conclusion_template.render(ctx));
  }

  function showConsent() {
    $('#scene').html(consent_template.render({}));
    $('button').click(function() {
      scenes.first().show();
    });
  }

  $(function() {
    if (config.assignmentId == '' || config.assignmentId == "ASSIGNMENT_ID_NOT_AVAILABLE") {
      scenes.first().show();
    }
    else {
      showConsent();
      scenes.first().prepare();
    }
  });
});

</script>
