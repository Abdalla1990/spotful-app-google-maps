const path = require('path');
const OutputPath = path.join(__dirname, './dist/');
const SrcPath = path.join(__dirname , './src/');
const demoPath = path.join(__dirname,'./demo/');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const S3Plugin = require('webpack-s3-plugin');
const npmPackage = require('./package.json');
const manifestUrl = require('./src/manifest.json');
const WebpackShellPlugin = require('./utils');
const awsConfig = require('./aws.config');



module.exports = (env,callback) => {
  
  
  let ThePlugins = [];
      
  let isProduction = env === 'production';

  let isDev = env === 'dev';
      
  let CleanWebpack = new CleanWebpackPlugin([OutputPath])
      
  let CopyWebpack = new CopyWebpackPlugin([

    { from: './node_modules/spotful-ui/dist/spotful-ui.js', to: demoPath },
    { from: './src', to: OutputPath,ignore:['*.js'] }
    
  ])
        

  let BrowserSync = new BrowserSyncPlugin({
    host: 'localhost',
    port: 3000,
    server: { baseDir: ['./demo','./'] },
    browser : "google chrome"
  })

  if(isProduction === true){
    let aws_s3 = new S3Plugin({
      // s3Options are required 
      s3Options: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
        region: awsConfig.region,
        ACL : awsConfig.ACL
      },
      s3UploadOptions: {
        Bucket: awsConfig.bucket
        
      },
      basePath : npmPackage.name + '/' +npmPackage.version
    })
    // let UglifyJS = new UglifyJSPlugin()
    let manifestFile = `manifest.json : https://s3.amazonaws.com/spotful-apps/${npmPackage.name + '/' +npmPackage.version}/manifest.json `
    let indexFile = `index.html : ${manifestUrl.template}` ;
    let shell = new WebpackShellPlugin({ 
      onBuildStart: [
        'echo " Deployment ...  "'
      ], 
      onBuildEnd: [
       
       
        `echo  manifest.json : https://s3.amazonaws.com/spotful-apps/${npmPackage.name + '/' +npmPackage.version}/manifest.json `, 
        `echo  index.html : ${manifestUrl.template}`,
        'echo "Your App has been deployed ! "',
        'echo "********************************************"'
        
      ] 
    });

    ThePlugins = [];
    ThePlugins.push(CleanWebpack,CopyWebpack,BrowserSync);
    ThePlugins.push(aws_s3);
    ThePlugins.push(shell)
    
   // printLogs();
  }else if(isDev === true) { 

    let shell = new WebpackShellPlugin({ 
      onBuildStart: [
        'echo " Building the app in Development mode ...  "'
      ], 
      onBuildEnd: [
        'echo " Your App has been served from Demo "'
      ] 
    });
   
    ThePlugins = [];
    ThePlugins.push(CleanWebpack,CopyWebpack,BrowserSync);
    ThePlugins.push(shell);
    
  }
  // const CSSExtract = new ExtractTextPlugin('styles.css');
  return {
    entry: "./src/app", // read the code in app.js
    output: { // convert it into native react code in the public directory.
        path: OutputPath,
        filename: 'bundle.js' // the name of the file the code gets converted in.
    },
    module: { // any third party library 
        rules: [{
            loader: 'babel-loader', // babel which converts the code from jsx to react 
            test: /\.js$/, // any file that ends with .js
            exclude: /node_modules/ // don't read these files 
        },{
            test:/\.s?css$/, // load the scss styles the S is optional , so its either scss or css 
            use:['style-loader',// use these 2 loaders when runing the code. 
            'css-loader',// use these 2 loaders when runing the code. 
            'sass-loader'] // use this to convert the sass to css YOU HAVE TO INSTALL SASS_LOADER AND NODE_SASS before adding this. 
        },{
            test: /\.(gif|png|jpe?g|svg)$/i,
            loaders: [
              'file-loader', {
                loader: 'image-webpack-loader',
                options: {
                  gifsicle: {
                    interlaced: false,
                  },
                  optipng: {
                    optimizationLevel: 7,
                  },
                  pngquant: {
                    quality: '65-90',
                    speed: 4
                  },
                  mozjpeg: {
                    progressive: true,
                    quality: 65
                  },
                  // Specifying webp here will create a WEBP version of your JPG/PNG images
                  webp: {
                    quality: 75
                  }
                }
              }
            ]
          }]
    },
    plugins: ThePlugins ,
    devtool: isProduction? 'source-map' : 'inline-source-map'
  };

}