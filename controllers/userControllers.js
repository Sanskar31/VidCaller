const User = require("../models/User");
const Room = require("../models/Room");

const bcrypt = require("bcryptjs");
const passport = require("passport");
const { ensureAuthenticated } = require("../config/auth");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const uniqid = require("uniqid");
const ms = require("ms");

const transporter = nodemailer.createTransport(
	sendgridTransport({
		auth: {
			api_key:
				"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",
		},
	})
);

exports.getLogin = (req, res, next) => {
	if (req.isAuthenticated()) {
		return res.redirect("/");
	}
	res.render("login", {
		pageTitle: "Login",
	});
};

exports.getmyAccount = (req, res, next) => {
	res.render("account-details", {
		pageTitle: "My Account",
		name: req.user.name,
		email: req.user.email,
		imageUrl: req.user.imageUrl,
	});
};

// (exports.startCall = ensureAuthenticated),
// 	(req, res) => {
// 		res.render("home", {
// 			pageTitle: "Home",
// 		});
// 	};

exports.startCall = (req, res, next) => {
	if (!req.isAuthenticated()) {
		req.flash("error_msg", "You need to Login first!");
		return res.redirect("/user/login");
	}
	const roomId = uniqid();
	const newRoom = new Room({
		id: roomId,
		roomExpiration: Date.now() + ms("1h"),
	});
	newRoom
		.save()
		.then((result) => {
			return res.redirect(`/room/${roomId}`);
		})
		.catch((err) => console.log(err));
};

exports.postLogin = (req, res, next) => {
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/user/login",
		failureFlash: true,
	})(req, res, next);
};

exports.getLogout = (req, res, next) => {
	req.logout();
	req.flash("success_msg", "You have logged out!");
	res.redirect("/user/login");
};

exports.register = (req, res, next) => {
	const { name, email, password, confirmPassword } = req.body;
	let errors = [];

	//check req fields
	if (!name || !email || !password || !confirmPassword) {
		errors.push({ msg: "Please fill in all fields" });
	}
	//check password match
	if (password !== confirmPassword) {
		errors.push({ msg: "Passwords do not match" });
	}
	//check pass length
	if (password.length < 6) {
		errors.push({ msg: "Password should be at least 6 characters long!" });
	}

	if (errors.length > 0) {
		res.render("login", {
			pageTitle: "Login",
			errors,
			name,
			email,
			password,
			confirmPassword,
			isAuth: false,
		});
	} else {
		//validation passed
		User.findOne({ email: email })
			.then((user) => {
				if (user) {
					//user exists
					errors.push({ msg: "Email already registered!" });
					res.render("login", {
						pageTitle: "Login",
						errors,
						name,
						email,
						password,
						confirmPassword,
						isAuth: false,
					});
				} else {
					//create new user
					const newUser = new User({
						name,
						email,
						password,
					});

					//Hash password
					bcrypt.genSalt(12, (err, salt) => {
						bcrypt.hash(newUser.password, salt, (err, hash) => {
							if (err) throw err;

							newUser.password = hash;
							newUser
								.save()
								.then((user) => {
									req.flash("success_msg", "Registration Successful!");
									return res.redirect("/user/login");
								})
								.then((result) => {
									transporter.sendMail({
										to: newUser.email,
										from: "sanskaragarwal05@gmail.com",
										subject: "Welcome to VidCaller",
										html: `
                                            <h1>You Successfully Signed Up!</h1>
                                            <p>Start Using VidCaller Now For Free!</p>
                                        `,
									});
								})
								.catch((err) => console.log(err));
						});
					});
				}
			})
			.catch((err) => console.log(err));
	}
};

exports.getReset = (req, res, next) => {
	var email = req.body.email;
	crypto.randomBytes(32, (err, buffer) => {
		if (err) {
			return res.redirect("/user/login");
		}
		const token = buffer.toString("hex");
		User.findOne({ email: email })
			.then((user) => {
				if (!user) {
					req.flash("error_msg", "No User with that Email found!");
					return -1;
				}
				user.resetToken = token;
				user.resetTokenExpiration = Date.now() + ms("1h");
				return user.save();
			})
			.then((result) => {
				if (result === -1) {
					return res.redirect("/user/login");
				}
				req.flash(
					"success_msg",
					"Password reset link sent to the registered email!"
				);
				res.redirect("/user/login");
				transporter.sendMail({
					to: email,
					from: "sanskaragarwal05@gmail.com",
					subject: "Reset Password Request",
					html: `
                        <h1>Reset Password Link</h1>
                        <p>You requested for password reset!</p>
                        <p>If the request was not made by you then ignore this email.</p>
                        <p><a href="http://localhost:3000/user/reset-password/${token}" target="_blank">Click this link to reset password!</a></p>
                    `,
				});
			})
			.catch((err) => console.log(err));
	});
};

exports.getResetPassword = (req, res, next) => {
	const token = req.params.token;
	User.findOne({
		resetToken: token,
		resetTokenExpiration: { $gt: Date.now() },
	})
		.then((user) => {
			if (!user) {
				req.flash(
					"error_msg",
					"Password Reset Failed! Maybe the link has expired!"
				);
				return res.redirect("/user/login");
			}
			res.render("reset-password", {
				pageTitle: "Reset Password",
				email: user.email,
				passwordToken: token,
			});
		})
		.catch((err) => console.log(err));
};

exports.newPassword = (req, res, next) => {
	const newPassword = req.body.password;
	const confirmPassword = req.body.confirmPassword;
	const email = req.body.email;
	const passwordToken = req.body.passwordToken;

	if (newPassword !== confirmPassword) {
		req.flash("error_msg", "Passwords do not match!");
		let url = "/user/reset-password/" + passwordToken;
		res.redirect(url);
	} else if (newPassword.length < 6) {
		req.flash("error_msg", "Length of password should be atlest 6 characters!");
		let url = "/user/reset-password/" + passwordToken;
		res.redirect(url);
	} else {
		let resetUser;
		User.findOne({
			resetToken: passwordToken,
			resetTokenExpiration: { $gt: Date.now() },
			email: email,
		})
			.then((user) => {
				if (!user) {
					req.flash("error_msg", "Reset link is invalid or expired!");
					return res.redirect("/user/login");
				}
				resetUser = user;
				return bcrypt.hash(newPassword, 12);
			})
			.then((hashedPass) => {
				resetUser.password = hashedPass;
				resetUser.resetToken = undefined;
				resetUser.resetTokenExpiration = undefined;
				return resetUser.save();
			})
			.then((result) => {
				req.flash("success_msg", "Password Reset Successful!");
				res.redirect("/user/login");
			})
			.catch((err) => console.log(err));
	}
};

exports.updateProfile = (req, res, next) => {
	const image = req.file;
	if (!image) {
		req.flash(
			"error_msg",
			"Invalid File Type (Only jpg, png, jpeg supported)!"
		);
		return res.redirect("/user/my-account");
	}
	const imageUrl = image.path;
	const user = req.user;
	user.imageUrl = imageUrl;
	user
		.save()
		.then((result) => {
			req.flash("success_msg", "Profile Picture Updated!");
			return res.redirect("/user/my-account");
		})
		.catch((err) => console.log(err));
};
