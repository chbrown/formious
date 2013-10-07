<section>
  <h3>Stim Template: {{stim._id}}</h3>
  <a href="/templates/stims/{{stim.name}}.bars">View</a> &middot;
  <a href="clone">Clone</a>
</section>

<form class="section fill vform" action="/admin/stims/{{stim._id}}" method="POST">
  <label><span>ID</span>
    <input name="_id" type="text" value="{{stim._id}}" style="width: 250px" />
  </label>

  <label><span>HTML</span>
    <textarea name="html" placeholder="HTML / Handlebars content" style="width: 100%" class="code">{{stim.html}}</textarea>
  </label>

  <button>Save</button>
</form>

<script src="/static/lib/textarea.js"></script>
<script>
var textarea = document.querySelector('textarea');
var textarea_enhanced = Textarea.enhance(textarea);
</script>
