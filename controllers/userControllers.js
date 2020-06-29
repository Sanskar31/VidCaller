const User= require('../models/User');
const bcrypt= require('bcryptjs');
const passport= require('passport');
const {ensureAuthenticated}= require('../config/auth');
const crypto= require('crypto');
const nodemailer= require('nodemailer');
const sendgridTransport= require('nodemailer-sendgrid-transport');

const transporter= nodemailer.createTransport(sendgridTransport({
    auth:{
        api_key: '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'
    }
}));

exports.getLogin = (req,res,next) => {
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    res.render('login', {
        pageTitle: 'Login'
    });
};

exports.getmyAccount = (req,res,next) => {
    res.render('account-details', {
        pageTitle: 'My Account',
        name: req.user.name,
        email: req.user.email
    });
};

exports.startCall= ensureAuthenticated, (req, res) =>{
    res.render('home', {
        pageTitle: 'Home'
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
            pageTitle: 'Login',
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
                        pageTitle: 'Login',
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
                                    return res.redirect('/user/login');
                                })
                                .then(result => {
                                    transporter.sendMail({
                                        to: newUser.email,
                                        from: 'sanskaragarwal05@gmail.com',
                                        subject: 'Welcome to VidCaller',
                                        html: `
                                            <h1>You Successfully Signed Up!</h1>
                                            <p>Start Using VidCaller Now For Free!</p>
                                        `
                                    });
                                })
                                .catch(err => console.log(err));
                        });
                    });
                }
            })
            .catch(err => console.log(err));
    }
};

exports.getReset= (req,res,next) => {
    var email= req.body.email;
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            return res.redirect('/user/login');
        }
        const token= buffer.toString('hex');
        User.findOne({email: email})
            .then((user) => {
                if(!user){
                    let errors= [];
                    errors.push({msg: 'No user with that Email Found!'});
                    return res.render('login', {
                        pageTitle: 'Login',
                        errors,
                        isAuth: false
                    });
                }
                user.resetToken= token;
                user.resetTokenExpiration= Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                req.flash('success_msg', 'Password reset link sent to the registered email!');
                res.redirect('/user/login');
                transporter.sendMail({
                    to: email,
                    from: 'sanskaragarwal05@gmail.com',
                    subject: 'Reset Password Request',
                    html: `
                        <h1>Reset Password Link</h1>
                        <p>You requested for password reset!</p>
                        <p>If the request was not made by you then ignore this email.</p>
                        <p><a href="http://localhost:3000/user/reset-password/${token}" target="_blank">Click this link to reset password!</a></p>
                    `
                });
            })
            .catch(err => console.log(err));
    });
};

exports.getResetPassword= (req,res,next) => {
    const token= req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
        .then(user => {
            if(!user){
                let errors= [];
                errors.push({msg: 'Password Reset Failed! Maybe the link was old!'});
                return res.render('login', {
                    pageTitle: 'Reset Password',
                    errors,
                    isAuth: false
                });
            }
            res.render('reset-password', {
                pageTitle: 'Reset Password',
                email: user.email,
                passwordToken: token
            });
        })
        .catch(err => console.log(err));
};

exports.newPassword= (req,res,next) => {
    const newPassword= req.body.password;
    const confirmPassword= req.body.confirmPassword;
    const email= req.body.email;
    const passwordToken= req.body.passwordToken;

    if(newPassword!==confirmPassword){
        req.flash('error_msg', 'Passwords do not match!');
        let url= '/user/reset-password/'+passwordToken;
        res.redirect(url);
    }
    else if(newPassword.length<6){
        req.flash('error_msg', 'Length of password should be atlest 6 characters!');
        let url= '/user/reset-password/'+passwordToken;
        res.redirect(url);
    }
    else{
        let resetUser;
        User.findOne({resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}, email:email})
        .then(user => {
            if(!user){
                let errors= [];
                errors.push({msg: 'The reset link is incorrect or expired!'});
                return res.render('login', {
                    pageTitle: 'Login',
                    errors,
                    isAuth: false
                });
            }
            resetUser= user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPass => {
            resetUser.password= hashedPass;
            resetUser.resetToken= undefined;
            resetUser.resetTokenExpiration= undefined;
            return resetUser.save();
        })
        .then(result => {
            req.flash('success_msg', 'Password Reset Successful!');
            res.redirect('/user/login');
        })
        .catch(err => console.log(err));
    }
};