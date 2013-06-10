{{#account}}
<table>
  <tr class="left"><th>Account</th><th>{{_id}}</th></tr>
  <tr><td>Access Key ID</td><td>{{accessKeyId}}</td></tr>
  <tr><td>Secret Access Key</td><td>{{secretAccessKey}}</td></tr>
  <tr><td>Created</td><td>{{created}}</td></tr>
</table>
{{/account}}

<table id="hosts">
  <thead>
    <tr>
      <th class="left">Host</th>
      <th>Available Balance</th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {{#hosts}}
      <tr>
        <td>{{.}}</td>
        <td class="right"></td>
        <td><a href="/admin/mt/{{account._id}}/{{.}}/HITs">View HITs</a></td>
        <td><a href="/admin/mt/{{account._id}}/{{.}}/HITs/new">Create new HIT</a></td>
      </tr>
    {{/hosts}}
  </tbody>
</table>

<script>
$('#hosts tbody tr').each(function(i, el) {
  var $tr = $(el);
  var host = $tr.children('td:nth-child(1)').text();
  $.post('/admin/mt/{{account._id}}/' + host + '/GetAccountBalance', function(data, textStatus, jqXHR) {
    var price = data.GetAccountBalanceResult.AvailableBalance.FormattedPrice;
    $tr.children('td:nth-child(2)').text(price);
  });
});
</script>
