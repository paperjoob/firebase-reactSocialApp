// takes a string parameter - check if string is empty
const isEmpty = (string) => {
    if (string.trim() === '') {
        return true
    } else {
        return false;
    }
}; // end isEmpty

// checks if email is valid
const isEmail = (email) => {
    // checks for pattern of an email
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(emailRegEx)) {
        return true;
    } else {
        return false;
    }
}

exports.validatesSignUpData = (data) => {
    let errors = {};

    // if the email is empty
    if (isEmpty(data.email)) {
        errors.email = "Email must not be empty.";
    } else if (!isEmail(data.email)) { // check if a valid email
        errors.email = "Must be a valid email address.";
    }

    // checks if the password field is empty
    if (isEmpty(data.password)) {
        errors.password = "Password must not be empty.";
    }
    // checks password and confirmPassword
    if (data.password !== data.confirmPassword) {
        errors.confirmPassword = "Passwords must match."
    }
    if (isEmpty(data.handle)) {
        errors.handle = "Handle must not be empty.";
    }

    // if there are errors in the object, break and return the errors
    // a boolean either true or false if there are errors
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}; // end validatesSignUpData

// Begin Login Data
exports.validateLoginData = (data) => {
    let errors = {};

    if (isEmpty(data.email)) {
        errors.email = "Email must not be empty.";
    };
    if (isEmpty(data.password)) {
        errors.password = "Password must not be empty.";
    };

    // if there are errors in the object, break and return the errors
    // a boolean either true or false if there are errors
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}; // end validateLoginData