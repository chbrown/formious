var child_process = require('child_process');

module.exports = function(grunt) {

  grunt.registerMultiTask('handlebars', 'Precompile Handlebars template', function() {
    var done = this.async();
    var glob = this.data.src + '/*.' + (this.data.ext || 'handlebars');
    var bin = __dirname + '/node_modules/.bin/handlebars';
    var cmd = bin + ' -m ' + glob + ' -f ' + this.data.dest;
    child_process.exec(cmd, function(err, stdout, stderr) {
      if (err) grunt.fail.fatal(stderr);
      done();
    });
  });

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    handlebars: {
      all: {
        src: 'templates',
        ext: 'mu',
        dest: 'templates/compiled.js'
      }
    },
    uglify: {
      all: {
        options: {
          mangle: false
        },
        files: {
          'static/lib.js': [
            'static/lib/js/json2.js',
            'static/lib/js/underscore.js',
            'static/lib/js/jquery.js',
            'static/lib/js/backbone.js',
            'static/lib/js/jquery.flags.js',
            'static/lib/js/handlebars.js'
          ]
        }
      }
    }
  });


  // grunt.loadNpmTasks('grunt-handlebars');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Load the plugin that provides the "uglify" task.
  grunt.registerTask('default', ['handlebars', 'uglify']);
};
