//@ts-ignore
global.ApplicationPrototype = require('application-prototype').application;
//@ts-ignore
global.ApplicationBuilder   = require('application-prototype').builder;
const SGAppsTestingAssert = require('./modules/libs/assert');
const SGAppsTestingExpect = require('./modules/libs/expect');
const logger = require('./modules/reporter').logger;
const puppeteer = require('puppeteer');

/***
 * @typedef {import('./index').Browser} Browser
 */
/***
 * @typedef {import('./index').Page} Page
 */

/**
 * @interface SGAppsTestingScenario
 */
function SGAppsTestingScenario() {
	let _headless   = true;
	let _name       = "";
	let _verbose    = false;
	/**
	 * @memberof SGAppsTestingScenario#
	 * @method setOption
	 * @param {'headless'|'verbose'} optionName
	 * @param {boolean} value
	 * @returns {SGAppsTestingScenario}
	 */
	this.setOption = function (optionName, value) {
		switch (optionName) {
			case 'headless':
				_headless = value;
			break;
			case 'verbose':
				_verbose = value;
			break;
			default:
				logger.warn(`Unknown option ${optionName}`);
			break;
		}
		return this;
	};

	/**
	 * @memberof SGAppsTestingScenario#
	 * @method getOption
	 * @param {'headless'|'verbose'} optionName
	 * @returns {boolean}
	 */
	this.getOption = function (optionName) {
		switch (optionName) {
			case 'headless':
				return _headless;
			case 'verbose':
				return _verbose;
			default:
				logger.warn(`Unknown option ${optionName}`);
				return undefined;
		}
	};

	/**
	 * Specify Current Scenario Name
	 * @method setScenarioName
	 * @memberof SGAppsTestingScenario#
	 * @param {string} [name] if parameter is not passed function will return current `name`
	 * @returns {SGAppsTestingScenario}
	 */
	this.setScenarioName = function (name) {
		if (name && typeof(name) === "string") {
			_name = name;
		}
		return this;
	};

	/**
	 * @method getScenarioName
	 * @memberof SGAppsTestingScenario#
	 * @returns {string}
	 */
	this.getScenarioName = function () {
		return _name;
	};

	/**
	 * @class
	 * @name SGAppsTestingScenarioOperations
	 */
	/**
	 * @typedef {object} SGAppsTestingScenarioOperation
	 * @memberof SGAppsTestingScenarioOperations
	 * @property {string} name
	 * @property {any[]} params
	 * @property {function(SGAppsTestingScenario): Promise} operation
	 */
	/**
	 * @memberof SGAppsTestingScenarioOperations
	 * @method push
	 * @param {SGAppsTestingScenarioOperation} operation
	 */
	/**
	 * @memberof SGAppsTestingScenarioOperations
	 * @method last
	 * @returns {SGAppsTestingScenarioOperations.SGAppsTestingScenarioOperation}
	 */
	/**
	 * @memberof SGAppsTestingScenarioOperations
	 * @method list
	 * @returns {SGAppsTestingScenarioOperations.SGAppsTestingScenarioOperation[]}
	 */
	/**
	 * @memberof SGAppsTestingScenario
	 * @var {SGAppsTestingScenarioOperations} operations
	 */
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
				return list[list.length - 1] || null;
			},
			list : function () {
				return list.map(operation => operation);
			}
		};

		return methods;
	})();


	/**
	 * Select from instance a page with specific index
	 * @memberof SGAppsTestingScenario#
	 * @method _getPage
	 * @param {Browser} instance
	 * @param {(number|'next'|'prev'|string)} [index=(instance.currentPage._getLabelName || 0)] Page's index or 'next', 'prev', 'last' or 'first' or pages label
	 * @returns {Promise<Page>} Puppeteers page
	 */
	this._getPage = function (instance, index) {
		//@ts-ignore
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
		}


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
							//@ts-ignore
							return page._getLabelName === index;
						});
					}
					if (page) {
						//@ts-ignore
						instance.currentPage = page;
						resolve(page);
					} else if (!index) {
						instance.newPage().then(function (page) {
							//@ts-ignore
							page._getLabelName = 'page-'
								+ new Date().valueOf().toString(36)
								+ '-'
								+ Math.floor(Math.random() * 1E6 + 1E6).toString(36);
							//@ts-ignore
							instance.currentPage = page;
							resolve(page);
						}, reject);
					}
				}, reject).catch(reject);
		});
	};

	return this;
}

