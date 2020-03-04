const {admin, db} = require('../util/admin');

const config = require('../util/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const {validatesSignUpData, validateLoginData} = require('../util/validators');

exports.signup = (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle,
    };

    const {valid, errors} = validatesSignUpData(newUser);

    // if the signup is not valid, pass in the errors. Otherwise, we carry on
    if (!valid) {
        return response.status(400).json(errors);
    }

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
};

// Login
exports.login = (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    };

    const {valid, errors} = validateLoginData(user);
    // if the login is not valid, pass in the errors. Otherwise, we carry on
    if (!valid) {
        return response.status(400).json(errors);
    }

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return response.json({token});
        })
        .catch(error => {
            console.error(error);
            if(error.code === 'auth/wrong-password') {
                return response.status(403).json( {general: 'Wrong credentials. Please try again.'} );
            } else {
                return response.status(500).json({error: error.code});
            }
        })
}; // end login