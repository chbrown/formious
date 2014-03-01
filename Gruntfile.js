/*jslint node: true */
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // handlebars: {
    //   all: {
    //     templates: 'templates/**/*.bars',
    //     root: 'templates',
    //     extension: 'bars',
    //     output: 'static/templates.js',
    //   }
    // },
    uglify: {
      all: {
        options: {
          // beautify: true,
          mangle: false,
        },
        files: {
          'static/compiled.js': [
            'static/lib/underscore.min.js',
            'static/lib/jquery.min.js',
            'static/lib/angular.min.js',
            'static/lib/ngStorage.min.js',
            // from misc-js
            'static/lib/cookies.js',
            'static/lib/forms.js',
            'static/lib/textarea.js',
            'static/lib/url.js',
            // 'static/lib/jquery-flags.js',
            // 'static/lib/jquery-noty.js',
            // 'static/lib/jquery-noty.theme.js',
            // 'static/lib/layouts/top.js', // the required one for noty
            // 'static/lib/layouts/bottomRight.js',
            // 'static/lib/backbone.js',
            // 'static/lib/handlebars.js',
            // 'static/lib/templating.js',
          ]
        }
      }
    }
  });

  // grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', [
    // 'handlebars',
    'uglify',
  ]);
};