/**
 * Select from instance a page with specific index
 * @memberof SGAppsTestingScenario#
 * @method getPage
 * @param {(number|'next'|'prev'|string)} [index=(instance.currentPage._getLabelName || 0)] Page's index or 'next', 'prev', 'last' or 'first' or pages label
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.getPage = function (index) {
	let _self = this;
	_self.operations.push({
		name      : 'getPage',
		params    : arguments,
		operation : function (instance) {
			return _self._getPage(instance, index);
		}
	});
	return this;
};

/**
 * @typedef {Object} SGAppsTestingScenarioSetViewportOptions
 * @memberof SGAppsTestingScenario
 * @property {number} [width] device width in pixels. Default value is `1920`
 * @property {number} [height] device height in pixels. Default value is `1080`
 * @property {number} [deviceScaleFactor] Device Scale Factor. Default value is `1`
 * @property {boolean} [hasTouch] Emulate touch instead of click. Default value is `false`
 * @property {boolean} [isLandscape] is device in landscape mode. Default value is `true`
 * @property {boolean} [isMobile] is mobile device. Default value is `false`
 */

/**
 * Applying specific viewport for device
 * @memberof SGAppsTestingScenario#
 * @method setViewport
 * @param {SGAppsTestingScenarioSetViewportOptions} options
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.setViewport = function (options) {
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
 * @typedef {Object} SGAppsTestingScenarioGotoOptions
 * @memberof SGAppsTestingScenario
 * @property {('load'|'domcontentloaded'|'networkidle0'|'networkidle2')} [waitUntil] When to consider navigation succeeded, defaults to `'load'`. Given an array of event strings, navigation is considered to be successful after all events have been fired. Default value is `'domcontentloaded'`
 * @property {Number} [timeout] Maximum navigation time in milliseconds, defaults to 30 seconds, pass 0 to disable timeout. The default value can be changed by using the page.setDefaultNavigationTimeout(timeout) or page.setDefaultTimeout(timeout) methods. Default value is `30`
 * @property {String} [referer] Referer header value. If provided it will take preference over the referer header value set by page.setExtraHTTPHeaders().
 */

/**
 * Opens an URL
 * @memberof SGAppsTestingScenario#
 * @method goto
 * @param {String} url URL to navigate page to. The url should include scheme, e.g. https://.
 * @param {SGAppsTestingScenarioGotoOptions} [options] Navigation parameters
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.goto = function (url, options) {
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
 * wait a period of specified milliseconds
 * @memberof SGAppsTestingScenario#
 * @method wait
 * @param {number} [timeMs=0] number of milliseconds
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.wait = function (timeMs) {
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
 * @memberof SGAppsTestingScenario#
 * @method pageEventWait
 * @param {('close'|'console'|'dialog'|'domcontentloaded'|'error'|'frameattached'|'framedetached'|'framenavigated'|'load'|'metrics'|'pageerror'|'popup'|'request'|'requestfailed'|'requestfinished'|'response'|'workercreated'|'workerdestroyed')} eventName
 * @param {function(any): Promise} [handler] a function that can execute specific operations with data obtained on event
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.pageEventWait = function (eventName, handler) {
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
 * @memberof SGAppsTestingScenario#
 * @method waitForFileChooser
 * @param {string[]} files list of file paths to be added to input
 * @param {string} selector CSS Selector used to identify input[type="file"]
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.waitForFileChooser = function (files, selector) {
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
 * @typedef {Object} SGAppsTestingScenarioWaitForFunctionOptions
 * @memberof SGAppsTestingScenario
 * @property {('raf'|'polling'|'mutation')} [polling] An interval at which the pageFunction is executed, defaults to `'raf'`. If polling is a number, then it is treated as an interval in milliseconds at which the function would be executed. If polling is a string, then it can be one of the following values:
    - `raf` - to constantly execute pageFunction in requestAnimationFrame callback. This is the tightest polling mode which is suitable to observe styling changes.
    - `mutation` - to execute pageFunction on every DOM mutation.
 * @property {number} [timeout] maximum time to wait for in milliseconds, Defaults to `30000` (30 seconds). Pass 0 to disable timeout.
 */
/**
 * wait until browser will pageFunction will return true value
 * @memberof SGAppsTestingScenario#
 * @method waitForFunction
 * @param {string|function} pageFunction Function to be evaluated in browser context
 * @param {SGAppsTestingScenarioWaitForFunctionOptions} options Optional waiting parameters
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.waitForFunction = function (pageFunction, options) {
	options = options || {};
	options.polling = options.polling || 'raf';
	let _self = this;
	_self.operations.push({
		name      : 'waitForFunction',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					//@ts-ignore
					page.waitForFunction(pageFunction, options).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};

/**
 * @typedef {Object} SGAppsTestingScenarioWaitForNavigationOptions
 * @memberof SGAppsTestingScenario
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
 * @memberof SGAppsTestingScenario#
 * @method waitForNavigation
 * @param {SGAppsTestingScenarioWaitForNavigationOptions} options Optional waiting parameters
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.waitForNavigation = function (options) {
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
 * @typedef {Object} SGAppsTestingScenarioWaitForSelectorOptions
 * @memberof SGAppsTestingScenario
 * @property {Boolean} [visible] wait for element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.
 * @property {Boolean} [hidden] wait for element to not be found in the DOM or to be hidden, i.e. have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.
 * @property {Number} [timeout] maximum time to wait for in milliseconds, Defaults to `30000` (30 seconds). Pass 0 to disable timeout.
 */
