#!/usr/bin/env node

var Liftoff = require('liftoff')
var kawa = require('../lib/kawa')
var program = require('commander')
var resolve = require('path').resolve
var glob = require('glob')
var uniq = require('lodash.uniq')
var flatten = require('lodash.flatten')

var Kawa = new Liftoff({
  name: 'kawa',
  extensions: require('interpret').jsVariants,
  v8flags: require('v8flags')
})
  .on('require', function (name, module) {
    if (name === 'coffee-script') {
      module.register()
    }
  })
  .on('requireFail', function (name, err) {
    console.log('Unable to load:', name, err)
  })

function collectValues (str, memo) {
  memo.push(str)
  return memo
}

program
  .version(require('../package.json').version)
  .option('-u, --ui <name>', 'specify the Mocha user-interface (bdd|tdd|exports)')
  .option('-R, --reporter <name>', 'specify the Mocha reporter to use', 'html')
  .option('-P, --phantom', 'enable phantomjs client (require phantomjs to be installed)', false)
  .option('-p, --port <port>', 'set test server port', 3042)
  .option('-w, --watch', 'watch file for change', false)
  .option('--require <module>', 'path to a module to preload before running kawa', collectValues, [])
  .option('--script <path>', 'add script file to client', collectValues, [])
  .option('--css <path>', 'add css file to client', collectValues, [])
  .option('--use <module>', 'Express application or router to extend default server')
  .option('-t, --transform <module>', 'Add a transform module to the default browserify bundler', collectValues, [])
  .option('--plugin <module>', 'Add a plugin module to the default browserify bundler', collectValues, [])
  .parse(process.argv)

Kawa.launch({
  require: program.require
}, launcher)

function launcher (env) {
  var conf = {}

  program.script = (program.script || []).map(function (p) {
    return resolve(p)
  })
  program.css = (program.css || []).map(function (p) {
    return resolve(p)
  })

  if (env.configPath) {
    process.chdir(env.configBase)
    conf = require(env.configPath)
  }

  conf.ui = conf.ui || program.ui
  conf.reporter = conf.reporter || program.reporter
  conf.phantom = (typeof (conf.phantom) === 'boolean') ? conf.phantom : program.phantom
  conf.watch = (typeof (conf.watch) === 'boolean') ? conf.watch : program.watch
  conf.script = (conf.script || program.script || []).map(function (p) {
    return resolve(p)
  })
  conf.css = (conf.css || program.css || []).map(function (p) {
    return resolve(p)
  })
  conf.port = conf.port || program.port
  conf.use = conf.use || program.use

  conf.transform = (conf.transform || program.transform || [])

  conf.plugin = (conf.plugin || program.plugin || [])

  // Conf matrix imply watch
  if (conf.reporter === 'matrix') {
    conf.watch = true
  }

  if (program.args.length) {
    conf.tests = flatten(program.args.map(function (p) {
      return glob.sync(p)
    }))
  } else if (conf.tests) {
    conf.tests = flatten(conf.tests.map(function (p) {
      return glob.sync(p)
    }))
  } else {
    conf.tests = glob.sync('./test/*.js')
  }

  conf.tests = uniq(conf.tests.map(function (p) {
    return resolve(p)
  }))

  if (!conf.tests.length) {
    console.error('No tests found.')
    process.exit(1)
  }

  var ktest = kawa()
  ktest.ui(conf.ui || 'bdd')
  ktest.reporter(conf.reporter || 'html')
  if (conf.phantom) {
    ktest.usePhantom(true)
  }
  if (!conf.watch) {
    ktest.runOnce()
  }
  conf.script.forEach(ktest.addScript.bind(ktest))
  conf.css.forEach(ktest.addCss.bind(ktest))
  if (conf.use) {
    ktest.use(require(resolve(conf.use)))
  }

  conf.transform.forEach(ktest.transform.bind(ktest))
  conf.plugin.forEach(ktest.plugin.bind(ktest))

  // Add tests
  conf.tests.forEach(function (path) {
    ktest.addTest(path, ktest.bundler(path))
  })

  // Run test server
  ktest.listen(conf.port)

  if (!conf.watch) {
    ktest.on('end', function () {
      process.exit(0)
    })
  }

}
