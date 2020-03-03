const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
// express
const app = require('express')();
// initialize firebase admin

// firebase
// Your web app's Firebase configuration
const config = {
    apiKey: "AIzaSyCcc5_OBY_9xtBen_ONOr6YC8Z45A9r0EY",
    authDomain: "socialape-50cca.firebaseapp.com",
    databaseURL: "https://socialape-50cca.firebaseio.com",
    projectId: "socialape-50cca",
    storageBucket: "socialape-50cca.appspot.com",
    messagingSenderId: "93449876942",
    appId: "1:93449876942:web:51d405495d15baa747a79f",
    measurementId: "G-LRPY9J7QFZ"
};

const firebase = require('firebase');
firebase.initializeApp(config); // initialize this app for this project

const db = admin.firestore();

// first parameter is the name of the route, 
// and second is the handler which takes a request and response
// getScreams
app.get('/screams', (request, response) => {
    // order by descending
    db.collection('screams')
    .orderBy('createdAt', 'desc').get()
    // the data is a query snapshot type which has the "docs" property 
    // which is an array of document snapshots
    .then(data => {
        let screams = []; // empty array of screams
        data.forEach(doc => {
            screams.push({
                screamId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            }); // push the data into the screams array
        });
        return response.json(screams); // return the screams as a JSON
    })
    .catch((error) => console.error(error)); // catch the errors
});

// create screams
app.post('/scream', (request, response) => {
    // create an object to hold the new scream
    const newScream = {
        body: request.body.body, // our request has a body - then add the properties
        userHandle: request.body.userHandle,
        createdAt: new Date().toISOString()
    };

    // persist the object into the database by passing the scream object
    db.collection('screams').add(newScream)
    .then(doc => {
        // send a json response that the scream has been added successfully
        response.json( {message: `Document ${doc.id} created successfully.`} );
    })
    .catch((error) => {
        response.status(500).json( {error: 'Something went wrong with creating a new scream.'} );
        console.error(error);
    });
});

// Signup Route
app.post('/signup', (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle,
    };

    // to do: validate data
    let token;
    let userId;
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if(doc.exists) {
                return response.status(400).json( {handle: 'This handle is already taken.'} );
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            // return an access token to the user to receive more data
            // set userid
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(idToken => { // idToken is the return from the promise
            // assign token parameter to the token
            token = idToken;
            // user document
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            };
            // .set to create the users 
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return response.status(201).json( {token} );
        })
        .catch(err => {
            console.error(err);
            // if email is already in use
            if(err.code === 'auth/email-already-in-use') {
                return response.status(400).json( {email: 'Email is already in use.'} );
            } else {
                return response.status(500).json( {error: err.code });
            }
        })
})

// https://baseurl.com/api/
// can return multiple routes
exports.api = functions.https.onRequest(app);