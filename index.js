global.ApplicationPrototype = require('application-prototype').application;
global.ApplicationBuilder   = require('application-prototype').builder;
const puppeteer = require('puppeteer');

/**
 * @typedef {import('puppeteer').Browser} PuppeteerInstance
 */

//  /**
//  * @constructs TestingScenario
//  */
function TestingScenario() {
	let _headless   = true;
	let _name       = "";
	let _verbose    = false;
	/**
	 * Indicates if Browser should run in headless mode
	 * @param {Boolean} [isHeadLess] if parameter is not passed function will return current `isHeadLess` value
	 * @returns {TestingScenario}
	 */
	this.isHeadLess = function (isHeadLess) {
		if (typeof(isHeadLess) === "boolean") {
			_headless = isHeadLess;
			return this;
		}
		return _headless;
	};

	/**
	 * Indicates if tests should run in verbose mode
	 * @param {Boolean} [isHeadLess] if parameter is not passed function will return current `isVerbose` value
	 * @returns {TestingScenario}
	 */
	this.isVerbose = function (isVerbose) {
		if (typeof(isVerbose) === "boolean") {
			_verbose = isVerbose;
			return this;
		}
		return _verbose;
	};

	/**
	 * Specify or get Current Scenario Name
	 * @param {String} [name] if parameter is not passed function will return current `name`
	 * @returns {TestingScenario}
	 */
	this.ScenarioName = function (name) {
		if (name && typeof(name) === "string") {
			_name = name;
			return this;
		}
		return _name;
	};

	this.operations = (function () {
		let list    = [];
		let methods = {
			push : function (operation) {
				if (Array.isArray(operation)) {
					operation.forEach(item => methods.push(item));
				} else {
					operation.labels = operation.labels || [];
					operation.message = operation.message || '';
					list.push(operation);
				}
			},
			last : function () {
				return list[list.length - 1] || null
			},
			list : function () {
				return list.map(operation => operation)
			}
		};

		return methods;
	})();


	/**
	 * Select from instance a page with specific index
	 * @param {PuppeteerInstance}
	 * @param {(Number|'next'|'prev'|String)} [index=(instance.currentPage._getLabelName || 0)] Page's index or 'next', 'prev', 'last' or 'first' or pages label
	 * @returns {Promise<PuppeteerPage>} Pupperters page
	 */
	this._getPage = function (instance, index) {
		index = ( typeof(index) === "number" ? index : ( (instance.currentPage || {})._getLabelName || 0 ) );

		if (index === 'first') {
			index = 0;
		} else if (index === 'next') {
			if (typeof(index) === "number") {
				index = index + 1;
			} else {
				return Promise.reject(Error('Unable to increment page index...'));
			}
		} else if (index === 'prev') {
			if (typeof(index) === "number" && index) {
				index = index - 1;
			} else {
				return Promise.reject(Error('Unable to decrement page index...'));
			}
		};


		return new Promise((resolve, reject) => {
			instance.pages()
				.then(function (pages) {
					let page;
					if (index === 'last') {
						index = pages.length - 1;
					} else if (typeof(index) === "number") {
						page = pages[index];
					} else if (typeof(index) === "string") {
						page = pages.find(page => {
							return page._getLabelName === index;
						})
					}
					if (page) {
						instance.currentPage = page;
						resolve(page);
					} else if (!index) {
						instance.newPage().then(function (page) {
							page._getLabelName = 'page-'
								+ new Date().valueOf().toString(36)
								+ '-'
								+ Math.floor(Math.random() * 1E6 + 1E6).toString(36);
							instance.currentPage = page;
							resolve(page);
						}, reject);
					}
				}, reject).catch(reject);
		});
	};

	return this;
};

/**
 * Select from instance a page with specific index
 * @param {(Number|'next'|'prev'|String)} [index=(instance.currentPage._getLabelName || 0)] Page's index or 'next', 'prev', 'last' or 'first' or pages label
 * @returns {TestingScenario}
 */
TestingScenario.prototype.getPage = function (index) {
	let _self = this;
	_self.operations.push({
		name      : 'getPage',
		params    : arguments,
		operation : function (instance) {
			return _self._getPage(instance, index);
		}
	});

	return this;
}

/**
 * @typedef {Object} TestingScenarioSetViewportOptions
 * @property {Number} [width] device width in pixels. Default value is `1920`
 * @property {Number} [height] device height in pixels. Default value is `1080`
 * @property {Number} [deviceScaleFactor] Device Scale Factor. Default value is `1`
 * @property {Boolean} [hasTouch] Emulate touch instead of click. Default value is `false`
 * @property {Boolean} [isLandscape] is device in landscape mode. Default value is `true`
 * @property {isMobile} [isMobile] is mobile device. Default value is `false`
 */

/**
 * Applying specific viewport for device
 * @param {TestingScenarioSetViewportOptions} options
 * @returns {TestingScenario}
 */
TestingScenario.prototype.setViewport = function (options) {
	let _self = this;
	_self.operations.push({
		name      : 'setViewport',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(function (page) {
					page.setViewport({
						width: options.width || 1920,
						height: options.height || 1080,
						deviceScaleFactor: options.deviceScaleFactor || 1,
						hasTouch: !!options.hasTouch,
						isLandscape: ( options.isLandscape !== undefined ? (!!options.isLandscape) : true ),
						isMobile: !!options.isMobile
					}).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};

/**
 * @typedef {Object} TestingScenarioGotoOptions
 * @property {('load'|'domcontentloaded'|'networkidle0'|'networkidle2')} [waitUntil] When to consider navigation succeeded, defaults to `'load'`. Given an array of event strings, navigation is considered to be successful after all events have been fired. Default value is `'domcontentloaded'`
 * @property {Number} [timeout] Maximum navigation time in milliseconds, defaults to 30 seconds, pass 0 to disable timeout. The default value can be changed by using the page.setDefaultNavigationTimeout(timeout) or page.setDefaultTimeout(timeout) methods. Default value is `30`
 * @property {String} [referer] Referer header value. If provided it will take preference over the referer header value set by page.setExtraHTTPHeaders().
 */

/**
 * Opens an URL
 * @param {String} url URL to navigate page to. The url should include scheme, e.g. https://.
 * @param {TestingScenarioGotoOptions} [options] Navigation parameters
 * @returns {TestingScenario}
 */
TestingScenario.prototype.goto = function (url, options) {
	options = options || {};
	options.waitUntil = options.waitUntil || 'domcontentloaded';

	let _self = this;
	_self.operations.push({
		name      : 'goto',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(function (page) {
					page.goto(
						url,
						options
					).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};

/**
 * wait a priod of specified miliseconds
 * @param {Number} timeMs number of miliseconds
 * @returns {TestingScenario}
 */
TestingScenario.prototype.wait = function (timeMs) {
	this.operations.push({
		name      : 'wait',
		params    : arguments,
		operation : function () {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve();
				}, ( timeMs || 0 ));
			});
		}
	});

	return this;
};

/**
 * Wait until a page will reach an event
 * @param {('close'|'console'|'dialog'|'domcontentloaded'|'error'|'frameattached'|'framedetached'|'framenavigated'|'load'|'metrics'|'pageerror'|'popup'|'request'|'requestfailed'|'requestfinished'|'response'|'workercreated'|'workerdestroyed')} eventName
 * @param {function(any): Promise} [handler] a function that can execute specific operations with data obtained on event
 * @returns {TestingScenario}
 */
TestingScenario.prototype.pageEventWait = function (eventName, handler) {
	let _self = this;
	_self.operations.push({
		name      : 'pageEventWait',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					page.on(eventName, function (data) {
						if (handler) {
							handler(data).then(resolve, reject);
						} else {
							resolve();
						}
					});
				}, reject);
			});
		}
	});

	return this;
};