/**
 * Wait for the selector to appear in page. If at the moment of calling the method the selector already exists, the method will return immediately. If the selector doesn't appear after the timeout milliseconds of waiting, the function will throw.
 * @memberof SGAppsTestingScenario#
 * @method waitForSelector
 * @param {String} selector A selector of an element to wait for
 * @param {SGAppsTestingScenarioWaitForSelectorOptions} [options] Optional waiting parameters
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.waitForSelector = function (selector, options) {
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
 * @typedef {Object} SGAppsTestingScenarioWaitForXPathOptions
 * @memberof SGAppsTestingScenario
 * @property {Boolean} [visible] wait for element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.
 * @property {Boolean} [hidden] wait for element to not be found in the DOM or to be hidden, i.e. have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.
 * @property {Number} [timeout] maximum time to wait for in milliseconds, Defaults to `30000` (30 seconds). Pass 0 to disable timeout.
 */
/**
 * Wait for the xpath to appear in page. If at the moment of calling the method the xpath already exists, the method will return immediately. If the xpath doesn't appear after the timeout milliseconds of waiting, the function will throw.
 * @memberof SGAppsTestingScenario#
 * @method waitForXPath
 * @param {String} xpath A xpath of an element to wait for
 * @param {SGAppsTestingScenarioWaitForXPathOptions} [options] Optional waiting parameters
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.waitForXPath = function (xpath, options) {
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
 * @memberof SGAppsTestingScenario
 * @callback SGAppsTestingScenarioUserAgentHandler
 * @param {string} userAgent 
 * @returns {Promise}
 */
/**
 * Handle User agent of instance
 * @memberof SGAppsTestingScenario#
 * @method userAgent
 * @param {SGAppsTestingScenarioUserAgentHandler} handler if parameter is present will handle UserAgent value
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.userAgent = function (handler) {
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
 * @memberof SGAppsTestingScenario#
 * @method clearPermissionOverrides
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.clearPermissionOverrides = function () {
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
 * Override permissions for the browser context.
 * @memberof SGAppsTestingScenario#
 * @method overridePermissions
 * @param {String} origin The origin to grant permissions to, e.g. "https://example.com".
 * @param {Array<('geolocation'|'midi'|'midi-sysex'|'notifications'|'push'|'camera'|'microphone'|'background-sync'|'ambient-light-sensor'|'accelerometer'|'gyroscope'|'magnetometer'|'accessibility-events'|'clipboard-read'|'clipboard-write'|'payment-handler')>} permissions An array of permissions to grant. All permissions that are not listed here will be automatically denied.
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.overridePermissions = function (origin, permissions) {
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
 * @typedef {Object} SGAppsTestingScenarioPageCloseOptions
 * @property {Boolean} runBeforeUnload Defaults to `false`. Whether to run the before unload page handlers.
 */
/**
 * Close a page from instance
 * @memberof SGAppsTestingScenario#
 * @method pageClose
 * @param {SGAppsTestingScenarioPageCloseOptions} [options] set of options
 * @param {String} [index] page's index
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.pageClose = function (options, index) {
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
 * @memberof SGAppsTestingScenario#
 * @method pageSetLabel
 * @param {string} label label that will be set on current page
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.pageSetLabel = function (label) {
	let _self = this;
	_self.operations.push({
		name      : 'pageSetLabel',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance)
					.then(page => {
						//@ts-ignore
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

 * @typedef {('load'|'domcontentloaded'|'networkidle0'|'networkidle2')} SGAppsTestingScenarioPageReloadOptionsWaitUntil
 */
/**
 * @typedef {Object} SGAppsTestingScenarioPageReloadOptions
 * @property {Number} timeout Maximum navigation time in milliseconds, defaults to `30` seconds, pass `0` to disable timeout.
 * @property {(SGAppsTestingScenarioPageReloadOptionsWaitUntil|SGAppsTestingScenarioPageReloadOptionsWaitUntil[])} waitUntil When to consider navigation succeeded, defaults to load. Given an array of event strings, navigation is considered to be successful after all events have been fired. Events can be either:

- `load` - consider navigation to be finished when the load event is fired.
- `domcontentloaded` - consider navigation to be finished when the DOMContentLoaded event is fired.
- `networkidle0` - consider navigation to be finished when there are no more than 0 network connections for at least 500 ms.
- `networkidle2` - consider navigation to be finished when there are no more than 2 network connections for at least 500 ms.
 */
