var should = require('should')
var request = require('superagent')
var expect = require('expect.js')

describe('A client-server test suite', function() {
  it('should send a successfull request to the server ...', function(done) {
    request.get('/service.json')
      .end(function(err, res) {
        done(err);
      })
  })
  it('should send a invalid request to the server ...', function(done) {
    request.get('/services.json')
      .end(function(err, res) {
        try {
          res.status.should.be.eql(200)
          done();
        } catch (e) { done(e) }
      })
  })
  it('should send a invalid request to the server ...', function(done) {
    request.get('/services.json')
      .end(function(err, res) {
        try {
          expect(res.status).to.eql(200);
          done();
        } catch (e) { done(e) }
      })
  })

})