/**
 * add a files to input[type="file"] in instance's page
 * @param {String[]} files list of file paths to be added to input
 * @param {String} selector CSS Selector used to identify input[type="file"]
 * @returns {TestingScenario}
 */
TestingScenario.prototype.waitForFileChooser = function (files, selector) {
	let _self = this;
	_self.operations.push({
		name      : 'waitForFileChooser',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					Promise.all([
						page.waitForFileChooser(),
						page.click(selector)
					]).then(results => {
						let fileChooser = results[0];

						fileChooser
							.accept(files)
							.then(resolve, reject);
					}, reject);
				}, reject);
			});
		}
	});

	return this;
};


/**
 * @typedef {Object} TestingScenarioWaitForFunctionOptions
 * @property {('raf'|'polling'|'mutation')} [polling] An interval at which the pageFunction is executed, defaults to `'raf'`. If polling is a number, then it is treated as an interval in milliseconds at which the function would be executed. If polling is a string, then it can be one of the following values:
    - `raf` - to constantly execute pageFunction in requestAnimationFrame callback. This is the tightest polling mode which is suitable to observe styling changes.
    - `mutation` - to execute pageFunction on every DOM mutation.
 * @property {Number} [timeout] maximum time to wait for in milliseconds, Defaults to `30000` (30 seconds). Pass 0 to disable timeout.
 */
/**
 * wait until browser will pageFunction will return true value
 * @param {String|Function} pageFunction Function to be evaluated in browser context
 * @param {TestingScenarioWaitForFunctionOptions} options Optional waiting parameters
 * @returns {TestingScenario}
 */
