describe('fake()', function() {

  beforeEach(function() {
    fakes = {};
  });

  // If we don't kill the fakes _after_ the tests,
  // we may accidentally verify our fake fakes.
  afterEach(function() {
    fakes = {};
  });

  it('records a fake in fakes', function() {
    fake('example');
    expect(fakes.example).toBeDefined();
  });

  it('returns the same fake on two separate calls', function() {
    var call1 = fake('example');
    var call2 = fake('example');
    expect(call1).toBe(call2);
  });

});

describe('Fake', function() {
  var subject;

  beforeEach(function() {
    subject = Fake();
  });

  describe('.mock', function() {

    it('adds a mock to mocks', function() {
      subject.mock('example');

      expect(subject.mocks.example).toBeDefined();
    });

    it('adds the method to the fake', function() {
      subject.mock('example');

      expect(subject.example).toBeDefined();
    });

    it('returns the same mock on two separate calls', function() {
      var call1 = subject.mock('example');
      var call2 = subject.mock('example');

      expect(call1).toBe(call2);
    });

  });
});

describe('Mock', function() {
  var subject;

  beforeEach(function() {
    subject = Mock('example');
  });

  it('is a function', function() {
    expect(typeof subject).toEqual('function');
  });

  describe('.map', function() {

    it('adds a behaviour to behaviours', function() {
      subject.map(['arg1', 'arg2'], 'return');
      expect(subject.behaviours.length).toBe(1);
    });

  });

  describe('after .map', function() {

    beforeEach(function() {
      subject.map(['a1', 'a2'], 'r1');
    });

    it('maps return value when correct arguments are passed', function() {
      expect(subject('a1', 'a2')).toEqual('r1');
    });

    it('throws after map when incorrect arguments are passed', function() {
      expect(function() { subject('a1') }).toThrow();
    });

    it('records the fake being used', function() {
      expect(subject.behaviours.length).toEqual(1);
      expect(subject.behaviours[0].usedByFake).toEqual(false);

      subject('a1', 'a2');

      expect(subject.behaviours[0].usedByFake).toEqual(true);
    });

  });
});

describe('real()', function() {
  var subject;

  beforeEach(function() {
    fakes = {};
    subject = fake('example');
  });

  afterEach(function() {
    fakes = {};
  });

  it('assigns the real object to the fake', function() {
    var realObj = {};
    real('example', realObj);

    expect(fakes.example.real).toBe(realObj);
  });
});

describe('RealWrapper', function() {
  var fake;
  var mock;
  var real;
  var wrapper;

  beforeEach(function() {
    fake = Fake('example');
    mock = fake.mock('foo').map([], 'bar');

    real = {
      foo: function() { return 'bar'; },
      somethingElse: function() { return 'hi'; }
    };
  });

  describe('on RealWrapper construction', function() {
    it('throws when fake has method that real does not', function() {
      var oldFake = fake;

      fake.mock('baz').map([], 'Uh oh.');

      expect(function() {
        RealWrapper(real, fake);
      }).toThrow();

      fake = oldFake;
    });

    it('returns if fake has subset of real methods', function() {
      expect(function() {
        RealWrapper(real, fake);
      }).not.toThrow();
    });
  });

  describe('once RealWrapper has been constructed', function() {
    beforeEach(function() {
      wrapper = RealWrapper(real, fake);
    });

    describe('when calling a mock function', function() {
      it('records real function calls in fake', function() {
        expect(fake.foo.behaviours.length).toEqual(1);
        expect(fake.foo.behaviours[0].usedByReal).toEqual(false);

        wrapper.foo();

        expect(fake.foo.behaviours[0].usedByReal).toEqual(true);
      });

      it('throws if the arguments do not match a mock behaviour', function() {
        expect(function() {
          wrapper.foo('I do not want arguments');
        }).toThrow();
      });

      it('returns the real return value', function() {
        expect(wrapper.foo()).toEqual(real.foo());
      });
    });

    it('throws when calling a function not defined on real object', function() {
      expect(function() {
        wrapper.notAFunction()
      }).toThrow();
    });

    it('returns the real value for unmocked methods', function() {
      expect(wrapper.somethingElse()).toEqual('hi');
    });
  });
});

describe('verifyFakes()', function() {
  var subject;

  beforeEach(function() {
    fakes = {};
    subject = fake('example');
  });

  afterEach(function() {
    fakes = {};
  });

  it('throws an error when no real object has been set', function() {
    expect(verifyFakes).toThrow();
  });

  it('does not throw an error otherwise', function() {
    real('example', {});
    expect(verifyFakes).not.toThrow();
  });
});
