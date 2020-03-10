const functions = require('firebase-functions');

// imports
const {getAllScreams, postOneScream, getScream, commentOnScream, likeScream, unlikeScream, deleteScream} = require('./handlers/screams');
const {signup, login, uploadImage, addUserDetails, getAuthenticatedUser} = require('./handlers/users');
const FBAuth = require('./util/fbAuth');

// express
const app = require('express')();

// Scream Routes
app.get('/screams', getAllScreams); // get all screams
app.post('/scream', FBAuth, postOneScream); // // create a single scream
app.get('/scream/:screamId', getScream); // a route parameter with the screamID
app.post('/scream/:screamId/comment', FBAuth, commentOnScream); // post a comment on a specific Scream
app.get('/scream/:screamId/like', FBAuth, likeScream); // like a scream
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream); // unlike a scream
app.delete('/scream/:screamId', FBAuth, deleteScream); // TO DO - delete a scream

// Signup Route and Login Route - USERS ROUTE
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

// https://baseurl.com/api/
// can return multiple routes
exports.api = functions.https.onRequest(app);