TestingScenario.prototype.waitForFunction = function (pageFunction, options) {
	options = options || {};
	options.polling = options.polling || 'raf';
	let _self = this;
	_self.operations.push({
		name      : 'waitForFunction',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					page.waitForFunction(pageFunction, options).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};

/**
 * @typedef {Object} TestingScenarioWaitForNavigationOptions
 * @property {('load'|'domcontentloaded'|'networkidle0'|'networkidle2')} [waitUntil] When to consider navigation succeeded, defaults to `'load'`. Given an array of event strings, navigation is considered to be successful after all events have been fired. Events can be either:

- `load` - consider navigation to be finished when the load event is fired.
- `domcontentloaded` - consider navigation to be finished when the DOMContentLoaded event is fired.
- `networkidle0` - consider navigation to be finished when there are no more than 0 network connections for at least 500 ms.
- `networkidle2` - consider navigation to be finished when there are no more than 2 network connections for at least 500 ms.
 *
 * @property {Number} [timeout] maximum time to wait for in milliseconds, Defaults to `30000` (30 seconds). Pass 0 to disable timeout.
 */
/**
 * wait specific navigation state
 * @param {TestingScenarioWaitForNavigationOptions} options Optional waiting parameters
 * @returns {TestingScenario}
 */
TestingScenario.prototype.waitForNavigation = function (options) {
	options = options || {};
	let _self = this;
	_self.operations.push({
		name      : 'waitForNavigation',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					page.waitForNavigation(options).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};


/**
 * @typedef {Object} TestingScenarioWaitForSelectorOptions
 * @property {Boolean} [visible] wait for element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.
 * @property {Boolean} [hidden] wait for element to not be found in the DOM or to be hidden, i.e. have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.
 * @property {Number} [timeout] maximum time to wait for in milliseconds, Defaults to `30000` (30 seconds). Pass 0 to disable timeout.
 */
/**
 * Wait for the selector to appear in page. If at the moment of calling the method the selector already exists, the method will return immediately. If the selector doesn't appear after the timeout milliseconds of waiting, the function will throw.
 * @param {String} selector A selector of an element to wait for
 * @param {TestingScenarioWaitForSelectorOptions} options Optional waiting parameters
 * @returns {TestingScenario}
 */
TestingScenario.prototype.waitForSelector = function (selector, options) {
	options = options || {};
	let _self = this;
	_self.operations.push({
		name      : 'waitForSelector',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					page.waitForSelector(selector, options).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};

/**
 * @typedef {Object} TestingScenarioWaitForXPathOptions
 * @property {Boolean} [visible] wait for element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.
 * @property {Boolean} [hidden] wait for element to not be found in the DOM or to be hidden, i.e. have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.
 * @property {Number} [timeout] maximum time to wait for in milliseconds, Defaults to `30000` (30 seconds). Pass 0 to disable timeout.
 */
/**
 * Wait for the xpath to appear in page. If at the moment of calling the method the xpath already exists, the method will return immediately. If the xpath doesn't appear after the timeout milliseconds of waiting, the function will throw.
 * @param {String} xpath A xpath of an element to wait for
 * @param {TestingScenarioWaitForXPathOptions} options Optional waiting parameters
 * @returns {TestingScenario}
 */
TestingScenario.prototype.waitForXPath = function (xpath, options) {
	options = options || {};
	let _self = this;
	_self.operations.push({
		name      : 'waitForXPath',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					page.waitForXPath(xpath, options).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};

/**
 * Handle User agent of instance
 * @param {function (userAgent:String): Promise} handler if parameter is present will handle UserAgent value
 * @returns {TestingScenario}
 */
TestingScenario.prototype.userAgent = function (handler) {
	let _self = this;
	_self.operations.push({
		name      : 'userAgent',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				let promise = instance.userAgent();
				promise.then(function (value) {
					handler(value).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};


/**
 * Clears all permission overrides for the browser context.
 * @returns {TestingScenario}
 */
TestingScenario.prototype.clearPermissionOverrides = function () {
	let _self = this;
	_self.operations.push({
		name      : 'clearPermissionOverrides',
		params    : arguments,
		operation : function (instance) {
			return instance.defaultBrowserContext().clearPermissionOverrides();
		}
	});

	return this;
};

/**
 * @typedef {('geolocation'|'midi'|'midi-sysex'|'notifications'|'push'|'camera'|'microphone'|'background-sync'|'ambient-light-sensor'|'accelerometer'|'gyroscope'|'magnetometer'|'accessibility-events'|'clipboard-read'|'clipboard-write'|'payment-handler')} TestingScenarioInstancePermissions
 */
/**
 * Override permissions for the browser context.
 * @param {String} origin The origin to grant permissions to, e.g. "https://example.com".
 * @param {TestingScenarioInstancePermissions[]} permissions An array of permissions to grant. All permissions that are not listed here will be automatically denied.
 * @returns {TestingScenario}
 */
TestingScenario.prototype.overridePermissions = function (origin, permissions) {
	let _self = this;
	_self.operations.push({
		name      : 'overridePermissions',
		params    : arguments,
		operation : function (instance) {
			return instance.defaultBrowserContext().overridePermissions(origin, permissions);
		}
	});

	return this;
};

/**
 * @typedef {Object} TestingScenarioPageCloseOptions
 * @property {Boolean} runBeforeUnload Defaults to `false`. Whether to run the before unload page handlers.
 */
/**
 * Close a page from instance
 * @param {TestingScenarioPageCloseOptions} [options] set of options
 * @param {String} [index] page's index
 * @returns {TestingScenario}
 */
TestingScenario.prototype.pageClose = function (options, index) {
	let _self = this;
	_self.operations.push({
		name      : 'pageClose',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance, index)
					.then(page => {
						page.close(options).then(resolve, reject);
					}, reject);
			});
		}
	});

	return this;
};

/**
 * Set page label, for easier selecting using .getPage(label)
 * @param {String} label label that will be set on current page
 * @returns {TestingScenario}
 */
TestingScenario.prototype.pageSetLabel = function (label) {
	let _self = this;
	_self.operations.push({
		name      : 'pageSetLabel',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance)
					.then(page => {
						page._getLabelName = label;
						resolve();
					}, reject);
			});
		}
	});

	return this;
};

/**
 * When to consider navigation succeeded, defaults to load. Given an array of event strings, navigation is considered to be successful after all events have been fired. Events can be either:

- `load` - consider navigation to be finished when the load event is fired.
- `domcontentloaded` - consider navigation to be finished when the DOMContentLoaded event is fired.
- `networkidle0` - consider navigation to be finished when there are no more than 0 network connections for at least 500 ms.
- `networkidle2` - consider navigation to be finished when there are no more than 2 network connections for at least 500 ms.

 * @typedef {('load'|'domcontentloaded'|'networkidle0'|'networkidle2')} TestingScenarioPageReloadOptionsWaitUntil
 */
/**
 * @typedef {Object} TestingScenarioPageReloadOptions
 * @property {Number} timeout Maximum navigation time in milliseconds, defaults to `30` seconds, pass `0` to disable timeout.
 * @property {(TestingScenarioPageReloadOptionsWaitUntil|TestingScenarioPageReloadOptionsWaitUntil[])} waitUntil When to consider navigation succeeded, defaults to load. Given an array of event strings, navigation is considered to be successful after all events have been fired. Events can be either:

- `load` - consider navigation to be finished when the load event is fired.
- `domcontentloaded` - consider navigation to be finished when the DOMContentLoaded event is fired.
- `networkidle0` - consider navigation to be finished when there are no more than 0 network connections for at least 500 ms.
- `networkidle2` - consider navigation to be finished when there are no more than 2 network connections for at least 500 ms.
 */
/**
 * Close a page from instance
 * @param {String} index page's index
 * @param {TestingScenarioPageReloadOptions} options set of options
 * @returns {TestingScenario}
 */
TestingScenario.prototype.pageReload = function (index, options) {
	let _self = this;
	_self.operations.push({
		name      : 'pageReload',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance, index)
					.then(page => {
						page.reload(options).then(resolve, reject);
					}, reject);
			});
		}
	});

	return this;
};

/**
 * Handle User agent of instance
 * @param {function (userAgent:String): void} handler if parameter is present will handle UserAgent value
 * @returns {(TestingScenario|Promise<String>)}
 */
TestingScenario.prototype.pageContent = function (handler) {
	let _self = this;
	_self.operations.push({
		name      : 'pageContent',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance)
					.then(page => {
						page.content().then(
							content => {
								handler(content).then(resolve, reject);
							}, reject
						);
					}, reject);
			});
		}
	});

	return this;
};

/**
 * @typedef {Object} TestingScenarioClickOnSelectorOptions
 * @property {("left"|"right"|"middle")} button Defaults to `left`.
 * @property {Number} clickCount defaults to `1`.
 * @property {Number} delay Time to wait between mousedown and mouseup in milliseconds. Defaults to `0`.
 */
/**
 * This method fetches an element with selector, scrolls it into view if needed, and then uses page.mouse to click in the center of the element. If there's no element matching selector, the method throws an error.
 * @param {String} selector A selector to search for element to click. If there are multiple elements satisfying the selector, the first will be clicked.
 * @param {TestingScenarioClickOnSelectorOptions} options Optional parameters
 * @returns {TestingScenario}
 */
