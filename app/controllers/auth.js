require('dotenv').config()

const modelSchema = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const nodemailer = require("nodemailer");
const {
    model
} = require('mongoose')
const {
    render
} = require('ejs')

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USERNAME,
        pass: process.env.PASSWORD,
    }
});


function authController() {
    const _getRedirectUrl = (req) => {
        return req.user.role === 'Admin' ? '/adminhome' : '/'
    }
    return {
        forget(req, res) {
            res.render('forget')
        },
        async postforget(req, res) {
            const email = req.body.email
            console.log(email)
            await modelSchema.findOne({
                email: email
            }, (err, docs) => {
                if (err) {
                    console.log("error")
                    res.redirect('/forget')
                }
                const {
                    email
                } = docs

                const token = jwt.sign({
                    email,
                }, 'secret', {
                    expiresIn: '20m'
                });
                var mail = {
                    from: "noreply <no reply@gmail.com>", // sender address
                    to: email, // list of receivers
                    subject: "PASSWORD RESET", // Subject line
                    html: `<h2>Please click on the given link to RESET THE PASSWORD</h2>
                        <p>http://localhost:3000/forgetPassword/${token}</p>

                    `, // html body

                }
                transporter.sendMail(mail, (err, result) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("Password Reset Link Sent Successfully")
                        res.rdirect('/login')
                    }
                })
            })
            res.render('login')
        },
        forgetPassword(req, res) {
            const token = req.params.token
            if (token) {
                jwt.verify(token, 'secret', (err, decodeToken) => {
                    if (err) {
                        console.log(err)
                        res.redirect('/forget')
                    }
                    const {
                        email
                    } = decodeToken
                    res.render('forgetPassword', {
                        email: email
                    })
                })
            }
            res.redirect('/forget')
        },

        async postforgetPassword(req, res) {
            const {
                email,
                pass1,
                pass2
            } = req.body
            if (pass1 == pass2) {
                await modelSchema.findOne({
                    email: email
                }, async(err, docs) => {
                    if (err) {
                        res.redirect('/forget')
                    }
                    const hashPassword = await bcrypt.hash(pass1, 10);
                    console.log(docs.password)

                    docs.password = hashPassword
                    console.log(hashPassword)
                    docs.save();
                    console.log(docs.password)
                    var mail = {
                        from: "roreply@google.com",
                        to: email,
                        subject: "Password Changed Successfully",
                        html: `<h1>New Password ${pass1}</h1>`
                    }
                    transporter.sendMail(mail, (err, result) => {
                        if (err) {
                            console.log(err)
                            res.redirect('/forget')
                        }
                        console.log("Password Changed Successfully")
                        res.redirect('/login')
                    })



                })
            }

            res.redirect('/login')
        },
        login(req, res) {

            res.render('login')
        },
        logout(req, res) {
            req.logout()
            return res.redirect('/login')
        },

        postlogin(req, res, next) {
            const {
                email,
                pass1
            } = req.body;
            passport.authenticate('local', (err, user, info) => {
                if (err) {
                    console.log(info.message)
                    return next(err);
                }
                if (!user) {
                    console.log(info.message)
                    res.redirect('/login')
                }
                req.logIn(user, (err) => {
                    if (err) {
                        console.log(info.message)
                      
                        return next(err);
                    }

                    res.redirect(_getRedirectUrl(req))
                });
            })(req, res, next);

        },
        register(req, res) {
            res.render('register')
        },
     
        async postregister(req, res) {
            try {
                const {
                    name,
                    email,
                    role,
                    pass1,
                    pass2
                } = req.body;

                if (pass1 != pass2) {
                    console.log("Password doesnot Match")
                    res.redirect('/register')
                }


                // Hashed Password

                const hashPassword = await bcrypt.hash(pass1, 10)

                const token = jwt.sign({
                    name,
                    email,
                    role,
                    hashPassword
                }, 'secret', {
                    expiresIn: '20m'
                });
                var mail = {
                    from: "noreply <no reply@gmail.com>", // sender address
                    to: email, // list of receivers
                    subject: "Email Verification", // Subject line

                    html: `<h2>Please click on the given link to activate the account</h2>
                        <p>http://localhost:3000/auth/${token}</p>
                    `, // html body

                }
                transporter.sendMail(mail, (err, result) => {
                    if (err) {
                        console.log(err)


                    } else {
                        console.log("Verification Email Sent Successfully")
                        res.rdirect('/login')
                    }
                })

            } catch (err) {
                console.log(err)
                res.render('register')
            }
        },

        activateAccount(req, res) {
            try {
                const {
                    token
                } = req.params;
                console.log(token)
                if (token) {
                    jwt.verify(token, 'secret', (err, decodeToken) => {
                        if (err) {
                            return res.status(400).json({
                                error: "Incorrect or Expired link."
                            })

                        }
                        const {
                            name,
                            email,
                            role,
                            hashPassword
                        } = decodeToken;
                        console.log(role)
                        modelSchema.exists({
                            email: email
                        }, (err, result) => {
                            if (result) {
                                console.log("User Already Exists")
                                return res.redirect('login')
                            }
                            let user = new modelSchema({
                                name: name,
                                email: email,
                                role: role,
                                password: hashPassword
                            })
                            user.save().then((result) => {
                                console.log("user Saved Successfully")
                                return res.render('login')
                            }).catch((err) => {
                                console.log(err);
                                return res.render('register')
                            })

                        })
                    })
                }
            } catch (e) {
                console.log(e)
            }


        },
       
    }
}

module.exports = authController