{{#account}}
  <h3>AWS Account: {{_id}}</h3>
  <form method="POST" action="/admin/aws/{{_id}}" class="vform">
    <label><span>Name</span>
      <input name="name" type="text" value="{{name}}" />
    </label>

    <label><span>Access Key ID</span>
      <input name="accessKeyId" type="text" value="{{accessKeyId}}" />
    </label>

    <label><span>Secret Access Key</span>
      <input name="secretAccessKey" type="text" value="{{secretAccessKey}}" />
    </label>

    <button>Save</button>
  </form>
{{/account}}