TestingScenario.prototype.clickOnSelector = function (selector, options) {
	options = options || {};
	let _self = this;
	_self.operations.push({
		name      : 'clickOnSelector',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					page.click(selector, options).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};

/**
 * @typedef {Object} TestingScenarioTypeOnSelectorOptions
 * @property {Number} delay Time to wait between key presses in milliseconds. Defaults to 0.
 */
/**
 * Sends a `keydown`, `keypress/input`, and `keyup` event for each character in the text.
 * @param {String} selector A selector of an element to type into. If there are multiple elements satisfying the selector, the first will be used.
 * @param {String} text A text to type into a focused element.
 * @param {TestingScenarioTypeOnSelectorOptions} options Optional parameters
 * @returns {TestingScenario}
 */
TestingScenario.prototype.typeOnSelector = function (selector, text, options) {
	options = options || {};
	let _self = this;
	_self.operations.push({
		name      : 'typeOnSelector',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					page.type(selector, text, options).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};



/**
 * This method fetches an element with `selector`, scrolls it into view if needed, and then uses `page.touchscreen` to tap in the center of the element. If there's no element matching `selector`, the method throws an error.
 * @param {String} selector A selector to search for element to tap. If there are multiple elements satisfying the selector, the first will be tapped.
 * @returns {TestingScenario}
 */
TestingScenario.prototype.tapOnSelector = function (selector) {
	let _self = this;
	_self.operations.push({
		name      : 'tapOnSelector',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					page.tap(selector).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};

/**
 * This method fetches an element with `selector` and focuses it. If there's no element matching `selector`, the method throws an error.
 * @param {String} selector A selector of an element to focus. If there are multiple elements satisfying the selector, the first will be focused.
 * @returns {TestingScenario}
 */
TestingScenario.prototype.focusOnSelector = function (selector) {
	let _self = this;
	_self.operations.push({
		name      : 'focusOnSelector',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					page.focus(selector).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};

/**
 * This method fetches an element with `selector`, scrolls it into view if needed, and then uses page.mouse to hover over the center of the element. If there's no element matching `selector`, the method throws an error.
 * @param {String} selector A selector to search for element to hover. If there are multiple elements satisfying the selector, the first will be hovered.
 * @returns {TestingScenario}
 */
TestingScenario.prototype.hoverOnSelector = function (selector) {
	let _self = this;
	_self.operations.push({
		name      : 'hoverOnSelector',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					page.hover(selector).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};

/**
 * If the function passed to the page.evaluate returns a non-Serializable value, then page.evaluate resolves to undefined. DevTools Protocol also supports transferring some additional values that are not serializable by JSON: -0, NaN, Infinity, -Infinity, and bigint literals.
 * @param {(function(Object):any|String)} pageFunction Function to be evaluated in the page context
 * @param {function(result):Promise} [handler] function that receives serializable data from `pageFunction`
 * @param {Object} [variables={}] context passed to `pageFunction`
 * @returns {TestingScenario}
 */
TestingScenario.prototype.evaluate = function (pageFunction, handler, variables, meta) {
	meta = meta || {};
	let _self = this;
	_self.operations.push({
		name      : meta.name || 'evaluate',
		params    : meta.args || arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					page.evaluate(pageFunction, (variables || {})).then(
						(result) => {
							if (!handler) {
								resolve();
							} else {
								handler(result).then(resolve, reject);
							}
						},
						reject
					);
				}, reject);
			});
		}
	});

	return this;
};

/**
 * If the function passed to the page.evaluate returns a non-Serializable value, then page.evaluate resolves to undefined. DevTools Protocol also supports transferring some additional values that are not serializable by JSON: -0, NaN, Infinity, -Infinity, and bigint literals.
 *
 * @example <caption>Example usage of string `pageFunction`.</caption>
 * test.evaluateOnSelectorAll('a[href]', 'element.click()');
 *
 * @example <caption>Example usage of string `pageFunction` with `handler`</caption>
 * test.evaluateOnSelectorAll('input[type="text"]', 'element.value', function (value) {
 *     console.log(value);
 * });
 *
 * @example <caption>Example usage of string `pageFunction` and `context`</caption>
 * test.evaluateOnSelectorAll('input[type="email"]', 'element.value = value', 'user.email@example.com');
 *
 * @example <caption>Example usage of string `pageFunction` with handler and `context`</caption>
 * test.evaluateOnSelectorAll('input[type="checkbox"]', 'element.value = value; element.checked', function (isChecked) {
 *     console.log('isChecked')
 * } 'On');
 *
 * @example <caption>Example usage of `pageFunction`.</caption>
 * test.evaluateOnSelectorAll('a[href]', function (element) { element.click() });
 *
 * @example <caption>Example usage of `pageFunction` with `handler`</caption>
 * test.evaluateOnSelectorAll(
 *     'input[type="text"]',
 *     function (element) {
 *         return element.value;
 *     }, function (value) {
 *         console.log(value);
 *     }
 * );
 *
 * @example <caption>Example usage of `pageFunction` and `context`</caption>
 * test.evaluateOnSelectorAll(
 *     'input[type="email"]',
 *     function (element, value) {
 *         element.value = value;
 *     },
 *     'user.email@example.com'
 * );
 *
 * @example <caption>Example usage of `pageFunction` with handler and `context`</caption>
 * test.evaluateOnSelectorAll(
 *     'input[type="checkbox"]',
 *     function (element, value) {
 *         element.value = value;
 *         return element.checked;
 *     },
 *     function (isChecked) {
 *         console.log('isChecked');
 *     },
 *     'On'
 * );
 *
 * @param {String} selector A selector for an selecting element
 * @param {Function|String} pageFunction Function to be evaluated in the page context
 * @param {function(result):Promise} [handler] function that receives serializable data from `pageFunction`, this parameter can be skipped
 * @param {*} [value] context passed to `pageFunction`
 * @returns {TestingScenario}
 */
TestingScenario.prototype.evaluateOnSelectorAll = function (selector, pageFunction, handler, value) {
	if (!value && typeof(handler) !== "function") {
		value = handler;
		handler = null;
	}

	if (typeof(pageFunction) === "string") {
		pageFunction = 'function (element, value, index, arr) { return eval("' + escape(pageFunction) + '"); }';
	} else {
		pageFunction = pageFunction.toString();
	}

	let wrapper = function (variables) {
		var nodes = Array.prototype.slice.call(
			document.querySelectorAll(variables.selector)
		);
		var value = variables.value;
		var pageFunction;
		eval('pageFunction = ' + variables.pageFunction);

		return nodes.map(function (element, index, arr) {
			return pageFunction(element, value, index, arr);
		});
	};

	this.evaluate(wrapper, handler, {
		selector: selector,
		value: value,
		pageFunction: pageFunction
	},
	{
		name : 'evaluateOnSelectorAll',
		args : arguments
	});
};

/**
 * Similar with evaluateOnSelectorAll but throws an error if detected more than one element
 *
 * @param {String} selector A selector for an selecting element
 * @param {Function|String} pageFunction Function to be evaluated in the page context
 * @param {function(result):Promise} [handler] function that receives serializable data from `pageFunction`, this parameter can be skipped
 * @param {*} [value] context passed to `pageFunction`
 * @returns {TestingScenario}
 */
TestingScenario.prototype.evaluateOnSelectorOnlyOne = function (selector, pageFunction, handler, value) {
	if (!value && typeof(handler) !== "function") {
		value = handler;
		handler = null;
	}

	if (typeof(pageFunction) === "string") {
		pageFunction = 'function (element, value, index, arr) { return eval("' + escape(pageFunction) + '"); }';
	} else {
		pageFunction = pageFunction.toString();
	}

	let wrapper = function (variables) {
		var nodes = Array.prototype.slice.call(
			document.querySelectorAll(variables.selector)
		);
		var value = variables.value;
		var pageFunction;
		eval('pageFunction = ' + variables.pageFunction);

		return nodes.map(function (element, index, arr) {
			if (index) throw Error('Detected more than one element with selector ["' + variables.selector + '"]');
			return pageFunction(element, value, index, arr);
		});
	};

	this.evaluate(wrapper, handler, {
		selector: selector,
		value: value,
		pageFunction: pageFunction
	},
	{
		name : 'evaluateOnSelectorOnlyOne',
		args : arguments
	});
};

/**
 * @typedef {Object} TestingScenarioPageEmulateConfigViewport
 * @property {Number} width  page width in pixels.
 * @property {Number} height  page height in pixels.
 * @property {Number} deviceScaleFactor  Specify device scale factor (can be thought of as dpr). Defaults to 1.
 * @property {Boolean} isMobile  Whether the meta viewport tag is taken into account. Defaults to false.
 * @property {Boolean} hasTouch Specifies if viewport supports touch events. Defaults to false
 * @property {Boolean} isLandscape  Specifies if viewport is in landscape mode. Defaults to false.
 */
/**
 * @typedef {Object} TestingScenarioPageEmulateConfig
 * @property {TestingScenarioPageEmulateConfigViewport} viewport viewport options
 * @property {String} userAgent user agent definition
 */
/**
 * @typedef {("Blackberry PlayBook"|"Blackberry PlayBook landscape"|"BlackBerry Z30"|"BlackBerry Z30 landscape"|"Galaxy Note 3"|"Galaxy Note 3 landscape"|"Galaxy Note II"|"Galaxy Note II landscape"|"Galaxy S III"|"Galaxy S III landscape"|"Galaxy S5"|"Galaxy S5 landscape"|"iPad"|"iPad landscape"|"iPad Mini"|"iPad Mini landscape"|"iPad Pro"|"iPad Pro landscape"|"iPhone 4"|"iPhone 4 landscape"|"iPhone 5"|"iPhone 5 landscape"|"iPhone 6"|"iPhone 6 landscape"|"iPhone 6 Plus"|"iPhone 6 Plus landscape"|"iPhone 7"|"iPhone 7 landscape"|"iPhone 7 Plus"|"iPhone 7 Plus landscape"|"iPhone 8"|"iPhone 8 landscape"|"iPhone 8 Plus"|"iPhone 8 Plus landscape"|"iPhone SE"|"iPhone SE landscape"|"iPhone X"|"iPhone X landscape"|"iPhone XR"|"iPhone XR landscape"|"JioPhone 2"|"JioPhone 2 landscape"|"Kindle Fire HDX"|"Kindle Fire HDX landscape"|"LG Optimus L70"|"LG Optimus L70 landscape"|"Microsoft Lumia 550"|"Microsoft Lumia 950"|"Microsoft Lumia 950 landscape"|"Nexus 10"|"Nexus 10 landscape"|"Nexus 4"|"Nexus 4 landscape"|"Nexus 5"|"Nexus 5 landscape"|"Nexus 5X"|"Nexus 5X landscape"|"Nexus 6"|"Nexus 6 landscape"|"Nexus 6P"|"Nexus 6P landscape"|"Nexus 7"|"Nexus 7 landscape"|"Nokia Lumia 520"|"Nokia Lumia 520 landscape"|"Nokia N9"|"Nokia N9 landscape"|"Pixel 2"|"Pixel 2 landscape"|"Pixel 2 XL"|"Pixel 2 XL landscape")} TestingScenarioPageEmulateDeviceName
 */

/**
 * @typedef {Object} TestingScenarioPageEmulateDeviceConfig
 * @property {("chrome"|"firefox"|"ch"|"c"|"ff"|"f")} [type] Browser Type Firefox or Chrome, Default value is `"chrome"`
 * @property {TestingScenarioPageEmulateDeviceName} [emulate] emulate device name, if not set will run as in simple browser, Default value is `null`.
 * @property {TestingScenarioPageEmulateDeviceConfigOptions} [options] Browser's options, Set of configurable options to set on the browser.
 */

/**
 * @typedef {Object} TestingScenarioPageEmulateCallbackResult
 * @property {Error[]} _errors errors emitted during test
 * @property {Number}  _skipped number of operations that were skipped in test, cause can be an emitted error
 * @property {Number}  _warns number of operations that got warnings
 * @property {Number}  _failed number of operations that failed
 * @property {TestingScenarioPageEmulateDeviceConfigOptions[]} _fallenDevices list if devices that failed test
 */

/**
 * @callback TestingScenarioPageEmulateCallback
 * @param {TestingScenarioPageEmulateCallbackResult} result
 */

/**
 * @typedef {Object} TestingScenarioPageEmulateDeviceConfigOptions
 * @property {boolean} ignoreHTTPSErrors Whether to ignore HTTPS errors during navigation. Defaults to `false`.
 * @property {boolean} headless Whether to run browser in headless mode](https://developers.google.com/web/updates/2017/04/headless-chrome). Defaults to `true` unless the `devtools` option is `true`.
 * @property {string} executablePath Path to a Chromium or Chrome executable to run instead of the bundled Chromium. If `executablePath` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd).
 * @property {number} slowMo Slows down Puppeteer operations by the specified amount of milliseconds. Useful so that you can see what is going on.
 * @property {TestingScenarioSetViewportOptions} defaultViewport Sets a consistent viewport for each page. Defaults to an 800x600 viewport. `null` disables the default viewport.
 * @property {String[]} args Additional arguments to pass to the browser instance. The list of Chromium flags can be found [here](http://peter.sh/experiments/chromium-command-line-switches/).
 * @property {(boolean|String[])} ignoreDefaultArgs If `true`, then do not use [`puppeteer.defaultArgs()`](#puppeteerdefaultargs-options). If an array is given, then filter out the given default arguments. Dangerous option; use with care. Defaults to `false`.
 * @property {boolean} handleSIGINT Close the browser process on Ctrl-C. Defaults to `true`.
 * @property {boolean} handleSIGTERM Close the browser process on SIGTERM. Defaults to `true`.
 * @property {boolean} handleSIGHUP Close the browser process on SIGHUP. Defaults to `true`.
 * @property {number} timeout Maximum time in milliseconds to wait for the browser instance to start. Defaults to `30000` (30 seconds). Pass `0` to disable timeout.
 * @property {boolean} dumpio Whether to pipe the browser process stdout and stderr into `process.stdout` and `process.stderr`. Defaults to `false`.
 * @property {string} userDataDir Path to a [User Data Directory](https://chromium.googlesource.com/chromium/src/+/master/docs/user_data_dir.md).
 * @property {Object} env Specify environment variables that will be visible to the browser. Defaults to `process.env`.
 * @property {boolean} devtools Whether to auto-open a DevTools panel for each tab. If this option is `true`, the `headless` option will be set `false`.
 * @property {boolean} pipe Connects to the browser over a pipe instead of a WebSocket. Defaults to `false`.
 */
/**
 * Emulates specific configuration of device
 * @param {(TestingScenarioPageEmulateConfig|TestingScenarioPageEmulateDeviceName)} config 
 * @returns {TestingScenario}
 */
TestingScenario.prototype.pageEmulate = function (config) {
	let _self = this;
	if (typeof(config) === "string") {
		if (config in puppeteer.devices) {
			config = puppeteer.devices[config];
		} else {
			console.warn("Incorrect device name, choose one from: ", ...Object.keys(puppeteer.devices))
		}
	}
	_self.operations.push({
		name      : 'pageEmulate',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					page.emulate(config).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};

/**
 * Add a specific message to last operation
 * @param {String} message
 * @returns {TestingScenario}
 */
TestingScenario.prototype.message = function (message) {
	if (typeof(message) === "string") {
		this.operations.last().message = message;
	}
	return this;
};

/**
 * Add labels to operation
 * @param {String[]} labels
 * @returns {TestingScenario}
 */
TestingScenario.prototype.operationLabels = function (...labels) {
	let operation = this.operations.last()
	labels.filter(label => {
		return label && typeof(label) === "string";
	}).forEach(label => {
		if (operation.labels.indexOf(label) === -1) {
			operation.labels.push(label);
		}
	})
	return this;
};

/**
 * Remove labels from operation
 * @param {String[]} labels
 * @returns {TestingScenario}
 */
TestingScenario.prototype.operationLabelsRemove = function (...labels) {
	let operation = this.operations.last()
	labels.filter(label => {
		return label && typeof(label) === "string";
	}).forEach(label => {
		if (operation.labels.indexOf(label) !== -1) {
			operation.labels = operation.labels.filter(
				item => item !== label
			);
		}
	})
	return this;
};


/**
 * activate or deactivate operation by adding or removing operation label `"__Deactivated"`
 * @param {Boolean} status - if status is true than operation will be deactivated
 * @returns {TestingScenario}
 */
TestingScenario.prototype.deactivate = function (status) {
	if (typeof(status) === "boolean") {
		this.operationLabels('__Deactivated');
	}
	return this;
}

/**
 * Describe a section of testing scenario
 * @param {String} message the message that will describe the Scenario Section
 * @returns {TestingScenario}
 */
TestingScenario.prototype.describe = function (message) {
	this.wait();
	this.operationLabels('__Describe');
	this.message(message);

	return this;
}

/**
 * Close Describe section of testing scenario
 * @param {String} message message on succeed
 * @returns {TestingScenario}
 */
TestingScenario.prototype.describeClose = function (message) {
	this.wait();
	this.operationLabels('__DescribeClose');
	this.message(message);

	return this;
}

/**
 * Describe a group of testing scenario similar to `TestingScenario.describe`
 * @param {String} message the name of group the Scenario Section
 * @returns {TestingScenario}
 */
TestingScenario.prototype.group = function (message) {
	this.wait();
	this.operationLabels('__ScenarioGroup');
	this.message(message);

	return this;
}

/**
 * Close Group section of testing scenario
 * @param {String} message message on succeed
 * @returns {TestingScenario}
 */
TestingScenario.prototype.groupClose = function (message) {
	this.wait();
	this.operationLabels('__ScenarioGroupClose');
	this.message(message);

	return this;
}

/**
 * Inject other testing Scenario on specific step
 * @param {TestingScenario} Scenario
 */
TestingScenario.prototype.injectScenario = function (Scenario) {
	this.operations.push(Scenario.operations.list());
}

/**
 * @callback TestingScenarioItHandlerCallback
 * @param {Function} done - function that should be executed when check id done
 * @param {Function} evaluate - function executed in Browser's context that return an result
 * @param {import('./').assert} assert - assert API
 * @param {import('./').expect} expect - expect API
 */
/**
 * Assert some functionality from test
 * 
 * @example
 * 
 * test.goto('http://example.com')
 *    .describe('Testing Page')
 *        .describe('Testing Title')
 *            .it((done, evaluate, assert, expect) => {
 *                let title = evaluate('document.title');
 *                expect(title).to().be().eq('Page Title', 'default page title - message shown on error');
 *                done();
 *            })
 *        .describeClose()
 *        // check if using some browsers api
 *        .describe('Testing Title')
 *            .it(async (done, evaluate, assert, expect) => {
 *                let title = await evaluate(
 *                    () => {
 *                        return document.title
 *                    }
 *                );
 *                assert.isNotNull(title);
 *                done();
 *            })
 *        .describeClose()
 *    .describeClose()
 * 
 * @param {TestingScenarioItHandlerCallback} handler
 * @param {String} message
 * @returns {TestingScenario}
 */
TestingScenario.prototype.it = function (handler, message) {
	let _self = this;
	_self.operations.push({
		name      : 'it',
		message   : message || '',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					let evaluate = function (pageFunction, ...args) {
						return page.evaluate(pageFunction, ...args);
					};
					evaluate.toString = function () { return 'function () { }' };
					evaluate.toSource = function () { return 'function () { }' };
					let done = function (err) {
						if (err) {
							reject(err);
						} else {
							resolve();
						}
					};
					eval('handler = ' + handler.toString().replace('{', '{\ntry {').replace(/\}([^\}]*$)/, '} catch (err) { done(err) }\n}$1'));

					handler(
						done, evaluate, assert, expect
					);
				}, reject).catch(reject);
			});
		}
	});

	return this;
}