/**
 * Close a page from instance
 * @memberof SGAppsTestingScenario#
 * @method pageReload
 * @param {String} index page's index
 * @param {SGAppsTestingScenarioPageReloadOptions} [options] set of options
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.pageReload = function (index, options) {
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
 * @callback SGAppsTestingScenarioPageContentCallback
 * @param {string} content
 * @returns {Promise}
 */
/**
 * Handle page Content of instance
 * @memberof SGAppsTestingScenario#
 * @method pageContent
 * @param {SGAppsTestingScenarioPageContentCallback} handler if parameter is present will handle page content value
 * @returns {(SGAppsTestingScenario)}
 */
SGAppsTestingScenario.prototype.pageContent = function (handler) {
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
 * @typedef {Object} SGAppsTestingScenarioClickOnSelectorOptions
 * @property {"left"|"right"|"middle"} button Defaults to `left`.
 * @property {number} clickCount defaults to `1`.
 * @property {number} delay Time to wait between mousedown and mouseup in milliseconds. Defaults to `0`.
 */
/**
 * This method fetches an element with selector, scrolls it into view if needed, and then uses page.mouse to click in the center of the element. If there's no element matching selector, the method throws an error.
 * @memberof SGAppsTestingScenario#
 * @method clickOnSelector
 * @param {String} selector A selector to search for element to click. If there are multiple elements satisfying the selector, the first will be clicked.
 * @param {SGAppsTestingScenarioClickOnSelectorOptions} [options] Optional parameters
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.clickOnSelector = function (selector, options) {
	options = Object.assign({
		/**
		 * @private
		 * @type {"left"|"right"|"middle"}
		 */
		button: 'left',
		clickCount: 1,
		delay: 0
	}, options || {});
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
 * @typedef {object} SGAppsTestingScenarioTypeOnSelectorOptions
 * @property {number} delay Time to wait between key presses in milliseconds. Defaults to 0.
 */
/**
 * Sends a `keydown`, `keypress/input`, and `keyup` event for each character in the text.
 * @memberof SGAppsTestingScenario#
 * @method typeOnSelector
 * @param {string} selector A selector of an element to type into. If there are multiple elements satisfying the selector, the first will be used.
 * @param {string} text A text to type into a focused element.
 * @param {SGAppsTestingScenarioTypeOnSelectorOptions} [options] Optional parameters
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.typeOnSelector = function (selector, text, options) {
	options = Object.assign({ delay: 0 }, options || {});
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
 * @memberof SGAppsTestingScenario#
 * @method tapOnSelector
 * @param {String} selector A selector to search for element to tap. If there are multiple elements satisfying the selector, the first will be tapped.
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.tapOnSelector = function (selector) {
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
 * @memberof SGAppsTestingScenario#
 * @method focusOnSelector
 * @param {String} selector A selector of an element to focus. If there are multiple elements satisfying the selector, the first will be focused.
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.focusOnSelector = function (selector) {
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
 * @memberof SGAppsTestingScenario#
 * @method hoverOnSelector
 * @param {String} selector A selector to search for element to hover. If there are multiple elements satisfying the selector, the first will be hovered.
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.hoverOnSelector = function (selector) {
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
 * @callback SGAppsTestingScenarioEvaluatePageFunctionCallback
 * @returns {any}
 */
/**
 * @callback SGAppsTestingScenarioEvaluateHandlerCallback
 * @param {object} result
 * @param {null|Error} result.error
 * @param {any} result.data
 * @returns {Promise|any}
 */
/**
 * If the function passed to the page.evaluate returns a non-Serializable value, then page.evaluate resolves to undefined. DevTools Protocol also supports transferring some additional values that are not serializable by JSON: -0, NaN, Infinity, -Infinity, and bigint literals.
 * @memberof SGAppsTestingScenario#
 * @method evaluate
 * @param {(SGAppsTestingScenarioEvaluatePageFunctionCallback|String)} pageFunction Function to be evaluated in the page context
 * @param {SGAppsTestingScenarioEvaluateHandlerCallback} [handler] function that receives serializable data from `pageFunction`
 * @param {object} [variables] context passed to `pageFunction`
 * @param {object} [meta] meta of operation
 * @param {string} [meta.name='evaluate'] name of operation
 * @param {any[]} [meta.args] arguments of operation
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.evaluate = function (pageFunction, handler, variables, meta) {
	meta = meta || {};
	let _self = this;
	_self.operations.push({
		name      : meta.name || 'evaluate',
		params    : meta.args || arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					// jshint -W061
					eval('pageFunction = function () { try { return { error: null, data: ( ' + pageFunction.toString() + ' ).apply({}, arguments) } } catch (err) { return { error: { message: err.message, stack: err.stack } } } }');
					// jshint +W061
					//@ts-ignore
					page.evaluate(pageFunction, (variables || {}), reject).then(
						(result) => {
							if (!handler) {
								resolve();
							} else {
								try {
									if (result.error) {
										let err = new Error(
											"Browser Context: " + (
												result.error.message || "Unknown Error"
											)
										);
										err.stack = result.stack;
										reject(err);
									} else {
										//@ts-ignore
										let response = handler(result);
										
										if (response && response.then) {
											response.then(resolve, reject).catch(reject);
										} else {
											resolve();
										}
									}
								} catch (err) {
									reject(err);
								}
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
 * @callback SGAppsTestingScenarioEvaluateOnSelectorAllPageFunctionCallback
 * @param {HTMLElement} element
 * @param {any} value
 * @param {number} index
 * @param {HTMLElement[]} arr
 * @returns {any}
 */
