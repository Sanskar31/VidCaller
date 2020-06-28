//All imports
const express= require('express');
const path= require('path');
const bodyParser = require('body-parser');
const mongoose= require('mongoose');
const flash= require('connect-flash');
const session= require('express-session');
const passport= require('passport');

const app= express();

//Passport config
require('./config/passport')(passport);

//DB Config
const db= require('./config/keys').MongoURI;

//Connect to Mongo
mongoose.connect(db, { useNewUrlParser: true })
    .then(() => console.log('MongoDB Connected!'))
    .catch(err => console.log(err));

//Setting View Engine
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static(path.join(__dirname, 'public')));

//Import routes
const userRoutes = require('./routes/userRoutes');
const webRoutes= require('./routes/webRoutes');

//Express sessions
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
}));

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//connect flash
app.use(flash());

//Global vars
app.use((req,res,next)=>{
    res.locals.success_msg= req.flash('success_msg');
    res.locals.error_msg= req.flash('error_msg');
    res.locals.error= req.flash('error');
    next();
});

app.use('/user',userRoutes);
app.use(webRoutes);

app.use((req,res,next) => {
    res.status(404).render("error-404", {
        isAuth: req.isAuthenticated()
    });
});

app.listen(3000, ()=> {
    console.log('Connected To Port 3000!');
});