// .OperationJumpTo(OperationLabel);
// .OperationRun(OperationLabel); // run
// applyOnInstance(handler);
// applyOnPage(handler, pageIndex);

// page.cookies([...urls])
// page.deleteCookie(...cookies)
// page.emulate(options)
// page.setBypassCSP(enabled)
// page.setContent(html[, options])
// page.setDefaultNavigationTimeout(timeout)
// page.setGeolocation(options)
// page.setExtraHTTPHeaders(headers)
// page.setJavaScriptEnabled(enabled)
// page.setOfflineMode(enabled)
//? page.setRequestInterception(value)
//? page.setUserAgent(userAgent)

// page.isClosed() Boolean
// page.title() String
// page.url() String
// page.viewport() Object
// page.metrics()
/**
 *
    Timestamp <number> The timestamp when the metrics sample was taken.
    Documents <number> Number of documents in the page.
    Frames <number> Number of frames in the page.
    JSEventListeners <number> Number of events in the page.
    Nodes <number> Number of DOM nodes in the page.
    LayoutCount <number> Total number of full or partial page layout.
    RecalcStyleCount <number> Total number of page style recalculations.
    LayoutDuration <number> Combined durations of all page layouts.
    RecalcStyleDuration <number> Combined duration of all page style recalculations.
    ScriptDuration <number> Combined duration of JavaScript execution.
    TaskDuration <number> Combined duration of all tasks performed by the browser.
    JSHeapUsedSize <number> Used JavaScript heap size.
    JSHeapTotalSize <number> Total JavaScript heap size.

 */


