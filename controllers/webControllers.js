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
