let puppeteer  = require('puppeteer');

module.exports = function (devices) {
	if (!Array.isArray(devices)) {
		if (devices) {
			devices = [devices];
		} else {
			devices = [];
		}
	}

	if (!devices.length) {
		console.info("ℹ Choosing default Browser \x1b[32m\"Chrome Browser\"");
		devices.push({ type: "chrome", emulate: null });
	} else {
		devices = devices.map(item => {
			if (item === "chrome") {
				return { type: "chrome", emulate: null };
			} else if (item === "firefox") {
				return { type: "firefox", emulate: null };
			} else if (typeof(item) === "string") {
				if (item.match(/^(chrome|ch|c)\:/)) {
					item = item.replace(/^.*?\:/, '');
					if (!(item in puppeteer.devices)) {
						console.warn("\x1b[31;1m‼\x1b[0;33m Device ignored - unknown name \x1b[32m\"" + item + "\"");
						return null;
					}
					return { type: "chrome", emulate: item };
				} else if (item.match(/^(firefox|ff|f)\:/)) {
					item = item.replace(/^.*?\:/, '');
					if (!(item in puppeteer.devices)) {
						console.warn("\x1b[31;1m‼\x1b[0;33m Device ignored - unknown name \x1b[32m\"" + item + "\"");
						return null;
					}
					return { type: "firefox", emulate: item };
				} else {
					if (!(item in puppeteer.devices)) {
						console.warn("\x1b[31;1m‼\x1b[0;33m Device ignored - unknown name \x1b[32m\"" + item + "\"");
						return null;
					} else {
						return { type: "chrome", emulate: item };
					}
				}
			} else if (item && typeof(item) === "object") {
				let device = { type: "chrome" };
				if (item.options) device.options = item.options;
				if (item.emulate) {
					if (typeof(item.emulate) === "string" && (item.emulate in puppeteer.devices)) {
						device.emulate = item.emulate;
					} else {
						console.warn("Unknown Device for Emulation [", item.emulate, "]");
					}
				}
				if (item.type) {
					if (typeof(item.type) === "string") {
						if (item.type.match(/^(firefox|ff|f)\:/)) {
							device.type = "firefox";
						} else if (item.type.match(/^(chrome|ch|c)\:/)) {
							device.type = "chrome";
						} else {
							console.warn("Device Type Ignored, Device type unknown [", item.type, "]");
						}
					} else {
						console.warn("Device Type Ignored, Device type should be a String [", item.type, "]");
					}
				}
				return device;
			} else {
				console.warn("\x1b[31;1m‼\x1b[0;33m Device ignored - config \x1b[31m{" + item + "}");
				return null;
			}
		}).filter(item => item);
	}

	return devices;
};