exports.getaboutUs = (req,res,next) => {
    res.render('about-us', {
        isAuth: req.isAuthenticated()
    });
};

exports.getHome = (req,res,next) => {
    res.render('home', {
        isAuth: req.isAuthenticated()
    });
};