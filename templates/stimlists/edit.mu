<h3>Stimlist: {{stimlist._id}}</h3>
<div class="hform">
  <label><span>Slug</span>
    <input name="slug" type="text" value="{{stimlist.slug}}" />
    <a href="/stimlists/{{stimlist.slug}}">{{stimlist.slug}}</a>
  </label>
  <label><span>Creator</span>
    <input name="creator" type="text" value="{{stimlist.creator}}" />
  </label>
  <button>Save</button>
</div>

<label><span>Paste states</span>
  <textarea placeholder="Paste csv here" id="paste" rows="1">
  </textarea>
</label>
<label><span>Upload states</span>
  <input type="file" id="upload">
</label>

<hr />

<div id="statestable">
</div>

<script>
// var stimlist = {{{JSON.stringify(stimlist)}}};
function mapKeys(object, keys) {
  return keys.map(function(key) { return object[key]; });
}
function tabulate(objects) {
  var cols = _.keys(objects[0]);
  var rows = objects.map(function(object) { return mapKeys(object, cols); });
  return makeTable(cols, rows);
}
function readText(raw, target) {
  console.log(raw.replace(/\n/g, '\\n'));
  // outsource the processing, for now.
  $.ajax({
    url: '/sv',
    method: 'POST',
    data: raw,
    dataType: 'json',
  }).done(function(data, type, jqXHR) {
    console.log('done', data, type);
    // var lines = result;
    var html = tabulate(data);
    $('#statestable').html(html);
    var message = 'Processed csv into ' + data.length + ' rows.';
    if (target) {
      $(target).flag({html: message, fade: 3000});
    }
  });
}
$('#upload').on('change', function(ev) {
  var files = ev.target.files;
  for (var i = 0, l = files.length; i < l; i++) {
    var file = files[i];
    var reader = new FileReader();
    reader.onload = function(progress_event) {
      readText(progress_event.target.result, ev.target);
    };
    reader.readAsText(file); // , opt_encoding
    // console.log(ev, ev.target, files[i]);
    $(ev.target).flag({html: 'Uploading ' + file.name + ' (' + file.size + ' bytes)', fade: 2000});
  }
});
$('#paste').on('change', function(ev) {
  readText(ev.target.value, ev.target);
});
</script>

