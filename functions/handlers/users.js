const {admin, db} = require('../util/admin');

const config = require('../util/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const {validatesSignUpData, validateLoginData, reduceUserDetails} = require('../util/validators');

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

    const noImg = 'no-img.png'; // image
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
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
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


// ADD USER DETAILS
exports.addUserDetails = (request, response) => {
    let userDetails = reduceUserDetails(request.body);

    db.doc(`/users/${request.user.handle}`)
        .update(userDetails)
        .then(() => {
            return response.json( {message: 'Details added successfully.'} );
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({error: error.code});
        });
}; // end ADD USER DETAILS

// GET OWN USER DETAILS
exports.getAuthenticatedUser = (request, response) => {
    let userData = {};
    // grab the authenticated user
    db.doc(`/users/${request.user.handle}`).get()
        .then(doc => {
            // check if the document exists
            if(doc.exists) {
                userData.credentials = doc.data();
                return db.collection('likes').where('userHandle', '==', request.user.handle).get();
            }
        })
        .then(data => {
            userData.likes = [];
            // loop through each document
            data.forEach(doc => {
                userData.likes.push(doc.data()); // push any likes into the userdata
            });
            return response.json(userData);
        })
        .catch(err => {
            console.error(error);
            return response.status(500).json({error: error.code});
        })
}; // end Get Authenticated User 

// Begin Image Upload
exports.uploadImage = (request, response) => {
    const Busboy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    let imageFileName;
    let imageToBeUploaded = {};

    const busboy = new Busboy( {headers: request.headers });

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        // makes sure the file is either jpeg or png
        if(mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return response.status(400).json( { error: 'Wrong file type submitted.'});
        }

        console.log(fieldname, "field name");
        console.log(filename, "file name");
        console.log(mimetype, "mime type");
        // Extension Example: my.image.png => ['my', 'image', 'png']
        // need to access the last item - minus the length by 1
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        // Example: 23540958230955.png
        imageFileName = `${Math.round(Math.random() * 1000000000000).toString()}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype };

        file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on('finish', () => {
        admin.storage().bucket(`${config.storageBucket}`).upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            // construct the image URL to add it to the user
            // by adding the alt media, it shows it on the browser instead of downloading it
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
            return db.doc(`/users/${request.user.handle}`).update({ imageUrl: imageUrl}); // lets us access the 
        })
        .then(() => {
            return response.json({ message: 'Image uploaded successfully.'});
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({error: "Error. Image not uploaded."});
        });
    });
    busboy.end(request.rawBody);
}; // end upload Image