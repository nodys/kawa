# kawa
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Test browserify bundle in the browser with ease (based on mocha)

## Features

  - Bundle your tests with [browserify](http://browserify.org/), then run them in many browsers
  - A command line that works like [mocha](http://mochajs.org/)
  - An API that expose usefull informations about the results in the various browsers used to run test
  - Run tests in many browsers at the same time and support natively phantomjs for headless testing
  - Display test results in the terminal or in the browsers

## Getting Started

Install the module locally with `npm install kawa --save-dev` and/or globally with `npm install kawa -g`
Kawa works like [mocha](http://mochajs.org/) (and use it under the hood).


```bash
> kawa --help

  Usage: kawa [options]

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -u, --ui <name>        specify the Mocha user-interface (bdd|tdd|exports)
    -R, --reporter <name>  specify the Mocha reporter to use
    -P, --phantom          enable phantomjs client (require phantomjs to be installed)
    -p, --port <port>      set test server port
    -w, --watch            watch file for change
    --require <module>     path to a module to preload before running kawa
    --script <path>        add script file to client
    --css <path>           add css file to client
    --use <module>         Express application to use
```
