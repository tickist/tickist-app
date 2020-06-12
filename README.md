# Tickist
Landing page: [Tickist.com](https://tickist.com) 

The official website of the application: [Tickist.app](https://tickist.app)

## How to run

### Install the application

    -> # git clone git@github.com:tickist/tickist-app.git

    -> # cd tickist-app

    -> # npm install -g @angular/cli firebase-tools cross-env

    -> # npm install

    -> # npm run start

If you want to create your firebase project please use [official Firebase console website](https://console.firebase.google.com/) 
and copy firebase config object to the environment/environment.dev.ts file

If you want to read more about the technologies used in this project, please see this online documentation:
 * [Angular](https://angular.io/)
 * [Firebase](https://firebase.google.com/)
 
 ### Firebase CLI
 
Log into Firebase using your Google account by running the following command:

    -> #  firebase login

Test that the CLI is properly installed and accessing your account by listing your Firebase projects. Run the following command:

    -> # firebase projects:list
    

 ### E2E Testing 
 
 Tickist application is using cypress as a testing tool and 
 [cypress firebase](https://github.com/prescottprue/cypress-firebase) as a glue between cypress and firebase backend.
 If you want to run e2e test:
 
    ` -> # npm run e2e`
     
    
 or

    ` -> # npm run e2e:watch`
    
 You should create more additional steps: 
1. Go to project setting on firebase console and generate a new private key. See how to do so in the Google Docs.

2. Add serviceAccount.json to your .gitignore (THIS IS VERY IMPORTANT TO KEEPING YOUR INFORMATION SECURE!)

3. Save the downloaded file as serviceAccount.json in the root of your project (make sure that it is .gitignored) - needed for firebase-admin to have read/write access to your DB from within your tests

4. Create a new user in firebase console and save UID into the package.json file 

more info how to configure cypress-firebase you can find here in the [official cypress-firebase github repo](https://github.com/prescottprue/cypress-firebase#setup)

### Bug reporting

If you have any problems with application or you find a bug, please report it:
* in github issues
* send us an e-mail to tickist@tickist.com
 
## What is Tickist

Tickist is not only a place, where you may gather your daily tasks. It was also designed as a tool for the continuous improvement of effectiveness and efficiency of time management. 

The functionalities offered by Tickist ― such as nested lists, tags, flexible due dates (on that date and by a date) and estimated time ― should help us all to manage our time more effectively. 

A to-do list doesn’t have to cause negative associations. We want to enjoy the ticking and our well-deserved free time

## Features 

#### Tags/Label 

#### Repeat options 

#### Steps 

#### Sharing tasks or projects


#### Notifications 

#### Pinning

#### Real time database 

#### Tasks and projects in tree view

#### Progressive web application

## Social media

[Facebook](https://www.facebook.com/Tickist)

[Twitter](https://twitter.com/tickist)

[Instagram](https://www.instagram.com/tickistapp/)


# Licence 

Every code patch accepted in Tickist is licensed under GPL v3.0. You must be careful to not include any code that can not be licensed under this license.

Please read carefully [our license](https://github.com/tickist/frontend/blob/master/LICENSE) and ask us if you have any questions.


