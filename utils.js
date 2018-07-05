// const npmPackage = require('./package.json');
// const manifestUrl = require('./src/manifest.json');
// module.exports = ()=> {
     
//     console.log('\x1b[36m%s\x1b[0m', '********************************************************************************************************************* ');
//     console.log('\x1b[36m%s\x1b[0m', 'Your App has been deployed ! ');
//     console.log('\x1b[36m%s\x1b[0m', 'The following are the files Uploaded :  ');
//     console.log('\x1b[36m%s\x1b[0m', `manifest.json : https://s3.amazonaws.com/spotful-apps/${npmPackage.name + '/' +npmPackage.version}/manifest.json `);
//     console.log('\x1b[36m%s\x1b[0m', `index.html : ${manifestUrl.template}`);
//     console.log('\x1b[36m%s\x1b[0m', '********************************************************************************************************************* ');
    
//   } 

  'use strict';
  
  var exec = require('child_process').exec;
  
  function puts(error, stdout, stderr) {
      console.log('\x1b[33m%s\x1b[0m',stdout);
  }
  
  function WebpackShellPlugin(options) {
    var defaultOptions = {
      onBuildStart: [],
      onBuildEnd: []
    };
  
    this.options = Object.assign(defaultOptions, options);
  }
  
  WebpackShellPlugin.prototype.apply = function(compiler) {
    const options = this.options;
  
    compiler.plugin("compilation", compilation => {
      if(options.onBuildStart.length){
          //console.log("Executing pre-build scripts");
          options.onBuildStart.forEach(script => exec(script, puts));
      }
    });
  
    compiler.plugin("emit", (compilation, callback) => {
      if(options.onBuildEnd.length){
          //console.log("Executing post-build scripts");
          options.onBuildEnd.forEach(script => exec(script, puts));
      }
      callback();
    });
  };
  
  module.exports = WebpackShellPlugin;