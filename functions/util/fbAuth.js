const {db, admin} = require('./admin.js');

// Firebase Auth Middleware
module.exports = (request, response, next) => {
    let idToken;
    // if the authorization headers exist AND the authorization starts with "Bearer " 
    if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ') ) {
        // set the idtoken to the token which needs to be extracted 
        // split the strings by 'Bearer ' and gives us back an array of TWO strings - we will take the SECOND element which is the token
        idToken = request.headers.authorization.split('Bearer ')[1];
    } else {
        // send back an error response if no token
        console.error('No token found.');
        return response.status(403).json({ error: 'Unauthorized.'});
    }

    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            request.user = decodedToken;
            console.log(decodedToken, 'decoded token');
            return db.collection('users')
                .where('userId', '==', request.user.uid)
                .limit(1) // limit our results to 1 document
                .get();
        })
        .then(data => {
            // add a property to our request user
            // take the first element, the data() function to extract the handle property from the DB collection
            request.user.handle = data.docs[0].data().handle;
            return next(); // allows the request to proceed to the next step
        })
        .catch(error => {
            console.error('Error while verifying token', error);
            return response.status(403).json(error);
        })
}; // end Firebase Auth