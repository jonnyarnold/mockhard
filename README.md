# Glue: Contract Testing for JavaScript

Glue makes mocking more robust by ensuring mocked methods are tested.

## The Problem

Let's assume I have a `Student` which depends on a `Library`:

```js
var Student = {
  learn: function(library) {
    return 'I learned ' + library.checkout();
  }
};
```

We can test `Student` like this:

```js
describe('Student', function() {
  it('does something', function() {
    var library = {
      checkout: function() { return 'Moby Dick'; }
    };

    expect(Student.learn(library)).toEqual('I learned Moby Dick');
  });
});
```

However, we have a problem: we have no idea whether the *real* `Library` has a
function called `checkout` that takes no arguments and returns Moby Dick. *Our
mocks are not synchronised with their real counterparts.*

## The Solution

Glue ensures that the things you do with your mock object can be done with a
real object. If you change the real object without changing the mock, Glue will
let you know (and vice versa).

If you want more information on why this is cool, watch [Integration Tests are
a Scam](http://www.infoq.com/presentations/integration-tests-scam). (You could
say that Glue is a contract testing helper.)

In Glue you would write:

```js
describe('Student', function() {
  it('does something', function() {
    var library = fake('library');
    library.mock('checkout').map([], 'Moby Dick');

    expect(Student.learn(library)).toEqual('I learned Moby Dick');
  });
});
```

If you leave it at this, Glue will moan when your tests run because you haven't
linked your mock with a real object.

```
No real object defined for fake library
Call real(library, obj) with a real object to test against.
```

Let's do what it says, and test the real object:

```js
describe('Library', function() {
  it('returns the name of the book in the constructor', function() {
    var library = Library('Moby Dick');
    real('library', library);

    expect(library.checkout()).toEqual('Moby Dick');
  });
});
```

Congratulations, you have appeased Glue and it will no longer whinge at you.

## Limitations

- Order is important! `fake` must be fully `mock`ed before `real` is called.
*(This should be fixed before this library is considered 'good enough to use!')*
- Glue mocks methods only, not properties.

## For Developers

Get set up by cloning the repository and running `npm install`.

Run tests once using `npm test`. Use `karma start` to watch your tests while
developing.
