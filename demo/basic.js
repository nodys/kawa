var testy    = require('../lib/testy.js')
var read     = require('fs').readFile
var join     = require('path').join
var chokidar = require('chokidar')
var basename = require('path').basename

testy.listen(3042);

function update(path) {
  // read(join(__dirname, './basic.test.js'))
  read(path, 'utf-8', function(err, content) {
    if(err) {
      console.error('Warning:' + path + ' is unreadable ' + err)
      return;
    }
    testy.add(basename(path), content);
  })
}

function remove(path) {
  testy.remove(basename(path));
}

var testpath = join(__dirname, './basic.test.js');

// Update once
update(testpath)

// Watch and update
chokidar.watch(testpath)
  .on('add', update)
  .on('change', update)
  .on('unlink', remove)
