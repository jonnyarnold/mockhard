module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    browsers: ['PhantomJS'],
    reporters: ['dots'],

    files: [
      'glue.js',
      'glue.spec.js',
      'example.js'
    ],

    autoWatch: true
  });
};
