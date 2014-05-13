var app = require('./app.js')
var should = require('should')

describe('myapp', function() {
  it('should join a path', function() {
    app('foo').should.eql('FOO/foo')
  })
})
