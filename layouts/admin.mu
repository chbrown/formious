<h2>Accounts</h2>

<ul>
{{#accounts}}
  <li><a href="/accounts/{{id}}/{{aws_host.id}}">{{id}}</a> ({{accessKeyId}})
{{/}}
</ul>

<h2>Hosts</h2>

<ul>
{{#aws_hosts}}
  <li><a href="/accounts/{{account.id}}/{{id}}">{{id}}</a> ({{url}})
{{/}}
</ul>

<h3>Available Funds</h3>

{{available_price.FormattedPrice}}

<h3>HITs</h3>

<ul>
  {{#hits}}

  {{/}}
</ul>

