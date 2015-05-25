/* global describe it  before */
var expect = require('expect.js')

describe('Test div position', function () {
  before(function () {
    var div = document.createElement('div')
    div.id = 'foobar'
    div.style.position = 'absolute'
    div.style.top = '16px'
    div.style.left = '320px'
    document.body.appendChild(div)
  })

  it('should find a div at the right position', function () {
    var div = document.querySelector('#foobar')
    expect(div).to.be.an(window.HTMLDivElement)
    var box = div.getClientRects()[0]
    expect(box.top).to.be(16)
    expect(box.left).to.be(320)
  })

})
