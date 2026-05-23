const bwipjs = require("bwip-js");

const generateBarcodeBuffer = async (text, options = {}) => {
	if (!text) return null;

	return bwipjs.toBuffer({
		bcid: options.bcid || "code128",
		text: String(text),
		scale: options.scale || 3,
		height: options.height || 10,
		includetext: false,
		textxalign: "center",
		backgroundcolor: "FFFFFF",
	});
};

module.exports = {
	generateBarcodeBuffer,
};
