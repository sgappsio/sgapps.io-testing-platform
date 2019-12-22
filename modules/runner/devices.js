let puppeteer  = Application.NodeInterface().require('puppeteer');

module.exports = function (devices) {
	if (!Array.isArray(devices)) {
		if (devices) {
			devices = [devices];
		} else {
			devices = [];
		}
	}

	if (!devices.length) {
		console.info("ℹ Choosing default Browser \033[32m\"Chrome Browser\"");
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
						console.warn("\033[31;1m‼\033[0;33m Device ignored - unknown name \033[32m\"" + item + "\"");
						return null;
					}
					return { type: "chrome", emulate: item };
				} else if (item.match(/^(firefox|ff|f)\:/)) {
					item = item.replace(/^.*?\:/, '');
					if (!(item in puppeteer.devices)) {
						console.warn("\033[31;1m‼\033[0;33m Device ignored - unknown name \033[32m\"" + item + "\"");
						return null;
					}
					return { type: "firefox", emulate: item };
				} else {
					if (!(item in puppeteer.devices)) {
						console.warn("\033[31;1m‼\033[0;33m Device ignored - unknown name \033[32m\"" + item + "\"");
						return null;
					} else {
						return { type: "chrome", emulate: item };
					}
				}
			} else {
				console.warn("\033[31;1m‼\033[0;33m Device ignored - config \033[31m{" + item + "}");
				return null;
			}
		}).filter(item => item);
	}

	return devices;
}