const Room = require("../models/Room");

exports.getaboutUs = (req, res, next) => {
	res.render("about-us", {
		pageTitle: "About Us",
	});
};

exports.getHome = (req, res, next) => {
	res.render("home", {
		pageTitle: "Home",
	});
};

exports.joinRoom = (req, res, next) => {
	res.redirect(`/room/${req.body.roomId}`);
};

exports.getRoom = (req, res, next) => {
	const id = req.params.roomId;
	Room.findOne({
		id: id,
		roomExpiration: { $gt: Date.now() },
	})
		.then((room) => {
			if (!room) {
				req.flash("error_msg", "Invalid or expired Room ID!");
				return res.redirect("/");
			}
			return res.render("room", {
				roomId: id,
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};
