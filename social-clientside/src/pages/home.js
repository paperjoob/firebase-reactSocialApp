import React, { Component } from 'react';
import axios from 'axios';

import Scream from '../components/Scream';

// MUI
import Grid from '@material-ui/core/Grid';

class Home extends Component {

    state = {
        screams: null // an initial value of null
    }

    componentDidMount() {
        axios.get('/screams')
            .then(result => {
                this.setState({
                    screams: result.data
                })
            })
            .catch(error => {
                console.log(error);
            })
    }; // end component Did Mount
    
    render() {

        // show screams if not null or else show loading
        let recentScreamsMarkUp = this.state.screams ? (
        this.state.screams.map(scream => <Scream scream={scream} />)
        ) : <p>Loading...</p>;

        return (
            <div>
                <Grid container spacing={16}>
                    <Grid item sm={8} xs={12}>
                        {recentScreamsMarkUp}
                    </Grid>
                    <Grid item sm={4} xs={12}>
                        <p>Profile</p>
                    </Grid>
                </Grid>
            </div>
        )
    }
}

export default Home;