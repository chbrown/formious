/*jslint node: true */
module.exports = function(grunt) {
  // these don't have .min options
  var misc_js = [
    // 'static/lib/angular-plugins.js', // include manually due to frequent changes
    'static/lib/cookies.js',
    'static/lib/forms.js',
    'static/lib/textarea.js',
    'static/lib/url.js',
  ];
  var static_max = [
    'static/lib/underscore.js',
    'static/lib/jquery.js',
    'static/lib/angular.js',
    'static/lib/angular-resource.js',
    'static/lib/angular-ui-router.js',
    'static/lib/ngStorage.js',
    // from misc-js
  ];
  var static_min = static_max.map(function(filepath) {
    return filepath.replace(/.js$/, '.min.js');
  });
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      production: {
        options: {
          mangle: false,
          // compress: true,
        },
        files: {
          'static/lib.min.js': static_min.concat(misc_js),
        }
      },
      development: {
        options: {
          mangle: false,
          beautify: true,
        },
        files: {
          'static/lib.max.js': static_max.concat(misc_js),
        }
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['uglify']);
};
