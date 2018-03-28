module.exports = function(RED) {
  "use strict";
  var exec = require('ttbd-exec');

  function scanAvahi(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    var opt = {};

    this.on('input', function(msg){
      exec({cmd: 'avahi-browse -a -r -t'}, opt, function(err, stdout, stderr) {
        if(err){
          msg.scan = [];
          node.send(msg);
          return;
        }
        parse(stdout, function(data){
          msg.scan = data;
          node.send(msg);
        })
      })
    });
  }
  RED.nodes.registerType("scanAvahi",scanAvahi);

  function parse(data, callback){
    if (typeof callback !== 'function') {
      return;
    }
    var res = {};
    var item = {};
    data = data.split('\n');
    var i, size, match, name = "", key, value, txtParts, txtMatch, txtValue;
    for (i=0, size=data.length-1; i < size; i++){
      if(!data[i].match(/^=/)){
        match = data[i].match(/^\s*([^\s]*)\s*=\s*\[([^]*)]/);
        if (match && match.length > 2){
          key = match[1];
          value = match[2];
          if (key == 'hostname'){
            name = value.toLowerCase();
          } else if (key == 'txt' ){
            if (value.length > 2){
              value = value.substr(1,value.length-2);
              txtParts = value.split('" "');
              txtValue = {};
              for (var txtPart in txtParts){
                txtMatch = txtParts[txtPart].match(/([^=]*)=(.*)/);
                if (txtMatch && txtMatch.length > 2){
                  txtValue[txtMatch[1]] = txtMatch[2];
                }
              }
              item[key]=txtValue;
            }
          } else {
            item[key]=value;
          }
        }
      }
      else if (name !== ''){
        res[name] = item;
        item = {};
        name = '';
      }
    }
    res[name] = item;
    callback(res);
  }
}
