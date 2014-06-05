/*jslint node: true */
module.exports = function(grunt) {
  // these don't have .min options
  var scripts = [
    'underscore.js',
    'jquery.js',
    'angular.js',
    'angular-resource.js',
    'angular-ui-router.js',
    'ngStorage.js',
  ];
  var misc_scripts = [
    'cookies.js',
    'forms.js',
    'textarea.js',
    'url.js',
  ];
  var staticLibPrefix = function(path) { return 'static/lib/' + path; };
  var minExtension = function(path) { return path.replace(/.js$/, '.min.js'); };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      production: {
        options: {mangle: false},
        files: {
          'static/lib.min.js': scripts.map(staticLibPrefix).map(minExtension).concat(misc_scripts.map(staticLibPrefix)),
        }
      },
      development: {
        options: {mangle: false, beautify: true},
        files: {
          'static/lib.max.js': scripts.map(staticLibPrefix).concat(misc_scripts.map(staticLibPrefix)),
        }
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['uglify']);
};