/*
const puppeteer = require('puppeteer');
const iPhone = puppeteer.devices['iPhone 6'];

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  await page.emulate(iPhone);
  await page.goto('https://www.google.com');
  // other actions...
  await browser.close();
});
*/

// page.goBack([options])
// page.goForward([options])



// mouse.down
// mouse.move
// mouse.up
// mouse.click

// touchscreen.tap

// puppeteer.launch

// keyboard.*

// page.screenshot
// page.pdf

//? puppeteer.errors


/**
 * Fork or Clone Testing Scenario
 */
TestingScenario.prototype.fork = function () {
	let _scenario = new TestingScenario();

	_scenario.headless = this.headless;

	_scenario.operations.push(this.operations.list());

	return _scenario;
};

/**
 * Close device Instance
 */
TestingScenario.prototype.close = function () {
	let _self = this;

	_self.operations.push({
		name      : 'close',
		params    : arguments,
		operation : function (instance) {
			return instance.close();
		}
	});

	return this;
}

/**
 * Run your tests under specific environment
 * @param {(TestingScenarioPageEmulateCallback|TestingScenarioPageEmulateDeviceConfig|TestingScenarioPageEmulateDeviceName)} device
 * @param {(TestingScenarioPageEmulateCallback|TestingScenarioPageEmulateDeviceConfig|TestingScenarioPageEmulateDeviceName)} [device2]
 * @param {(TestingScenarioPageEmulateCallback|TestingScenarioPageEmulateDeviceConfig|TestingScenarioPageEmulateDeviceName)} [device3]
 * @param {(TestingScenarioPageEmulateCallback|TestingScenarioPageEmulateDeviceConfig|TestingScenarioPageEmulateDeviceName)} [device4]
 * @param {(TestingScenarioPageEmulateCallback|TestingScenarioPageEmulateDeviceConfig|TestingScenarioPageEmulateDeviceName)} [device5]
 * @param {(TestingScenarioPageEmulateCallback|TestingScenarioPageEmulateDeviceConfig|TestingScenarioPageEmulateDeviceName)} [device6]
 * @param {(TestingScenarioPageEmulateCallback|TestingScenarioPageEmulateDeviceConfig|TestingScenarioPageEmulateDeviceName)} [device7]
 * @param {(TestingScenarioPageEmulateCallback|TestingScenarioPageEmulateDeviceConfig|TestingScenarioPageEmulateDeviceName)} [device8]
 * @param {(TestingScenarioPageEmulateCallback|TestingScenarioPageEmulateDeviceConfig|TestingScenarioPageEmulateDeviceName)} [devices]
 */
