/* jshint undef: false, unused: false */

var testy  = require('../lib/testy')
var should = require('should')
var join   = require('path').join


function fixp(filename) {
  return join(__dirname, '/fixtures', filename);
}

describe('testy', function(){
  describe('.version', function() {
    it('should match x.x.x format', function(){
      testy.version.should.match(/^\d+\.\d+\.\d+$/)
    });
  })
})
