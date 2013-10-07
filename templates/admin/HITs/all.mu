<h3 class="section">HITs</h3>

<div id="hits"></div>

<script>
var hits = new HITCollection({{{JSON.stringify(hits)}}});
hits.renderTo($('#hits'), HITView);
</script>
