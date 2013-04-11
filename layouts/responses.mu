<style>
  body {
    font-size: 11px;
  }
  button {
    font-size: 90%;
    text-transform: capitalize;
  }
</style>

<h3>Responses</h3>

<script type="text/mustache" id="row_template">
<tr>
  <td><% workerId %></td>
  <td><% prior %></td>
  <td><% scene_index %></td>
  <td><% gold %></td>
  <td><% image_id %></td>
  <td><% width %></td>
  <td><% reliabilities %></td>
  <td><% judgments %></td>
  <td><% correct %></td>
  <td><% time %></td>
  <td><% submitted %></td>
</tr>
</script>

<table>
  <thead>
    <tr>
      <th>Worker</th>
      <th>Prior</th>
      <th>Trial</th>
      <th>Gold</th>
      <th>Image</th>
      <th>Pixelation</th>
      <th>Reliabilities</th>
      <th>Judgments</th>
      <th>Correct</th>
      <th>Time (ms)</th>
      <th>Date Submitted</th>
    </tr>
  </thead>
  <tbody>
  </tbody>
</table>

<button>More</button>

<script>
var b = '/static/lib/js/';
head.js(b+'jquery.js', b+'backbone_pkg.js', b+'hogan.js', b+'jquery-flags.js', '/static/local.js', function() {
  var scene_template = ('#scene_template');

  var row_template = hoganTemplate('#row_template');
  var page_index = -1;

  function more() {
    page_index++;
    $.get('/responses/' + page_index + '.json', function(responses) {
      var html = responses.map(function(response) {
        return row_template.render(response);
      }).join(' ');
      $('tbody').append(html);
    });
  }

  $('button').click(more);

  more();
});
</script>
