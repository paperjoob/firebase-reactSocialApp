let db = {
    screams: [
        {
            userHandle: 'user',
            body: 'this is the scream body',
            createdAt: '2020-03-03T22:00:07.605Z',
            likeCount: 5,
            commentCount: 2
        }
    ]
};

const userDetails = {
    // Redux Data
    credentials: {
        userId: '35dgiosdh42iotwg',
        email: 'user@email.com',
        handle: 'user',
        createdAt: '2020-03-03T22:00:07.605Z',
        imageUrl: 'image/dsfhosdhfs/dsfsfs',
        bio: 'Hi, welcome!',
        location: 'London, UK'
    },
    likes: [
        {
            userHandle: 'User',
            screamId: '23kjgsdfs'
        },
        {
            userHandle: 'User2',
            screamId: 'ksdfssdss'
        }
    ],
    comments: [
        {
            userHandle: 'user',
            screamId: 'dsjfoweigjsdg',
            body: 'This is the body of the comment!',
            createdAt: '2020-03-03T22:00:07.605Z'
        }
    ]
};