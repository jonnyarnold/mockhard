// Product Tour

// Let's assume I have a `Student` which depends on a `Library`:
var Student = {
  learn: function(library) {
    return 'I learned ' + library.checkout();
  }
};

// We can test `Student` like this:
describe('Student', function() {
  it('does something', function() {
    var library = {
      checkout: function() { return 'Moby Dick'; }
    };

    expect(Student.learn(library)).toEqual('I learned Moby Dick');
  });
});

// However, we have a problem: we have no idea whether the *real* `Library` has
// a function called `checkout` that takes no arguments and returns Moby Dick.
// *Our mocks are not synchronised with their real counterparts.*

// In Glue you would write:
describe('Student', function() {
  it('does something', function() {
    var library = fake('Library');
    library.mock('checkout').map([], 'Moby Dick');

    expect(Student.learn(library)).toEqual('I learned Moby Dick');
  });
});

// If you leave it at this, Glue will moan when your tests run because you
// haven't linked your mock with a real object.
describe('if we stopped here', function() {
  it('would throw an error', function() {
    expect(verifyFakes).toThrow();
  });
});

// Let's do what it says, and test the real object:
var Library = function(book) {
  return {
    checkout: function() { return book; },
    return_book: function(newBook) { book = newBook; }
  };
};

// Naively we could just call
real('library', Library('Moby Dick'));

// But we haven't actually tested the `checkout()` method,
// so we will get another error:
describe('if we stopped here', function() {
  it('would throw an error', function() {
    expect(verifyFakes).toThrow();
  });
});

// We need to put together a test of `checkout()`:
describe('Library', function() {
  var library;

  beforeEach(function() {
    library = real('Library', Library('Moby Dick'));
  });

  describe('.checkout', function() {
    it('returns the first book', function() {
      expect(library.checkout()).toEqual('Moby Dick');
    });
  });
});

// Congratulations, you have appeased Glue and it will no longer whinge at you.
describe('after the real object has been added', function() {
  it('no longer throws an error', function() {
    expect(verifyFakes).not.toThrow();
  });
});
