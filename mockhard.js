var Mockhard = (function() {

  // Object that is returned by this method
  // (and assigned to `var Mockhard`.)
  var _Mockhard = {};

  // Performs a stricter comparison of objects,
  // including an array element equality comparison.
  function reallyEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }

    return true;
  }

  // Converts args to an array.
  // Useful for functions that use the `arguments` variable.
  function arrayify(args) {
    return Array.prototype.slice.call(args);
  }

  // Returns the name of a function.
  // In ES6 we would use fun.name;
  // I look forward to this joyous day.
  //
  // Taken from
  // http://stackoverflow.com/questions/2648293/javascript-get-function-name
  function nameOf(fun) {
    var ret = fun.toString();
    ret = ret.substr('function '.length);
    ret = ret.substr(0, ret.indexOf('('));
    return ret;
  }

  // Converts a method signature into a string.
  function methodSignature(methodName, args, returnValue) {
    var signature = methodName + '(' + args.toString() + ')';
    if(returnValue) {
      signature += ' => ' + returnValue.toString();
    }

    return signature;
  };



  // An overridden function definition
  function Mock(methodName) {

    // A mock is a function.
    // It finds a valid argument list
    // and returns the matching value.
    var mock = function() {
      var args = arrayify(arguments);
      for(var b = 0; b < mock.behaviours.length; b++) {
        var behaviour = mock.behaviours[b];

        if (reallyEqual(behaviour.args, args)) {
          behaviour.usedByFake = true;
          return behaviour.returnValue;
        }
      }

      // Uh oh.
      var mockedCalls = [];
      for(var name in mock.behaviours) {
        var b = mock.behaviours[name];
        mockedCalls.push(methodSignature(methodName, b.args, b.returnValue));
      }
      mockedCalls = mockedCalls.join('\n');

      throw 'Unmocked call: no behaviour mapped for ' + methodSignature(methodName, args) + '\n' +
        'Mocked calls:\n' + mockedCalls;
    };

    // A behaviour links an array of args
    // to a value.
    mock.behaviours = [];
    mock.map = function(args, returnValue) {
      mock.behaviours.push({
        args: args,
        returnValue: returnValue,
        usedByFake: false,
        usedByReal: false
      });
      return mock;
    };

    mock.verify = function() {
      for(var i = 0; i < mock.behaviours.length; i++) {
        var behaviour = mock.behaviours[i];

        if(behaviour.usedByFake && !behaviour.usedByReal) {
          throw 'Fake call ' + methodSignature(methodName, behaviour.args, behaviour.returnValue) +
            ' was not called on the real object.';
        }
      }
    };

    return mock;
  }

  // An object that can be mocked.
  function Fake(name) {

    var fake = {
      // The real object that mocks, etc. will be compared against.
      // Set with real().
      real: undefined,

      // Collects calls to the real object.
      realCalls: [],

      // We keep a list of mocks so we can iterate over them;
      // they are also set on the object directly (so we can use them!)
      mocks: {}
    };

    // Set a mock.
    fake.mock = function(methodName) {
      if(fake.mocks[methodName] === undefined) {
        fake.mocks[methodName] = Mock(methodName);
        fake[methodName] = fake.mocks[methodName];
      }

      return fake.mocks[methodName];
    };

    fake.verify = function() {
      if(fake.real === undefined) {
        throw 'No real object defined for fake ' + name + '\n' +
          'Call real(\'' + name + '\', obj) with a real object to test against.';
      }

      // Set the usedByReal flag
      for(var i = 0; i < fake.realCalls.length; i++) {
        var realCall = fake.realCalls[i];
        var mock = fake.mocks[realCall.methodName];
        if(mock === undefined) { continue; }

        for(var j = 0; j < mock.behaviours.length; j++) {
          var behaviour = mock.behaviours[j];

          if(reallyEqual(realCall.args, behaviour.args) &&
            reallyEqual(realCall.returnValue, behaviour.returnValue)) {
            behaviour.usedByReal = true;
          }
        }
      }

      for(var mockName in fake.mocks) {
        // We check to see if the real objects' methods are a subset
        // of the fake's. Unfortunately this is complicated by our
        // RealWrapper replacing these methods, so we sniff for our
        // wrapper as well.
        if(
          fake.real[mockName] === undefined ||
          (fake.real[mockName].hasOwnProperty('realMethod') &&
            fake.real[mockName].realMethod === undefined)
        ) {
          throw 'Fake ' + fake.name + ' defines ' + methodName +
            ', but the real object does not.';
        }

        fake.mocks[mockName].verify();
      }
    };

    return fake;
  };

  // Generates a function that wraps the real function
  // and logs the call to the fake.
  function realMethodWrapperFor(real, methodName, fake) {
    var realMethod = real[methodName];

    return function() {
      // Check against arguments
      var args = arrayify(arguments);
      var returnValue = realMethod.apply(real, arguments);

      fake.realCalls.push({
        methodName: methodName,
        args: args,
        returnValue: returnValue
      });

      return returnValue;
    };
  };

  // Wraps a real object, recording any usage
  // of a method in the fake's behaviours.
  function RealWrapper(real, fake) {
    for(methodName in real) {
      real[methodName] = realMethodWrapperFor(real, methodName, fake);
    }

    return real;
  }

  // Stores all created fakes.
  _Mockhard.fakes = {};

  _Mockhard.reset = function() { _Mockhard.fakes = {}; };

  // Gets or creates a Fake.
  _Mockhard.fake = function(name) {
    _Mockhard.fakes[name] = _Mockhard.fakes[name] || Fake(name);
    return _Mockhard.fakes[name];
  }

  // Sets the real object for a fake.
  _Mockhard.real = function(name, object) {
    _Mockhard.fakes[name] = _Mockhard.fakes[name] || Fake();
    _Mockhard.fakes[name].real = object;
    return RealWrapper(object, _Mockhard.fakes[name]);
  }

  // Run at the end of all tests
  _Mockhard.verifyFakes = function() {
    for(var name in _Mockhard.fakes) {
      _Mockhard.fakes[name].verify();
    }
  }

  return _Mockhard;
}());

// For now, let's pollute the global namespace :)
var fake = Mockhard.fake;
var real = Mockhard.real;
var verifyFakes = Mockhard.verifyFakes;
