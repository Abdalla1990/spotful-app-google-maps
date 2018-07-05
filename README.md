

# README #

This Boilerplate should make it easy for you to build a spotful app. The environment in this setup is by webpack and babel, all build and deploy processes are pre-configured. 

Please follow the steps below to start : 

## Clone this repo.
In your package.json file update the name and version keys to reflect this app. This is very important for our deployment flow, as these will be used to create the path to the S3 bucket where your app is hosted.
npm install installs the necessary dependencies.

Once your dependencies are installed, npm run dev starts up a server, and watches the files in your /src directory for changes. If a browser doesn't automatically open after running this command - you can access your app via localhost:3000.

For development, your app will be previewed through /demo - which contains a Spotful Simulator which gives you the same real spotful editor experience. This emulates the parent environment and communication flow of a Spotful App inside the platform.
When your app is ready for distribution, npm run build prepares and packages your app into the /dist directory.




## Templating Data
The Spotful Editor generates editor fields from the manifest.json, which will be used to communicate dynamic data into your app . For mocking data, you'll find a **data.json** file in the /demo folder. Any mocked data you add in this file should be matching fields in your **manifest.json** file which lives in **/src**
This mocked data is served via the **app-communication-api** to the simulator - just as it would be in the Spotful platform.
Any data you add to demo/data.json will be compiled and accessible in your app, it will come as a payload to the eventListner set in  componentDidMount function in spotfulApp ifle. 

Spotful Simulator  recompiles every time you make a change to your **/src** files, before the browser refreshes.
Example data.json

    {
	    "images" : [
	        {"title": "Image title 1", "alt": "Alt Text 1", "src": "https://unsplash.it/700/500"},
	        {"title": "Image title 2", "alt": "Alt Text 2", "src": "https://unsplash.it/600/500"},
	        {"title": "Image title 3", "alt": "Alt Text 3", "src": "https://unsplash.it/800/500"}
	    ]
	}

## App Requirements

To ensure a standardized experience to both users and creators, we've compiled a short list of requirements to consider when building Spotful Apps with ReactJs.

1.  Default / Empty State - To provide a default (not broken) or informational empty state to alert creators either what to do next - or that they have yet to customize or add anything to the app.
2.  Loading State - If your app takes time (more than a few seconds) to deliver data (say, from a third party service) you should display some sort of loading state to let either creators and users know data is being loaded.
3.  Well-Defined Manifest - Ensure that your labels and descriptions do what they have to do. Be clear, and be concise. 
4.  Be Responsive - Your app should work cross-browser, and respond intuitively to a variable width and height. Feel free to hide non-essential items in smaller frames. Make sure you consider the mobile experience as well (support touchevents when necessary, consider different aspect ratios, etc).

## Organizing Your App

Organize your app the way you would any other web project. Just like a website. Anything inside your  `/src`  will be compiled and copied into the  `/dist`  directory. This  `/dist`  folder is what will be deployed as your published app.

_Default Spotful App Organization:_

    src/
	    app.js          // Do your javascripting here.
	    index.html      // This will be rendered and served inside a Spotful Frame. 
	    manifest.json   // Define fields & user-accessible data for the Spotful editor
	    README.md       // Leave important information pertaining to your application.
	    robots.txt      // Do you want this app to be accessible to search engines?
	    css/
		    style.css       // Make your app accessible and easy to use, and make it look good.



## Writing A Manifest

To interface with our editor, Spotful Apps require a  `manifest.json`  file. See the available types  [here](https://bitbucket.org/spotinteractive/app-starter/src/d8473ef37f4b8bdf444f888e9116ba21b362d572/path/to/manifest/documentation), or read more about it in our manifest  [documentation](
https://bitbucket.org/spotinteractive/spotful-spec-documents/src/d2e844b1332ce0db94a6a53be75b01b24af99c4b/manifest-v1/?at=master).
an example of all available Spotful fields in JSON format can be fount in **manifest.json.example** file in the root directory of the project. 

## Submitting and Initializing a Spotful App

Before your app can be used in the Spotful ecosystem, it has to be added and configured in the  [Spotful Admin](https://admin.bespotful.com/)  under Templates.

_Requirements:_  
1\. The URL to your  `manifest.json`  file. 
2. specify the Permission (which user group has access to this app?) , *you can do that in the Admin Panel*
3.  App Icon (what will the app look like in the Target Wheel?) , *you can do that in the Admin Panel*
4.  App Group (optional_, what category do you want the app to be under?) *you can do that in the Admin Panel.*

## Deploying a Spotful App

Apps are hosted on AWS in our  `assets.bespotful.com`  bucket. Use  `npm run deploy`  to push your app to AWS. To setup your AWS configuration change aws.config.example file name to aws.config and edit its content to match  the given AWS settings. 

**NOTE: Your  _VERSION_  and  _TITLE_  MUST be updated in your  `package.json`.**  -  **Version**  will be reflected in the URL, and the latest version will be served in the editor. - The  **Title**  is to be unique and dashed - this will be reflected in the URL.



## Updating a Spotful App

Versioning is handled in the  `package.json`  file. Every time you make a change which you want to push, update the number in the  `package.json`  file, and push to AWS. When you push a version of your app (by updating your  `package.json`  file, and pushing to AWS), you must also update the URL to your manifest in the  [Spotful Admin](https://admin.bespotful.com/)  to reflect the latest available version in the editor. All apps created going forward will use this new version, and all apps created with a different version will maintain that version.