/**
 * @callback SGAppsTestingScenarioEvaluateOnSelectorAllHandlerCallback
 * @param {any[]} results
 * @returns {Promise|any}
 */
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
 * @memberof SGAppsTestingScenario#
 * @method evaluateOnSelectorAll
 * @param {String} selector A selector for an selecting element
 * @param {SGAppsTestingScenarioEvaluateOnSelectorAllPageFunctionCallback|String} pageFunction Function to be evaluated in the page context
 * @param {SGAppsTestingScenarioEvaluateOnSelectorAllHandlerCallback} [handler] function that receives serializable data from `pageFunction`, this parameter can be skipped
 * @param {*} [value] context passed to `pageFunction`
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.evaluateOnSelectorAll = function (selector, pageFunction, handler, value) {
	if (!value && typeof(handler) !== "function") {
		value = handler;
		handler = null;
	}

	if (typeof(pageFunction) === "string") {
		pageFunction = 'function (element, value, index, arr) { return eval(unescape("' + escape(pageFunction) + '")); }';
	} else {
		pageFunction = pageFunction.toString();
	}

	let wrapper = function (variables) {
		var nodes = Array.prototype.slice.call(
			document.querySelectorAll(variables.selector)
		);
		var value = variables.value;
		var pageFunction;
		// jshint -W061
		eval('pageFunction = ' + variables.pageFunction);
		// jshint +W061

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
		//@ts-ignore
		args : arguments
	});

	return this;
};

/**
 * Similar with evaluateOnSelectorAll but throws an error if detected more than one element
 *
 * @memberof SGAppsTestingScenario#
 * @method evaluateOnSelectorOnlyOne
 * @param {String} selector A selector for an selecting element
 * @param {SGAppsTestingScenarioEvaluateOnSelectorAllPageFunctionCallback|String} pageFunction Function to be evaluated in the page context
 * @param {SGAppsTestingScenarioEvaluateHandlerCallback|Object<any,any>|string|number} [handler] function that receives serializable data from `pageFunction`, this parameter can be skipped
 * @param {*} [value] context passed to `pageFunction`
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.evaluateOnSelectorOnlyOne = function (selector, pageFunction, handler, value) {
	if (!value && typeof(handler) !== "function") {
		value = handler;
		handler = null;
	}

	if (typeof(pageFunction) === "string") {
		pageFunction = 'function (element, value, index, arr) { return eval(unescape("' + escape(pageFunction) + '")); }';
	} else {
		pageFunction = pageFunction.toString();
	}

	let wrapper = function (variables) {
		var nodes = Array.prototype.slice.call(
			document.querySelectorAll(variables.selector)
		);
		var value = variables.value;
		var pageFunction;
		// jshint -W061
		eval('pageFunction = ' + variables.pageFunction);
		// jshint +W061

		return nodes.map(function (element, index, arr) {
			if (index) throw Error('Detected more than one element with selector ["' + variables.selector + '"]');
			return pageFunction(element, value, index, arr);
		})[0];
	};

	this.evaluate(wrapper, handler, {
		selector: selector,
		value: value,
		pageFunction: pageFunction
	},
	{
		name : 'evaluateOnSelectorOnlyOne',
		//@ts-ignore
		args : arguments
	});

	return this;
};

/**
 * @typedef {Object} SGAppsTestingScenarioPageEmulateConfigViewport
 * @memberof SGAppsTestingScenario
 * @property {Number} width  page width in pixels.
 * @property {Number} height  page height in pixels.
 * @property {Number} deviceScaleFactor  Specify device scale factor (can be thought of as dpr). Defaults to 1.
 * @property {Boolean} isMobile  Whether the meta viewport tag is taken into account. Defaults to false.
 * @property {Boolean} hasTouch Specifies if viewport supports touch events. Defaults to false
 * @property {Boolean} isLandscape  Specifies if viewport is in landscape mode. Defaults to false.
 */
/**
 * @typedef {Object} SGAppsTestingScenarioPageEmulateConfig
 * @memberof SGAppsTestingScenario
 * @property {SGAppsTestingScenario.SGAppsTestingScenarioPageEmulateConfigViewport} viewport viewport options
 * @property {String} userAgent user agent definition
 */
