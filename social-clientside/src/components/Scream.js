import React, { Component } from 'react';
import {Link} from 'react-router-dom';

// MUI STUFF
import withStyles from '@material-ui/core/styles/withStyles';
import PropTypes from 'prop-types';
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import { Typography } from '@material-ui/core';

const styles = {
    card: {
        display: 'flex',
        marginBottom: 20
    },
    image: {
        minWidth: 200
    },
    content: {
        padding: 25,
        objectFit: 'cover'
    }
}; // end styles

class Scream extends Component {
    render() {
        const {classes, 
            scream: {body, createdAt, userImage, userHandle, screamId, likeCount, commentCount}
        } = this.props;

        return (
            <div>
                <Card className={classes.card}>
                    <CardMedia image={userImage} title="Profile Image" className={classes.image} />
                    <CardContent className={classes.content}>
                        <Typography variant="h5" component={Link} to={`/users/${userHandle}`} color="primary" >{userHandle}</Typography>
                        <Typography variant="body2" color="textSecondary">{createdAt}</Typography>
                        <Typography variant="body1">{body}</Typography>
                        <Typography variant="body2">{likeCount}</Typography>
                    </CardContent>
                </Card>
            </div>
        )
    }
};

Scream.propTypes = {
    classes: PropTypes.object.isRequired,
  };

export default  withStyles(styles) (Scream);