TestingScenario.prototype.run = function (device, device2, device3, device4, device5, device6, device7, device8, ...otherDevices) {
	let _path = require('path');
	let _self = this;
	let _callbacks = [];
	let devices    = Array.prototype.slice.call(arguments);
	devices = devices.filter(device => {
		if (typeof(device) === "function") {
			_callbacks.push(device);
			return false;
		}
		return true;
	})
	new ApplicationBuilder({
		onready : async function () {
			let app = this;

			app.debugEnabled(true);
			app.consoleOptions({
				file: false,
				contextName: false
			})

			app.modulePath(
				'@constructors://'
			);
			let libLoader = await app.require('lib');
			libLoader();

			app.modulePath(_path.join(__dirname, 'modules'));

			let runner  = await app.require('runner');

			runner(devices, _self, function (result) {
				_callbacks.forEach(callback => {
					callback(result);
				});
			});
		}
	});
};


function AssertError(message, name) {
	if (this === global) return new AssertError(message, name);
	this.name    = name;
	this.message = message;
	this.stack   = '';

	return this;
}
AssertError.prototype = new Error;
/**
 * @param {*} expectValue 
 * @param {*} value 
 * @param {String} message 
 */
function assert(expectValue, value, message, isNegated, comparingFunction) {
	let logArguments = require('./modules/reporter').logArguments;
	let condition = (
		comparingFunction ? comparingFunction(expectValue, value) : ( expectValue === value )
	);
	if (isNegated) condition = !condition;

	message = message || "Assertion Error Message";
	message = message.replace('{{expectValue}}', logArguments([expectValue]) + '\x1b[31m')
	message = message.replace('{{value}}', logArguments([value]) + '\x1b[31m')

	if (!condition) {
		let err = Error('📌  \x1b[31;1mAssert Error\x1b[0;31m ' + message
			+ ';\x1b[0m\n\t\x1b[32;1m' + ( isNegated ? 'not ' : '' ) + 'expected value: \x1b[0m'
			+ logArguments([expectValue])
			+ '\n\t\x1b[33;1mcurrent value: \x1b[0m'
			+ logArguments([value])
		);

		err.stack = '';

		throw err;
	}
}

assert.equal = function (expectValue, value, message) {
	return new assert(expectValue, value, message, false, (a, b) => a == b);
}

assert.notEqual = function (expectValue, value, message) {
	return new assert(expectValue, value, message, false, (a, b) => a != b);
}

assert.strictEqual = function (expectValue, value, message) {
	return new assert(expectValue, value, message, false, (a, b) => a === b);
}

assert.notStrictEqual = function (expectValue, value, message) {
	return new assert(expectValue, value, message, false, (a, b) => a !== b);
}

assert.typeof = function (expectValue, value, message) {
	let logArguments = require('./modules/reporter').logArguments;
	return new assert(typeof(expectValue), value, (message || "Expect typeof " + logArguments(expectValue) + "\\33[31m to be {{value}}"), false, (a, b) => a === b);
}