/**
 * @typedef {("Blackberry PlayBook"|"Blackberry PlayBook landscape"|"BlackBerry Z30"|"BlackBerry Z30 landscape"|"Galaxy Note 3"|"Galaxy Note 3 landscape"|"Galaxy Note II"|"Galaxy Note II landscape"|"Galaxy S III"|"Galaxy S III landscape"|"Galaxy S5"|"Galaxy S5 landscape"|"iPad"|"iPad landscape"|"iPad Mini"|"iPad Mini landscape"|"iPad Pro"|"iPad Pro landscape"|"iPhone 4"|"iPhone 4 landscape"|"iPhone 5"|"iPhone 5 landscape"|"iPhone 6"|"iPhone 6 landscape"|"iPhone 6 Plus"|"iPhone 6 Plus landscape"|"iPhone 7"|"iPhone 7 landscape"|"iPhone 7 Plus"|"iPhone 7 Plus landscape"|"iPhone 8"|"iPhone 8 landscape"|"iPhone 8 Plus"|"iPhone 8 Plus landscape"|"iPhone SE"|"iPhone SE landscape"|"iPhone X"|"iPhone X landscape"|"iPhone XR"|"iPhone XR landscape"|"JioPhone 2"|"JioPhone 2 landscape"|"Kindle Fire HDX"|"Kindle Fire HDX landscape"|"LG Optimus L70"|"LG Optimus L70 landscape"|"Microsoft Lumia 550"|"Microsoft Lumia 950"|"Microsoft Lumia 950 landscape"|"Nexus 10"|"Nexus 10 landscape"|"Nexus 4"|"Nexus 4 landscape"|"Nexus 5"|"Nexus 5 landscape"|"Nexus 5X"|"Nexus 5X landscape"|"Nexus 6"|"Nexus 6 landscape"|"Nexus 6P"|"Nexus 6P landscape"|"Nexus 7"|"Nexus 7 landscape"|"Nokia Lumia 520"|"Nokia Lumia 520 landscape"|"Nokia N9"|"Nokia N9 landscape"|"Pixel 2"|"Pixel 2 landscape"|"Pixel 2 XL"|"Pixel 2 XL landscape")} SGAppsTestingScenarioPageEmulateDeviceName
 */

/**
 * @typedef {Object} SGAppsTestingScenarioPageEmulateDeviceConfig
 * @memberof SGAppsTestingScenario
 * @property {("chrome"|"firefox"|"ch"|"c"|"ff"|"f")} [type] Browser Type Firefox or Chrome, Default value is `"chrome"`
 * @property {SGAppsTestingScenario.SGAppsTestingScenarioPageEmulateDeviceName} [emulate] emulate device name, if not set will run as in simple browser, Default value is `null`.
 * @property {SGAppsTestingScenario.SGAppsTestingScenarioPageEmulateDeviceConfigOptions} [options] Browser's options, Set of configurable options to set on the browser.
 */

/**
 * @typedef {Object} SGAppsTestingScenarioPageEmulateCallbackResult
 * @memberof SGAppsTestingScenario
 * @property {Error[]} _errors errors emitted during test
 * @property {Number}  _skipped number of operations that were skipped in test, cause can be an emitted error
 * @property {Number}  _warns number of operations that got warnings
 * @property {Number}  _failed number of operations that failed
 * @property {SGAppsTestingScenario.SGAppsTestingScenarioPageEmulateDeviceConfigOptions[]} _fallenDevices list if devices that failed test
 */

/**
 * @callback SGAppsTestingScenarioPageEmulateCallback
 * @memberof SGAppsTestingScenario
 * @param {SGAppsTestingScenarioPageEmulateCallbackResult} result
 */

