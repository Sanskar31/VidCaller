module.exports = {
    ensureAuthenticated: (req, res, next) => {
        if(req.isAuthenticated()){
            return next();
        }
        req.flash('error_msg', 'Please Log In To Continue!');
        res.redirect('/users/login');
    }
};