'use strict'; /*jslint nomen: true, node: true, indent: 2, debug: true, vars: true, es5: true */
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

  grunt.registerTask('update_submodules', function() {
    var done = this.async();
    var update_args = ['submodule', 'update', '--init', '--recursive', '--merge'];
    var pull_args = ['submodule', 'foreach', 'git', 'pull'];
    grunt.util.spawn({cmd: 'git', args: update_args}, function (error1, result, code) {
      grunt.util.spawn({cmd: 'git', args: pull_args}, function (error2, result, code) {
        if (error1 || error2)
          done(error1 || error2);
        else
          done();
      });
    });
  });

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    handlebars: {
      all: {
        src: 'templates',
        ext: 'mu',
        dest: 'static/templates.js'
      }
    },
    uglify: {
      all: {
        options: {
          mangle: false
        },
        files: {
          'static/compiled.js': [
            'static/lib/js/json2.js',
            'static/lib/js/underscore.js',
            'static/lib/js/jquery.js',
            'static/lib/js/backbone.js',
            'static/lib/js/jquery.flags.js',
            'static/lib/js/handlebars.js',
            'static/lib/js/jquery.noty.js',
            'static/lib/js/jquery.noty-layouts.js',
            'static/lib/js/jquery.noty-default-theme.js',
            'static/templates.js',
            'static/local.js',
          ]
        }
      }
    }
  });

  // grunt.loadNpmTasks('grunt-handlebars');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Load the plugin that provides the 'uglify' task.
  grunt.registerTask('default', ['handlebars', 'uglify', 'update_submodules']);
};