/**
 * @typedef {object} SGAppsTestingScenarioPageEmulateDeviceConfigOptions
 * @memberof SGAppsTestingScenario
 * @property {boolean} ignoreHTTPSErrors Whether to ignore HTTPS errors during navigation. Defaults to `false`.
 * @property {boolean} headless Whether to run browser in headless mode](https://developers.google.com/web/updates/2017/04/headless-chrome). Defaults to `true` unless the `devtools` option is `true`.
 * @property {string} executablePath Path to a Chromium or Chrome executable to run instead of the bundled Chromium. If `executablePath` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd).
 * @property {number} slowMo Slows down Puppeteer operations by the specified amount of milliseconds. Useful so that you can see what is going on.
 * @property {SGAppsTestingScenario.SGAppsTestingScenarioSetViewportOptions} defaultViewport Sets a consistent viewport for each page. Defaults to an 800x600 viewport. `null` disables the default viewport.
 * @property {string[]} args Additional arguments to pass to the browser instance. The list of Chromium flags can be found [here](http://peter.sh/experiments/chromium-command-line-switches/).
 * @property {(boolean|string[])} ignoreDefaultArgs If `true`, then do not use [`puppeteer.defaultArgs()`](#puppeteerdefaultargs-options). If an array is given, then filter out the given default arguments. Dangerous option; use with care. Defaults to `false`.
 * @property {boolean} handleSIGINT Close the browser process on Ctrl-C. Defaults to `true`.
 * @property {boolean} handleSIGTERM Close the browser process on SIGTERM. Defaults to `true`.
 * @property {boolean} handleSIGHUP Close the browser process on SIGHUP. Defaults to `true`.
 * @property {number} timeout Maximum time in milliseconds to wait for the browser instance to start. Defaults to `30000` (30 seconds). Pass `0` to disable timeout.
 * @property {boolean} dumpio Whether to pipe the browser process stdout and stderr into `process.stdout` and `process.stderr`. Defaults to `false`.
 * @property {string} userDataDir Path to a [User Data Directory](https://chromium.googlesource.com/chromium/src/+/master/docs/user_data_dir.md).
 * @property {object} env Specify environment variables that will be visible to the browser. Defaults to `process.env`.
 * @property {boolean} devtools Whether to auto-open a DevTools panel for each tab. If this option is `true`, the `headless` option will be set `false`.
 * @property {boolean} pipe Connects to the browser over a pipe instead of a WebSocket. Defaults to `false`.
 */
/**
 * Emulates specific configuration of device
 * @memberof SGAppsTestingScenario#
 * @method pageEmulate
 * @param {(SGAppsTestingScenarioPageEmulateConfig|SGAppsTestingScenarioPageEmulateDeviceName)} config 
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.pageEmulate = function (config) {
	let _self = this;
	if (typeof(config) === "string") {
		if (config in puppeteer.devices) {
			config = puppeteer.devices[config];
		} else {
			console.warn("Incorrect device name, choose one from: ", ...Object.keys(puppeteer.devices));
		}
	}
	_self.operations.push({
		name      : 'pageEmulate',
		params    : arguments,
		operation : function (instance) {
			return new Promise((resolve, reject) => {
				_self._getPage(instance).then(page => {
					//@ts-ignore
					page.emulate(config).then(resolve, reject);
				}, reject);
			});
		}
	});

	return this;
};

/**
 * Add a specific message to last operation
 * @memberof SGAppsTestingScenario#
 * @method message
 * @param {String} message
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.message = function (message) {
	if (typeof(message) === "string") {
		this.operations.last().message = message;
	}
	return this;
};

/**
 * Add labels to operation
 * @memberof SGAppsTestingScenario#
 * @method operationLabels
 * @param {String[]} labels
 * @returns {SGAppsTestingScenario}
 */
 SGAppsTestingScenario.prototype.operationLabels = function (...labels) {
	let operation = this.operations.last();
	labels.filter(label => {
		return label && typeof(label) === "string";
	}).forEach(label => {
		if (operation.labels.indexOf(label) === -1) {
			operation.labels.push(label);
		}
	});
	return this;
};

