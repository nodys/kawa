#!/usr/bin/env node

var Liftoff = require('liftoff');
var kawa    = require('../lib/kawa');
var program = require('commander');
var resolve = require('path').resolve
var glob    = require('glob')
var _ = require('underscore')
var watchify = require('watchify')
var debug   = require('debug')('kawa')

var Kawa = new Liftoff({
  name: 'kawa',
  extensions: {
    ".js": null,
    ".coffee": "coffee-script/require"
  },
  cwdOpt: 'cwd',
  requireOpt: 'require'
}).on('require', function (name, module) {
  if (name === 'coffee-script') {
    module.register();
  }
}).on('requireFail', function (name, err) {
  console.log('Unable to load:', name, err);
});

Kawa.launch(launcher);

function launcher (env) {

  function collectValues(str, memo) {
    memo.push(str);
    return memo;
  }

  program
    .version(require('../package.json').version)
    .option('-u, --ui <name>','specify the Mocha user-interface (bdd|tdd|exports)')
    .option('-R, --reporter <name>','specify the Mocha reporter to use', 'html')
    .option('-P, --phantom','enable phantomjs client (require phantomjs to be installed)', false)
    .option('-p, --port <port>','set test server port', 3042)
    .option('-w, --watch','watch file for change', false)
    .option('--script <path>','add script file to client', collectValues, [])
    .option('--css <path>','add css file to client', collectValues, [])
    .option('--use <module>','Express application to use')
    .parse(process.argv);


  var conf = {};

  program.script = (program.script || []).map(function(p) { return resolve(p) });
  program.css  = (program.css || []).map(function(p) { return resolve(p) });

  if(env.configPath) {
    process.chdir(env.configBase);
    conf = require(env.configPath);
  }

  conf.ui       = conf.ui || program.ui;
  conf.reporter = conf.reporter || program.reporter;
  conf.phantom  = ('boolean' === typeof conf.phantom ) ? conf.phantom : program.phantom;
  conf.watch    = ('boolean' === typeof conf.watch )   ? conf.watch   : program.watch;
  conf.script   = (conf.script || program.script || []).map(function(p) { return resolve(p) });
  conf.css      = (conf.css  || program.css  || []).map(function(p) { return resolve(p) });
  conf.port     = conf.port || program.port;

  if(program.args.length) {
    conf.tests = _.flatten(program.args.map(function(p) {
      return glob.sync(p);
    }))
  } else if(conf.tests) {
    conf.tests = _.flatten(conf.tests.map(function(p) {
      return glob.sync(p);
    }))
  } else {
    conf.tests = glob.sync('test/*.js');
  }

  conf.tests = _.uniq(conf.tests.map(function(p) { return resolve(p) }));

  if(!conf.tests.length) {
    console.error('No tests found.');
    process.exit(1);
  }

  var ktest = kawa();
  ktest.ui(conf.ui || 'bdd');
  ktest.reporter(conf.reporter || 'html');
  conf.phantom && ktest.usePhantom();
  (!conf.watch) && ktest.runOnce();
  conf.script.forEach(ktest.addScript.bind(ktest))
  conf.css.forEach(ktest.addCss.bind(ktest))

  // Add tests
  conf.tests.forEach(function(p) {
    ktest.addTest(p, watchify(p))
  })

  // Run test server
  ktest.listen(conf.port);


}
