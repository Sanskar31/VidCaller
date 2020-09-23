const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

//load user model
const User = require("../models/User");

module.exports = function (passport) {
	passport.use(
		new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
			//find user
			User.findOne({ email: email })
				.then((user) => {
					if (!user) {
						return done(null, false, {
							message: "That email is not registered!",
						});
					}
					//match password
					bcrypt.compare(password, user.password, (err, isMatch) => {
						if (err) throw err;

						if (isMatch) {
							return done(null, user);
						} else {
							return done(null, false, {
								message: "Password is incorrect!",
							});
						}
					});
				})
				.catch((err) => {
					const error = new Error(err);
					error.httpStatusCode = 500;
					return next(error);
				});
		})
	);

	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});
};
