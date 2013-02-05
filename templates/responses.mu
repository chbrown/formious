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
var row_template = Hogan.compile($('#row_template').html(), {delimiters: '<% %>'});
var page_index = -1;

function more() {
  page_index++;
  console.log("loading page", page_index);
  $.get('/responses/' + page_index + '.json', function(responses) {
    console.log("got data", responses);
    var html = responses.map(function(response) {
      return row_template.render(response);
    }).join(' ');
    $('tbody').append(html);
  });
}

$('button').click(more).click();

</script>
