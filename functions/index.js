const functions = require('firebase-functions');

// imports
const {getAllScreams, postOneScream, getScream, commentOnScream, likeScream, unlikeScream, deleteScream} = require('./handlers/screams');
const {signup, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead} = require('./handlers/users');
const FBAuth = require('./util/fbAuth');
const {db} = require('./util/admin');

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
app.get('/user/:handle', getUserDetails); // get user details by their handle or username
app.post('/notifications', FBAuth, markNotificationsRead); // mark a notification as read

exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then((doc) => {
            if (
            doc.exists &&
            // dont create a notification if the person who created it is the same person who likes it
            doc.data().userHandle !== snapshot.data().userHandle
            ) {
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'like',
                read: false,
                screamId: doc.id
            });
            }
        })
        .catch(error => {
            console.error(error);
            return;
        })
}); // end createNotificationOnLike

exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{id}')
    .onDelete((snapshot) => {
        return db.doc(`notifications/${snapshot.id}`)
        .delete() // delete the notification after unliking from the database
        .catch(error => {
            console.error(error);
            return;
        });
}); // end delete Notifications On Unlike

// Notifications on a Comment
exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
    .onCreate((snapshot) => {
        return db
        .doc(`/screams/${snapshot.data().screamId}`)
        .get()
        .then((doc) => {
            if (
            doc.exists &&
            // dont create a notification if the person who created it is the same person who comments it
            doc.data().userHandle !== snapshot.data().userHandle 
            ) {
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'comment',
                read: false,
                screamId: doc.id
            });
            }
        })
      .catch((err) => {
        console.error(err);
        return;
      });
}); // end Notification on a Comment

exports.onUserImageChange = functions.firestore.document('users/{userId}')
    .onUpdate((change) => {
        console.log(change.before.data(), "before");
        console.log(change.after.data(), "after change");
        let batch = db.batch(); // multiple documents being updated
        // execute this only if the image URL has changed
        if (change.before.data().imageUrl !== change.after.data().imageUrl) {
            return db.collection('screams').where('userHandle', '==', change.before.data().handle).get()
            .then(data => {
                data.forEach(doc => {
                    const scream = db.doc(`/screams/${doc.id}`); // document ID
                    batch.update(scream, {userImage: change.after.data().imageUrl});
                })
                return batch.commit(); // commit the update to the database
            });
        } else {
            return true;
        }
}); // end onUserImage Change

// on screamDelete
exports.onScreamDelete = functions.firestore.document('/screams/{screamId}')
    .onDelete((snapshot, context) => {
        const screamId = context.params.screamId;
        const batch = db.batch();
        return db.collection('comments').where('screamId', '==', screamId).get()
            .then((data) => {
            data.forEach((doc) => {
                batch.delete(db.doc(`/comments/${doc.id}`)); // delete a comment by its Doc ID by the Scream
            });
            return db.collection('likes').where('screamId', '==', screamId).get();
            })
            .then((data) => {
            data.forEach((doc) => {
                batch.delete(db.doc(`/likes/${doc.id}`)); // delete likes by its Doc Id by the Scream
            });
            return db.collection('notifications').where('screamId', '==', screamId).get();
            })
            .then((data) => {
            data.forEach((doc) => {
                batch.delete(db.doc(`/notifications/${doc.id}`)); // delete notifications under this Scream
            });
            return batch.commit();
            })
            .catch(error => {
                console.error(error);
            })
 }); // end onScreamDelete

// https://baseurl.com/api/
// can return multiple routes
exports.api = functions.https.onRequest(app);