assert.notTypeof = function (expectValue, value, message) {
	let logArguments = require('./modules/reporter').logArguments;
	return new assert(typeof(expectValue), value, (message || "Expect typeof " + logArguments(expectValue) + "\\33[31m not to be {{value}}"), false, (a, b) => a != b);
}

assert.lengthOf = function (expectValue, value, message) {
	let logArguments = require('./modules/reporter').logArguments;
	return new assert(expectValue.length, value, (message || "Expect length of " + logArguments(expectValue) + "\\33[31m to be {{value}}"), false);
}

assert.notLengthOf = function (expectValue, value, message) {
	let logArguments = require('./modules/reporter').logArguments;
	return new assert(expectValue.length, value, (message || "Expect length of " + logArguments(expectValue) + "\\33[31m not to be {{value}}"), false);
}

assert.isOk = function (expectValue, message) {
	let logArguments = require('./modules/reporter').logArguments;
	return new assert(!!expectValue, true, (message || "Expect " + logArguments(expectValue) + "\\33[31m is somehow {{value}}"), false);
}


assert.isNotOk = function (expectValue, message) {
	let logArguments = require('./modules/reporter').logArguments;
	return new assert(!!expectValue, false, (message || "Expect " + logArguments(expectValue) + "\\33[31m is somehow {{value}}"), false);
}

assert.isAtLeast = function (expectValue, value, message) {
	return new assert(
		expectValue,
		value,
		(message || "Expect {{expectValue}} is greater or equal to {{value}}"),
		false,
		(a, b) => { return a >= b }
	);
}

assert.isBelow = function (expectValue, value, message) {
	return new assert(
		expectValue,
		value,
		(message || "Expect {{expectValue}} is strictly less than {{value}}"),
		false,
		(a, b) => { return a < b }
	);
}

assert.isAtMost = function (expectValue, value, message) {
	return new assert(
		expectValue,
		value,
		(message || "Expect {{expectValue}} is less than or equal to {{value}}"),
		false,
		(a, b) => { return a < b }
	);
}


assert.isTrue = function (expectValue, message) {
	return new assert(
		expectValue,
		true,
		(message || "Expect {{expectValue}} is {{value}}")
	);
}


assert.isNotTrue = function (expectValue, message) {
	return new assert(
		expectValue,
		true,
		(message || "Expect {{expectValue}} is not {{value}}"),
		true
	);
}

assert.isFalse = function (expectValue, message) {
	return new assert(
		expectValue,
		false,
		(message || "Expect {{expectValue}} is {{value}}")
	);
}

assert.isNotFalse = function (expectValue, message) {
	return new assert(
		expectValue,
		false,
		(message || "Expect {{expectValue}} is not {{value}}"),
		true
	);
}

assert.isNull = function (expectValue, message) {
	return new assert(
		expectValue,
		null,
		(message || "Expect {{expectValue}} is {{value}}"),
		false
	);
}

assert.isNotNull = function (expectValue, message) {
	return new assert(
		expectValue,
		null,
		(message || "Expect {{expectValue}} is not {{value}}"),
		true
	);
}

/**
 * @class
 * @param {*} value
 */
function expect(value) {
	if (global === this) return new expect(value);
	this.value = value;
	return this;
};

/**
 * @returns {expectTo}
 */
expect.prototype.to = function () {
	return new expectTo(this.value);
};

/** @class */
function expectTo(value) { this.value = value; return this; };

/**
 * @returns {expectToBe}
 */
expectTo.prototype.be = function () {
	return new expectToBe(this.value);
};

/** @class */
function expectToBe(value) { this.value = value; return this; };

/**
 * @typedef {("string"|"number"|"boolean"|"function"|"object"|"array"|"null"|"NaN"|"NUMBER_FINITE"|"NUMBER_SAFE_INTEGER"|"INFINITY"|"POSITIVE_INFINITY"|"NEGATIVE_INFINITY")} ExpectedType
 */
/**
 * @name Expect.to.be.a
 * @param {ExpectedType} type
 * @param {String} message what to show wen conditions are not meet
 * @returns {expectValueDescribe}
 */
expectToBe.prototype.a = function (type, message, isNegated) {
	let value = this.value;
	let assertFunction = (expectValue, value, message) => {
		if (isNegated) message = message.replace("Expected to be ", "NotExpected to be ");
		return assert(expectValue, value, message, isNegated);
	}
	switch (type) {
		case "string":
		case "number":
		case "boolean":
		case "function":
		case "object":
			assertFunction(type, typeof(value), message || "Expected to be {{expectValue}} instead of {{value}}");
		break;
		case "array":
			assertFunction(true, Array.isArray(value), message || "Expected to be an Array");
		break;
		case "null":
			assertFunction(true, (value === null), message || "Expected to be an Array");
		break;
		case "NaN":
			assertFunction(true, (Number.isNaN(value)), message || "Expected to be a NaN");
		break;
		case "NUMBER_FINITE":
			assertFunction(true, (Number.isFinite(value)), message || "Expected to be a NaN");
		break;
		case "NUMBER_SAFE_INTEGER":
			assertFunction(true, (Number.isFinite(value)), message || "Expected to be a safe integer");
		break;
		case "INFINITY":
			assertFunction(true, (!Number.isFinite(value)), message || "Expected to be a number INFINITY");
		break;
		case "POSITIVE_INFINITY":
			assertFunction(true, (!Number.isFinite(value) && value > 0), message || "Expected to be a number POSITIVE_INFINITY");
		break;
		case "NEGATIVE_INFINITY":
			assertFunction(true, (!Number.isFinite(value) && value < 0), message || "Expected to be a number NEGATIVE_INFINITY");
		break;
	}
	return new expectValueDescribe(this.value); 
}

/**
 * @name Expect.to.be.notA
 * @param {ExpectedType} type
 * @param {String} message what to show wen conditions are not meet
 * @returns {expectValueDescribe}
 */
expectToBe.prototype.notA = function (type, message) {
	return expectToBe.prototype.a(type, message, true);
}

/**
 * @name Expect.to.be.instanceOf
 * @param {(Object|Error|*)} instanceType
 * @param {String} message what to show wen conditions are not meet
 * @returns {expectValueDescribe}
 */
expectToBe.prototype.instanceOf = function (instance, message) {
	assert(true, (this.value && (this.value instanceof instance)), message || "Expected to be instance of " + (instance + ''));
	return new expectValueDescribe(this.value);
}


//! TODO
/** @class */
function expectValueDescribe(value) { this.value = value; return this; };


TestingScenario.expect = function (value) {
	return new expect(value);
};
TestingScenario.assert = assert;

module.exports = TestingScenario;