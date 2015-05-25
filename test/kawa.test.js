/* global describe it beforeEach */
var expect = require('expect.js')
var resolve = require('path').resolve
var kawa = require('../lib/kawa.js')
var readFileSync = require('fs').readFileSync
var createReadStream = require('fs').createReadStream

describe('kawa', function () {
  var ktest, result

  beforeEach(function () {
    result = null
    ktest = kawa()
    ktest
      .silent(true)
      .usePhantom(true)
      .reporter('json')
    ktest.on('json', function (json) {
      result = json
    })
    ktest.listen()
  })

  function check (ktest, done) {
    ktest.on('end', function (err) {
      try {
        expect(result.stats.passes).to.eql(1)
      } catch(e) {
        result.tests.forEach(function (test) {
          if(!test.err.stack) {
            return
          }
          e.stack += '\n    From "' + test.fullTitle + '"'
          e.stack += '\n      '+ test.err.message + '\n' + test.err.stack
        })
        return done(e)
      }
      done()
    })
  }

  it('functional test', function (done) {
    var testPath = resolve(__dirname, './fixtures/divpos.test.js')
    ktest
      .addTest(testPath, ktest.bundler(testPath))
    ktest.on('end', function () {
      try {
        expect(result.status).to.eql(1)
        expect(result.stats.suites).to.eql(1)
        expect(result.stats.tests).to.eql(1)
        expect(result.stats.failures).to.eql(0)
        expect(result.userAgent).to.match(/PhantomJS/i)
      } catch(e) {
        return done(e)
      }
      done()
    })
  })

  describe('.addTest(filepathOrId, [mixed])', function () {
    var testPath = resolve(__dirname, './fixtures/basic.test.js')

    it('should accept a mocha test suite as string (id, {string})', function (done) {
      var source = readFileSync(resolve(__dirname, './fixtures/basic.test.js'), 'utf8')
      ktest.addTest('fake.js', source)
      check(ktest, done)
    })

    it('should accept a mocha test suite as stream  (id, {ReadableStream})', function (done) {
      var stream = createReadStream(resolve(__dirname, './fixtures/basic.test.js'))
      ktest.addTest('fake.js', stream)
      check(ktest, done)
    })


    it('should accept a mocha test suite as a browserify bundler (id, {Browserify})', function (done) {
      // ktest bundler is an helper function that create a watchify bundler
      var bundler = ktest.bundler(resolve(__dirname, './fixtures/basic.test.js'))
      ktest.addTest('fake.js', bundler)
      check(ktest, done)
    })

    it('should accept a mocha test suite as a filepath (filepath)', function (done) {
      ktest.addTest(testPath)
      check(ktest, done)
    })

  })

  describe('.addScript(filepathOrId, [mixed])', function () {
    var testPath = resolve(__dirname, './fixtures/usescript.test.js')
    var scriptPath = resolve(__dirname, './fixtures/assets/script.js')

    it('should include a script to the test environnement from a string (id, {string})', function (done) {
      var source = readFileSync(scriptPath, 'utf8')
      ktest.addScript('script.js', source)
      ktest.addTest(testPath)
      check(ktest, done)
    })

    it('should include a script to the test environnement from a stream  (id, {ReadableStream})', function (done) {
      var stream = createReadStream(scriptPath)
      ktest.addScript('script.js', stream)
      ktest.addTest(testPath)
      check(ktest, done)
    })

    it('should include a script to the test environnement from a browserify bundler (id, {Browserify})', function (done) {
      // ktest bundler is an helper function that create a watchify bundler
      var bundler = ktest.bundler(scriptPath)
      ktest.addScript('script.js', bundler)
      ktest.addTest(testPath)
      check(ktest, done)
    })

    it('should include a script to the test environnement from a filepath (filepath)', function (done) {
      ktest.addScript(scriptPath)
      ktest.addTest(testPath)
      check(ktest, done)
    })

  })

  describe('.addCss(filepathOrId, [mixed])', function () {
    var testPath = resolve(__dirname, './fixtures/usestyle.test.js')
    var stylePath = resolve(__dirname, './fixtures/assets/style.css')

    it('should include a stylesheet to the test environnement from a string (id, {string})', function (done) {
      var source = readFileSync(stylePath, 'utf8')
      ktest.addCss('style.css', source)
      ktest.addTest(ktest.bundler(testPath))
      check(ktest, done)
    })

    it('should include a stylesheet to the test environnement from a stream  (id, {ReadableStream})', function (done) {
      var stream = createReadStream(stylePath)
      ktest.addCss('style.css', stream)
      ktest.addTest(ktest.bundler(testPath))
      check(ktest, done)
    })

    it('should include a stylesheet to the test environnement from a filepath (filepath)', function (done) {
      ktest.addCss(stylePath)
      ktest.addTest(ktest.bundler(testPath))
      check(ktest, done)
    })

  })

})
