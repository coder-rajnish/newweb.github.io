const express = require('express')
const fileUpload = require('express-fileupload');
const path = require('path')
const cors = require('cors')
const app = express()
const passport = require('passport')
const session = require('express-session')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))
const PORT = process.env.PORT || 3000;

app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'thisismysecret',
     cookie: {
        maxAge: 1000 * 60 * 60 * 24 // Time is given to cookies in miliseconds for 24 hours
    }

}));
// Passport config
const passportInit = require('./app/config/passport')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())

app.set('views', path.join(__dirname, '/views'))
app.set('view engine', 'ejs')

app.use('/uploads',express.static('uploads'))
app.use((req,res,next)=>{
    res.locals.session =req.session,
    res.locals.user=req.user,
    next()
})
app.use(fileUpload())
require('./config/conn')
require('./routes/web')(app)

// to display npm startthat the route has not defined
app.use((req, res) => {
    res.status(404).send("ERROR 404 !Page not found")
})

app.listen(PORT, () => {
    console.log(`server is runnig at ${PORT}`)
})