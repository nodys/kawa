/* global describe it globalPow */
var expect = require('expect.js')

describe('suite', function () {
  before(function () {
    var div = document.createElement('div')
    div.id = 'foobar'
    document.body.appendChild(div)
  })

  it('the div computed style should respect style.css', function () {
    var div = document.querySelector('#foobar')
    var cs = window.getComputedStyle(div)
    // console.log(cs.getPropertyValue('left'))
    expect(cs.getPropertyValue('top')).to.eql('100px')
    expect(cs.getPropertyValue('left')).to.eql('200px')
    expect(cs.getPropertyValue('background-color')).to.eql('rgb(240, 11, 162)')
    expect(cs.getPropertyValue('width')).to.eql('42px')
  })
})
