// Utility functions
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



// The collection of defined fakes.
var fakes = {};

// Converts a method signature into a string.
var methodSignature = function(methodName, args, returnValue) {
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

  return mock;
}

// An object that can be mocked.
function Fake(name) {

  var fake = {
    // The real object that mocks, etc. will be compared against.
    // Set with real().
    real: undefined,

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
  };

  return fake;
};

// Wraps a real object, recording any usage
// of a method in the fake's behaviours.
function RealWrapper(real, fake) {
  for(methodName in fake.mocks) {
    var mock = fake.mocks[methodName];
    var realMethod = real[methodName];

    if(realMethod === undefined) {
      throw 'Fake ' + fake.name + ' defines ' + methodName + ', but the real \
        object does not.';
    }

    real[methodName] = function() {
      // Check against arguments
      var args = arrayify(arguments);
      var realReturnValue = realMethod.apply(real, arguments);

      for(var b = 0; b < mock.behaviours.length; b++) {
        var behaviour = mock.behaviours[b];

        if (reallyEqual(behaviour.args, args) &&
            reallyEqual(behaviour.returnValue, realReturnValue)) {
          behaviour.usedByReal = true;
          return behaviour.returnValue;
        }
      }

      // If we get here, there are no matching behaviours for these args.
      var mockedCalls = [];
      for(var name in mock.behaviours) {
        var b = mock.behaviours[name];
        mockedCalls.push(methodSignature(methodName, b.args, b.returnValue));
      }
      mockedCalls = mockedCalls.join('\n');

      throw 'Fake ' + fake.name + ' is not set up to receive ' +
        methodSignature(methodName, args, returnValue) + ', but it was called \
        on the real object.\n \
        Mocked calls:\n' + mockedCalls;
    }
  }

  return real;
}

// Gets or creates a Fake.
function fake(name) {
  fakes[name] = fakes[name] || Fake(name);
  return fakes[name];
}

// Sets the real object for a fake.
function real(name, object) {
  fakes[name] = fakes[name] || Fake();
  fakes[name].real = object;
  return RealWrapper(object, fakes[name]);
}

// Run at the end of all tests
function verifyFakes() {
  for(name in fakes) {
    fakes[name].verify();
  }
}
