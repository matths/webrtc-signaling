const crypto = require("crypto");

var exports = module.exports = function uniqueId() {
	// return crypto.randomBytes(3*4).toString('base64');
	return crypto.randomBytes(16).toString("hex");
}
