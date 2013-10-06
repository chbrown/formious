'use strict'; /*jslint node: true, es5: true, indent: 2 */
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    handlebars: {
      all: {
        templates: 'templates/**/*.bars',
        root: 'templates',
        extension: 'bars',
        output: 'static/templates.js',
      }
    },
    uglify: {
      all: {
        options: {
          // beautify: true,
          mangle: false,
        },
        files: {
          'static/compiled.js': [
            'static/lib/json2.js',
            'static/lib/underscore.js',
            'static/lib/cookies.js',
            'static/lib/jquery.js',
            'static/lib/jquery-flags.js',
            'static/lib/jquery-noty.js',
            'static/lib/jquery-noty.theme.js',
            'static/lib/layouts/top.js', // the required one for noty
            'static/lib/layouts/bottomRight.js',
            'static/lib/backbone.js',
            'static/lib/handlebars.js',
            'static/lib/templating.js',
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['handlebars', 'uglify']);
};
