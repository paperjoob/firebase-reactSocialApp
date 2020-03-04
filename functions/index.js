const functions = require('firebase-functions');

// imports
const {getAllScreams, postOneScream} = require('./handlers/screams');
const {signup, login} = require('./handlers/users');
const FBAuth = require('./util/fbAuth');

// express
const app = require('express')();

// Scream Routes
app.get('/screams', getAllScreams); // get all screams
app.post('/scream', FBAuth, postOneScream); // // create a single scream

// Signup Route and Login Route - USERS ROUTE
app.post('/signup', signup);
app.post('/login', login);

// https://baseurl.com/api/
// can return multiple routes
exports.api = functions.https.onRequest(app);