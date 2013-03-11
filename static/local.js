function now() { return (new Date()).getTime(); }
function hoganTemplate(self) { return Hogan.compile($(self).html(), {delimiters: '<% %>'}); }
