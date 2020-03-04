const {db} = require('../util/admin');

// first parameter is the name of the route, 
// and second is the handler which takes a request and response
exports.getAllScreams = (request, response) => {
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
}; // end Get All Screams

// post one scream
exports.postOneScream = (request, response) => {
    // create an object to hold the new scream
    const newScream = {
        body: request.body.body, // our request has a body - then add the properties
        userHandle: request.user.handle,
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
}; // end post one scream