/**
 * Remove labels from operation
 * @memberof SGAppsTestingScenario#
 * @method operationLabelsRemove
 * @param {String[]} labels
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.operationLabelsRemove = function (...labels) {
	let operation = this.operations.last();
	labels.filter(label => {
		return label && typeof(label) === "string";
	}).forEach(label => {
		if (operation.labels.indexOf(label) !== -1) {
			operation.labels = operation.labels.filter(
				item => item !== label
			);
		}
	});
	return this;
};


/**
 * activate or deactivate operation by adding or removing operation label `"__Deactivated"`
 * @memberof SGAppsTestingScenario#
 * @method deactivate
 * @param {Boolean} status - if status is true than operation will be deactivated
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.deactivate = function (status) {
	if (typeof(status) === "boolean") {
		this.operationLabels('__Deactivated');
	}
	return this;
};

/**
 * Describe a section of testing scenario
 * @memberof SGAppsTestingScenario#
 * @method describe
 * @param {String} message the message that will describe the Scenario Section
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.describe = function (message) {
	this.wait();
	this.operationLabels('__Describe');
	this.message(message);
	return this;
};

/**
 * Close Describe section of testing scenario
 * @memberof SGAppsTestingScenario#
 * @method describeClose
 * @param {String} [message] message on succeed
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.describeClose = function (message) {
	this.wait();
	this.operationLabels('__DescribeClose');
	this.message(message);
	return this;
};

/**
 * Describe a group of testing scenario similar to `TestingScenario.describe`
 * @memberof SGAppsTestingScenario#
 * @method group
 * @param {String} message the name of group the Scenario Section
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.group = function (message) {
	this.wait();
	this.operationLabels('__ScenarioGroup');
	this.message(message);
	return this;
};

/**
 * Close Group section of testing scenario
 * @memberof SGAppsTestingScenario#
 * @method groupClose
 * @param {String} message message on succeed
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.groupClose = function (message) {
	this.wait();
	this.operationLabels('__ScenarioGroupClose');
	this.message(message);
	return this;
};

/**
 * Inject other testing Scenario on specific step
 * @memberof SGAppsTestingScenario#
 * @method groupClose
 * @param {SGAppsTestingScenario} Scenario
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.injectScenario = function (Scenario) {
	this.operations.push(Scenario.operations.list());
	return this;
};

/**
 * @callback TestingScenarioItHandlerCallback
 * @param {Function} done - function that should be executed when check id done
 * @param {Function} evaluate - function executed in Browser's context that return an result
 * @param {SGAppsTestingAssert} assert - assert API
 * @param {SGAppsTestingExpect} expect - expect API
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
 * @memberof SGAppsTestingScenario#
 * @method it
 * @param {TestingScenarioItHandlerCallback} handler
 * @param {String} message
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.it = function (handler, message) {
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
					evaluate.toString = function () { return 'function () { }'; };
					evaluate.toSource = function () { return 'function () { }'; };
					let done = function (err) {
						if (err) {
							reject(err);
						} else {
							resolve();
						}
					};
					// jshint -W061
					eval('handler = ' + handler.toString().replace('{', '{\ntry {').replace(/\}([^\}]*$)/, '} catch (err) { done(err) }\n}$1'));
					// jshint +W061

					handler(
						//@ts-ignore
						done, evaluate, SGAppsTestingAssert, SGAppsTestingExpect
					);
				}, reject).catch(reject);
			});
		}
	});

	return this;
};

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
 * @memberof SGAppsTestingScenario#
 * @method fork
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.fork = function () {
	let _scenario = new SGAppsTestingScenario();

	_scenario.setOption('headless', this.getOption('headless'));
	_scenario.setOption('verbose', this.getOption('verbose'));

	_scenario.operations.push(this.operations.list());

	return _scenario;
};

/**
 * Close device Instance
 * @memberof SGAppsTestingScenario#
 * @method close
 * @returns {SGAppsTestingScenario}
 */
SGAppsTestingScenario.prototype.close = function () {
	let _self = this;

	_self.operations.push({
		name      : 'close',
		params    : arguments,
		operation : function (instance) {
			return instance.close();
		}
	});
	return this;
};

/**
 * Run your tests under specific environment
 * @param {(SGAppsTestingScenarioPageEmulateCallback|SGAppsTestingScenarioPageEmulateDeviceConfig|SGAppsTestingScenarioPageEmulateDeviceName)} device
 * @param {(SGAppsTestingScenarioPageEmulateCallback|SGAppsTestingScenarioPageEmulateDeviceConfig|SGAppsTestingScenarioPageEmulateDeviceName)} [device2]
 * @param {(SGAppsTestingScenarioPageEmulateCallback|SGAppsTestingScenarioPageEmulateDeviceConfig|SGAppsTestingScenarioPageEmulateDeviceName)} [device3]
 * @param {(SGAppsTestingScenarioPageEmulateCallback|SGAppsTestingScenarioPageEmulateDeviceConfig|SGAppsTestingScenarioPageEmulateDeviceName)} [device4]
 * @param {(SGAppsTestingScenarioPageEmulateCallback|SGAppsTestingScenarioPageEmulateDeviceConfig|SGAppsTestingScenarioPageEmulateDeviceName)} [device5]
 * @param {(SGAppsTestingScenarioPageEmulateCallback|SGAppsTestingScenarioPageEmulateDeviceConfig|SGAppsTestingScenarioPageEmulateDeviceName)} [device6]
 * @param {(SGAppsTestingScenarioPageEmulateCallback|SGAppsTestingScenarioPageEmulateDeviceConfig|SGAppsTestingScenarioPageEmulateDeviceName)} [device7]
 * @param {(SGAppsTestingScenarioPageEmulateCallback|SGAppsTestingScenarioPageEmulateDeviceConfig|SGAppsTestingScenarioPageEmulateDeviceName)} [device8]
 * @param {...(SGAppsTestingScenarioPageEmulateCallback|SGAppsTestingScenarioPageEmulateDeviceConfig|SGAppsTestingScenarioPageEmulateDeviceName)} otherDevices
 */
 SGAppsTestingScenario.prototype.run = function (device, device2, device3, device4, device5, device6, device7, device8, ...otherDevices) {
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
	});
	//@ts-ignore
	new ApplicationBuilder({
		onready : async function () {
			let app = this;

			app.debugEnabled(true);
			app.consoleOptions({
				file: false,
				contextName: false
			});

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



module.exports = {
	TestingScenario: SGAppsTestingScenario,
	expect: function (value) {
		return new SGAppsTestingExpect(value);
	},
	assert: SGAppsTestingAssert
};
