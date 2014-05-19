/* jshint undef: false, unused: false */

var kawa   = require('../lib/kawa')
var should = require('should')
var join   = require('path').join


function fixp(filename) {
  return join(__dirname, '/fixtures', filename);
}

describe('kawa', function(){
  describe('.version', function() {
    it('should match x.x.x format', function(){
      kawa.version.should.match(/^\d+\.\d+\.\d+$/)
    });
  })
})
