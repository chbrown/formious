<div class="admin review">
  <div id="hits"></div>
</div>

<script src="/static/compiled.js"></script>
<script src="/static/templates.js"></script>
<script>
var hits = new HITCollection({{{JSON.stringify(hits)}}});
hits.renderTo($('#hits'), HITView);
</script>

