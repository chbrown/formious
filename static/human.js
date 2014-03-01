/*jslint browser: true */ /*globals _, $ */
// This file will be included in every stim along with the user defined template

var human = {
  started: new Date(),
  addResponse: function(response) {
    var jqXHR = $.ajax({
      method: 'POST',
      url: window.location,
      contentType: 'application/json',
      data: JSON.stringify(response),
    }).then(function() {
      console.log('addResponse success', jqXHR);
    }, function() {
      console.log('addResponse failure', jqXHR);
    });
  }
};
