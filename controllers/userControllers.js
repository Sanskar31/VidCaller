const User= require('../models/User');
const bcrypt= require('bcryptjs');
const passport= require('passport');
const {ensureAuthenticated}= require('../config/auth');

exports.getLogin = (req,res,next) => {
    res.render('login', {
        isAuth: req.isAuthenticated()
    });
};

exports.getmyAccount = (req,res,next) => {
    res.render('account-details', {
        name: req.user.name,
        email: req.user.email,
        isAuth: req.isAuthenticated()
    });
};

exports.startCall= ensureAuthenticated, (req, res) =>{
    res.render('/', {
        isAuth: req.isAuthenticated()
    });
};

exports.postLogin= (req,res,next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/user/login',
        failureFlash: true
    })(req, res, next);
};

exports.getLogout = (req,res,next) => {
    req.logout();
    req.flash('success_msg', 'You have logged out!');
    res.redirect('/user/login');
};

exports.register= (req, res, next) => {
    const {name,email,password,confirmPassword}= req.body;
    let errors= [];

    //check req fields
    if(!name || !email || !password || !confirmPassword){
        errors.push({msg: 'Please fill in all fields'});
    }
    //check password match
    if(password!==confirmPassword){
        errors.push({msg:'Passwords do not match'});
    }
    //check pass length
    if(password.length<6){
        errors.push({msg: 'Password should be at least 6 characters long!'});
    }

    if(errors.length>0){
        res.render('login', {
            errors,
            name,
            email,
            password,
            confirmPassword,
            isAuth: false
        });
    }
    else{
        //validation passed
        User.findOne({email: email})
            .then(user => {
                if(user){
                    //user exists
                    errors.push({msg: 'Email already registered!'});
                    res.render('login', {
                        errors,
                        name,
                        email,
                        password,
                        confirmPassword,
                        isAuth: false
                    });
                }
                else{
                    //create new user
                    const newUser= new User({
                        name,
                        email,
                        password
                    });

                    //Hash password
                    bcrypt.genSalt(12, (err, salt)=>{
                        bcrypt.hash(newUser.password, salt, (err, hash)  =>{
                            if(err) throw err;

                            newUser.password= hash;
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'Registration Successful!')
                                    res.redirect('/user/login');
                                })
                                .catch(err => console.log(err));
                        });
                    });
                }
            })
            .catch(err => console.log(err));
    }
};