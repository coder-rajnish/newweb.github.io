const LocalStrategy = require('passport-local').Strategy
const modelSchema = require('../models/user')
const bcrypt = require('bcrypt')

function init(passport) {
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'

    }, async (email, password, done) => {
        const user = await modelSchema.findOne({
            email: email
        })
        if (!user) {
            return done(null, false, {
                message: "No email found"
            })
        }
        bcrypt.compare(password, user.password).then(match => {
            if (match) {

                return done(null, user, {
                    message: "LoggedIn Successfully"
                })
            }

            return done(null, false, {
                message: "Wrong user name or Password"
            })
        }).catch(err => {
            return done(null, false, {
                message: "Something went Wrong"
            })
        })
    }))
    passport.serializeUser((user, done) => {
        return done(null, user._id)
    })

    passport.deserializeUser((id, done) => {
        modelSchema.findById(id, (err, user) => {
            return done(err, user);
        })
    })
}
module.exports = init