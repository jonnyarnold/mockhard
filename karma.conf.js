module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    browsers: ['PhantomJS'],
    reporters: ['dots'],

    files: [
      'mockhard.js',
      'mockhard.spec.js',
      'example.js'
    ],

    autoWatch: true
  });
};
