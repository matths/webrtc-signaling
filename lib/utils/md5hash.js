const crypto = require("crypto");

var exports = module.exports = function md5hash (str) {
	return crypto.createHash('md5').update(str).digest("hex");
}
