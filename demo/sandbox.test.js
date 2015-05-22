var expect = require('expect.js')
var Promise = require('bluebird')

describe('A client-server test suite', function() {
  this.timeout(5000)

  before(function() {
    var div = document.createElement('div')
    div.id = 'foobar'
    div.style.position = 'absolute'
    div.style.top = '16px'
    div.style.left= '320px'
    document.body.appendChild(div)
  })

  it('should work div', function() {
    var div = document.querySelector('#foobar')
    expect(div).to.be.an(window.HTMLDivElement)
  })

  it('should work div', function() {
    var div = document.querySelector('#foobar')
    var box = div.getClientRects()[0]
    expect(box.top).to.be(16)
    expect(box.left).to.be(320)
  })

  it('should be long too', function(done) {
    setTimeout(done, 1200)
  })

})
