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

<p>You will see {{scenes.length}} images in total. You must advance through one at a time.

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
  <h3>Scene <%index%></h3>
  <table>
    <tr>
      <td><img src="/static/aircraft/pixelated/<%src%>" id="sight" /></td>
      <td style="padding-left: 20px">
        <table class="stats">
          <tr><td>Estimated number of friendly aircraft in the sky:</td><td>{{total_friendly}}</td></tr>
          <tr><td>Estimated number of enemy aircraft in the sky:</td><td>{{total_enemy}}</td></tr>
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
  <form method="POST" action="{{host}}/mturk/externalSubmit">
    <input type="hidden" name="assignmentId" value="{{assignmentId}}" />
    <input type="hidden" name="turkerId" value="{{workerId}}" />
    <input type="hidden" name="originalHitId" value="{{hitId}}" />
    <input type="hidden" name="duration" value="<% duration %>" />

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
function measureBox(selector) {
  var $el = $(selector);
  return {
    width: $el.width() +
      parseInt($el.css('border-left-width'), 10) +
      parseInt($el.css('border-right-width'), 10) +
      parseInt($el.css('padding-left'), 10) +
      parseInt($el.css('padding-right'), 10),
    height: $el.height() +
      parseInt($el.css('border-top-width'), 10) +
      parseInt($el.css('border-bottom-width'), 10) +
      parseInt($el.css('padding-top'), 10) +
      parseInt($el.css('padding-bottom'), 10)
  };
};

function now() { return (new Date()).getTime(); }

var scenes = {{{JSON.stringify(scenes)}}};
var task_started = {{task_started}};
var assignmentId = "{{assignmentId}}";
var scene_template = Hogan.compile($('#scene_template').html(), {delimiters: '<% %>'});
var conclusion_template = Hogan.compile($('#conclusion_template').html(), {delimiters: '<% %>'});
var consent_template = Hogan.compile($('#consent_template').html(), {delimiters: '<% %>'});

var feedback_duration = 2000;
var scene_shown = -1;

function showFeedback(choice, scene_index) {
  var scene = scenes[scene_index];
  var correct = choice == scene.gold;

  $('#scene').html('<div class="emoticon">' +
    '<img src="/static/' + (correct ? "smile" : "frown") + '.gif" alt="' + (correct ? "☺" : "☹") + '" /></div>');

  setTimeout(function() {
    showScene(scene_index + 1);
  }, feedback_duration);

  var response = {
    workerId: "{{workerId}}",
    task_started: task_started,
    prior: {{prior}},
    scene_index: scene.index,
    reliabilities: _.map(scene.allies, function(ally) { return ally.reliability.toFixed(4); }),
    judgments: _.pluck(scene.allies, 'judgment'),
    gold: scene.gold,
    image_id: scene.image_id,
    width: scene.width,
    correct: correct,
    time: now() - scene_shown
  };

  $.ajax({
    url: '/save',
    type: 'POST',
    dataType: 'json',
    data: JSON.stringify(response),
    success: function(data, textStatus) {
      // response saved; any feedback?
    }
  });
}

function prepareScene(scene_index) {
  var scene = scenes[scene_index];
  $('#stage img').attr('src', scene ? '/static/aircraft/pixelated/' + scene.src : '');
}

function showScene(scene_index) {
  var scene = scenes[scene_index];
  if (scene) {
    var scene_html = scene_template.render(scene);
    $('#scene').html(scene_html);
    var scene_size = measureBox('#scene');
    $('#scene').css('min-height', scene_size.height);

    scene_shown = now();
    $('button').click(function() {
      showFeedback($(this).attr('data-id'), scene_index);
    });

    // prep the next image for instant loading
    prepareScene(scene_index + 1);
  }
  else {
    showConclusion();
  }
}

function showConclusion() {
  var conclusion_html = conclusion_template.render({duration: now() - task_started});
  $('#scene').html(conclusion_html);
}

function showConsent() {
  var consent_html = consent_template.render({});
  $('#scene').html(consent_html);
  $('button').click(function() {
    showScene(0);
  });
}

$(function() {
  if (assignmentId == '' || assignmentId == "ASSIGNMENT_ID_NOT_AVAILABLE") {
    showScene(0);
  }
  else {
    showConsent();
    prepareScene(0);
  }
  // var assignmentId = $('[name=assignmentId]').val();
  // var workerId = $('[name=turkerId]').val();
  // if (assignmentId === "ASSIGNMENT_ID_NOT_AVAILABLE") {
  //   if (workerId) {
  //     // can inform the user, on the preview, that they can only do this a few more times.
  //   }
  // }
  // else if (workerId) {
  //   // mark things as seen after 5 seconds
  //   setTimeout(function() {
  //     // var questionIds = $('fieldset[id]').map(function(i, el) { return el.id; }).toArray();
  //     // $.post('/seen', {workerId: workerId, questionIds: questionIds}, function(result) {});
  //   }, 5000);
  // }
});

</script>
