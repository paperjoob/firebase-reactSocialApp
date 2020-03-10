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
                createdAt: doc.data().createdAt,
                commentCount: doc.data().commentCount,
                likeCount: doc.data().likeCount,
                userImage: doc.data().userImage
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
        userImage: request.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };

    // persist the object into the database by passing the scream object
    db.collection('screams').add(newScream)
    .then(doc => {
        // send a json response that the scream has been added successfully
        const responseScream = newScream;
        responseScream.screamId = doc.id;
        response.json(responseScream);
    })
    .catch((error) => {
        response.status(500).json( {error: 'Something went wrong with creating a new scream.'} );
        console.error(error);
    });
}; // end post one scream

// Get One Scream by Its ID
exports.getScream = (request, response) => {
    let screamData = {};

    db.doc(`/screams/${request.params.screamId}`).get()
        .then(doc => {
            // if the document doesn't exist, return a status of 404 not found and the message below
            if(!doc.exists) {
                return response.status(404).json({ error: 'Scream not found.'})
            }
            screamData = doc.data();
            screamData.screamId = doc.id; // assign screamdata.screamid to the document id
            // fetch comments collention where screamid is equal to that comment
            return db.collection('comments')
                .orderBy('createdAt', 'desc')
                .where('screamId', '==', request.params.screamId)
                .get();
            })
            .then(data => {
                screamData.comments = [];
                // for each document with that ID, push that into the comments screamdata array
                data.forEach(doc => {
                    screamData.comments.push(doc.data())
                });
                return response.json(screamData);
            })
            .catch(error => {
                console.error(error);
                response.status(500).json({error: error.code})
            })
}; // end getScream by its ID

// POST A Comment on A Specific Scream
exports.commentOnScream = (request, response) => {
    // if the comment body is empty, show the error below
    if(request.body.body.trim() === '') {
        return response.status(400).json({ comment: 'Comment must not be empty.'});
    }
    // new comment holds all this data
    const newComment = {
        body: request.body.body,
        createdAt: new Date().toISOString(),
        screamId: request.params.screamId,
        userHandle: request.user.handle, // passed from the middleware
        userImage: request.user.imageUrl
    };
    db.doc(`/screams/${request.params.screamId}`)
    .get()
    .then((doc) => {
     // if the scream does not exist
      if (!doc.exists) {
        return res.status(404).json({ error: 'Scream not found' });
      }
      // update the comment count by 1
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection('comments').add(newComment);
    })
    .then(() => {
    // return the comment back to the user
      response.json(newComment);
    })
    .catch((err) => {
      console.log(err);
      response.status(500).json({ error: 'Something went wrong' });
    });
}; // end commonOnScream

// begin likeScream
exports.likeScream = (request, response) => {
    // limit a user to like a particular scream ID to 1 like
    const likeDocument = db.collection('likes').where('userHandle', '==', request.user.handle)
        .where('screamId', '==', request.params.screamId).limit(1);

    const screamDocument = db.doc(`/screams/${request.params.screamId}`);

    let screamData;
    // check if this scream ecists
    screamDocument.get()
        .then(doc => {
            if(doc.exists) {
                screamData = doc.data();
                screamData.screamId = doc.id; // assign the screamId
                return likeDocument.get();
            } else {
                // if scream doesn't exist
                return response.status(404).json({error: 'Scream not found.'});
            }
        })
        .then(data => {
            // if there is no like, add the like and pass in the screamId and User Handle
            if (data.empty) {
                return db.collection('likes').add({
                    screamId: request.params.screamId,
                    userHandle: request.user.handle
                })
                .then(() => {
                    screamData.likeCount++; // increment the like count by 1
                    return screamDocument.update({likeCount: screamData.likeCount})  // increment the like count in the document of the scream in the database
                })
                .then(() => {
                    return response.json(screamData); // return the screamData in JSON format
                })
            } else {
                // if we do have a like already
                return response.status(400).json({ error: 'Scream already liked.'});
            }
        })
        .catch(error => {
            console.error(error);
            response.status(500).json({error: error.code});
        })
}; // end likeScream

// begin UnlikeScream
exports.unlikeScream = (request, response) => {
    const likeDocument = db.collection('likes').where('userHandle', '==', request.user.handle)
        .where('screamId', '==', request.params.screamId).limit(1);

    const screamDocument = db.doc(`/screams/${request.params.screamId}`);

    let screamData;
    // check if this scream ecists
    screamDocument.get()
        .then(doc => {
            if(doc.exists) {
                screamData = doc.data();
                screamData.screamId = doc.id; // assign the screamId
                return likeDocument.get();
            } else {
                // if scream doesn't exist
                return response.status(404).json({error: 'Scream not found.'});
            }
        })
        .then(data => {
            // if there is not like, show this error
            if (data.empty) {
                return response.status(400).json({ error: 'Scream not liked.'});
            } else {
                // if we do have a like already
                return db
                .doc(`/likes/${data.docs[0].id}`)
                .delete()
                .then(() => {
                  screamData.likeCount--;
                  return screamDocument.update({ likeCount: screamData.likeCount });
                })
                .then(() => {
                  res.json(screamData);
                });
            }
        })
        .catch(error => {
            console.error(error);
            response.status(500).json({error: error.code});
        });
}; // end unlikeScream

// Begin Delete Scream
exports.deleteScream = (request, response) => {
    const document = db.doc(`/screams/${request.params.screamId}`);
    document.get()
        .then(doc => {
            // if the document does not exist
            if (!doc.exists) {
                return response.status(404).json({error: 'Scream not found.'});
            }
            // check to see if the userhandle is the correct user handle to that scream
            if (doc.data().userHandle !== request.user.handle) {
                // 403 = unauthorized error
                return response.status(403).json({error: 'Unauthorized.'});
            } else {
                return document.delete();
            }
        })
        .then(() => {
            response.json({message: 'Scream deleted successfully.'});
        })
        .catch(error => {
            console.error(error);
            response.status(500).json({error: error.code});
        });
}; // end deleteScream