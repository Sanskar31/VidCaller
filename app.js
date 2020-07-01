//All imports
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const csrf = require("csurf");
const multer = require("multer");
const uniqid = require("uniqid");

const app = express();

//Passport config
require("./config/passport")(passport);

//DB Config
const db = require("./config/keys").MongoURI;

//Initialize csrf protection
const csrfProtection = csrf();

//config file object
const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "images");
	},
	filename: (req, file, cb) => {
		cb(null, uniqid("", "-" + file.originalname));
	},
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === "image.png" ||
		file.mimetype === "image/jpg" ||
		file.mimetype === "image/jpeg"
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

//Connect to Mongo
mongoose
	.connect(db, { useNewUrlParser: true })
	.then(() => console.log("MongoDB Connected!"))
	.catch((err) => console.log(err));

//Setting View Engine
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static(path.join(__dirname, "public")));
app.use("/user", express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
	multer({
		storage: fileStorage,
		fileFilter: fileFilter,
	}).single("profilePicture")
);

//Import routes
const userRoutes = require("./routes/userRoutes");
const webRoutes = require("./routes/webRoutes");

//Express sessions
app.use(
	session({
		secret: "secret",
		resave: true,
		saveUninitialized: true,
	})
);

//csrf protection
app.use(csrfProtection);

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//connect flash
app.use(flash());

//Global vars
app.use((req, res, next) => {
	res.locals.csrfToken = req.csrfToken();
	res.locals.isAuth = req.isAuthenticated();
	res.locals.success_msg = req.flash("success_msg");
	res.locals.error_msg = req.flash("error_msg");
	res.locals.error = req.flash("error");
	next();
});

app.use("/user", userRoutes);
app.use(webRoutes);

app.use((req, res, next) => {
	res.status(404).render("error-404", {
		pageTitle: "Page Not Found",
	});
});

app.listen(3000, () => {
	console.log("Connected To Port 3000!");
});
