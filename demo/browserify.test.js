var should = require('should')

describe('A browserify test suite', function() {
  it('should simply works ...', function() {
    'Foo'.should.be.eql('Foo')
  })

  it('should throw ...', function() {
    throw new Error('bug')
  })
  it('should throw ...', function() {
    'Foo'.should.not.be.eql('Foo')
  })
})
