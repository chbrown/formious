{{#account}}
<h3 class="section">AWS Account: {{name}}</h3>

<section class="box">
  <table>
    <tr><td>ID</td><td>{{_id}}</td></tr>
    <tr><td>Name</td><td>{{name}}</td></tr>
    <tr><td>Access Key ID</td><td>{{accessKeyId}}</td></tr>
    <tr><td>Secret Access Key</td><td>{{secretAccessKey}}</td></tr>
    <tr><td>Created</td><td>{{created}}</td></tr>
  </table>
</section>

<section>
  <a href="/admin/aws/{{_id}}/edit">Edit account</a>
</section>
{{/account}}

<h3 class="section">Mechanical Turk Hosts</h3>
<section class="box">
  <table id="hosts">
    <thead>
      <tr>
        <th>Host</th>
        <th>Available Balance</th>
        <th></th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {{#hosts}}
        <tr>
          <td>{{.}}</td>
          <td></td>
          <td><a href="/admin/aws/{{account.name}}/hosts/{{.}}/HITs">View HITs</a></td>
          <td><a href="/admin/aws/{{account.name}}/hosts/{{.}}/HITs/new">Create new HIT</a></td>
        </tr>
      {{/hosts}}
    </tbody>
  </table>
</section>

<script>
$('#hosts tbody tr').each(function(i, el) {
  var $tr = $(el);
  var host = $tr.children('td:nth-child(1)').text();
  $.post('/admin/aws/{{account.name}}/hosts/' + host + '/GetAccountBalance', function(data, textStatus, jqXHR) {
    var price = data.GetAccountBalanceResult.AvailableBalance.FormattedPrice;
    $tr.children('td:nth-child(2)').text(price);
  });
});
</script>
