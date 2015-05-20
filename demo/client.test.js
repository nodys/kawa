var request = require('superagent')
var expect = require('expect.js')

describe('A client-server test suite', function() {

  it('should send a successfull request to the server ...', function(done) {
    request.get('/service.json')
      .end(function(err, res) {
        try {
          expect(res.status).eql(200);
          done();
        } catch(e) { done(e) }
      })
  })
  it('should throw', function() {
    throw new Error('buggy')
  })

})
