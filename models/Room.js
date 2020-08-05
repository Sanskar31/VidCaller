const mongoose = require("mongoose");
const ms = require("ms");

const roomSchema = new mongoose.Schema({
	id: {
		type: String,
		required: true,
	},
	date: {
		type: Date,
		default: Date.now,
	},
	roomExpiration: Date,
	createdAt: Date,
});

roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
