const reporter = require('../reporter');
const logger = reporter.logger;

/**
 * @class
 * @name SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {*} value 
 * @param {String} message 
 */
function SGAppsTestingAssert(expectValue, value, message, isNegated, comparingFunction) {
	let condition = (
		comparingFunction ? comparingFunction(expectValue, value) : ( expectValue === value )
	);
	if (isNegated) condition = !condition;

	message = message || "Assertion Error Message";
	message = message.replace('{{expectValue}}', reporter.prettyCliRow([expectValue]) + '\x1b[31m');
	message = message.replace('{{value}}', reporter.prettyCliRow([value]) + '\x1b[31m');

	if (!condition) {
		let err = Error('📌  \x1b[31;1mAssert Error\x1b[0;31m ' + message
			+ ';\x1b[0m\n\t\x1b[32;1m' + ( isNegated ? 'not ' : '' ) + 'expected value: \x1b[0m'
			+ reporter.prettyCliRow([expectValue])
			+ '\n\t\x1b[33;1mcurrent value: \x1b[0m'
			+ reporter.prettyCliRow([value])
		);

		err.stack = '';

		throw err;
	}
}

/**
 * @method equal
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {*} value 
 * @param {String} message 
 */
SGAppsTestingAssert.equal = function (expectValue, value, message) {
	return new SGAppsTestingAssert(expectValue, value, message, false, (a, b) => a == b);
};

/**
 * @method notEqual
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {*} value 
 * @param {String} message 
 */
SGAppsTestingAssert.notEqual = function (expectValue, value, message) {
	return new SGAppsTestingAssert(expectValue, value, message, false, (a, b) => a != b);
};

/**
 * @method strictEqual
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {*} value 
 * @param {String} message 
 */
SGAppsTestingAssert.strictEqual = function (expectValue, value, message) {
	return new SGAppsTestingAssert(expectValue, value, message, false, (a, b) => a === b);
};

/**
 * @method notStrictEqual
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {*} value 
 * @param {String} message 
 */
SGAppsTestingAssert.notStrictEqual = function (expectValue, value, message) {
	return new SGAppsTestingAssert(expectValue, value, message, false, (a, b) => a !== b);
};

/**
 * @method typeof
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {'function'|'string'|'number'|'object'|'undefined'} typeName 
 * @param {String} message 
 */
SGAppsTestingAssert.typeof = function (expectValue, typeName, message) {
	return new SGAppsTestingAssert(typeof(expectValue), typeName, (message || "Expect typeof " + reporter.prettyCliRow(expectValue) + "\x1b[31m to be {{value}}"), false, (a, b) => a === b);
};

/**
 * @method notTypeof
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {'function'|'string'|'number'|'object'|'undefined'} typeName 
 * @param {String} message 
 */
SGAppsTestingAssert.notTypeof = function (expectValue, typeName, message) {
	return new SGAppsTestingAssert(typeof(expectValue), typeName, (message || "Expect typeof " + reporter.prettyCliRow(expectValue) + "\x1b[31m not to be {{value}}"), false, (a, b) => a != b);
};

/**
 * @method lengthOf
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {*} value 
 * @param {String} message 
 */
SGAppsTestingAssert.lengthOf = function (expectValue, value, message) {
	return new SGAppsTestingAssert(expectValue.length, value, (message || "Expect length of " + reporter.prettyCliRow(expectValue) + "\x1b[31m to be {{value}}"), false);
};

/**
 * @method notLengthOf
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {*} value 
 * @param {String} message 
 */
SGAppsTestingAssert.notLengthOf = function (expectValue, value, message) {
	return new SGAppsTestingAssert(expectValue.length, value, (message || "Expect length of " + reporter.prettyCliRow(expectValue) + "\x1b[31m not to be {{value}}"), false);
};

/**
 * @method isTruthy
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {String} message 
 */
SGAppsTestingAssert.isTruthy = function (expectValue, message) {
	return new SGAppsTestingAssert(!!expectValue, true, (message || "Expect " + reporter.prettyCliRow(expectValue) + "\x1b[31m is somehow {{value}}"), false);
};

/**
 * @method isFalsy
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {String} message 
 */
 SGAppsTestingAssert.isFalsy = function (expectValue, message) {
	return new SGAppsTestingAssert(!!expectValue, false, (message || "Expect " + reporter.prettyCliRow(expectValue) + "\x1b[31m is somehow {{value}}"), false);
};

/**
 * @method isAtLeast
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {*} value 
 * @param {String} message 
 */
SGAppsTestingAssert.isAtLeast = function (expectValue, value, message) {
	return new SGAppsTestingAssert(
		expectValue,
		value,
		(message || "Expect {{expectValue}} is greater or equal to {{value}}"),
		false,
		(a, b) => { return a >= b; }
	);
};

/**
 * @method isBelow
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {*} value 
 * @param {String} message 
 */
SGAppsTestingAssert.isBelow = function (expectValue, value, message) {
	return new SGAppsTestingAssert(
		expectValue,
		value,
		(message || "Expect {{expectValue}} is strictly less than {{value}}"),
		false,
		(a, b) => { return a < b; }
	);
};

/**
 * @method isAtMost
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {*} value 
 * @param {String} message 
 */
SGAppsTestingAssert.isAtMost = function (expectValue, value, message) {
	return new SGAppsTestingAssert(
		expectValue,
		value,
		(message || "Expect {{expectValue}} is less than or equal to {{value}}"),
		false,
		(a, b) => { return a < b; }
	);
};


/**
 * @method isTrue
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {String} message 
 */
SGAppsTestingAssert.isTrue = function (expectValue, message) {
	return new SGAppsTestingAssert(
		expectValue,
		true,
		(message || "Expect {{expectValue}} is {{value}}")
	);
};


/**
 * @method isNotTrue
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {String} message 
 */
SGAppsTestingAssert.isNotTrue = function (expectValue, message) {
	return new SGAppsTestingAssert(
		expectValue,
		true,
		(message || "Expect {{expectValue}} is not {{value}}"),
		true
	);
};

/**
 * @method isFalse
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {String} message 
 */
SGAppsTestingAssert.isFalse = function (expectValue, message) {
	return new SGAppsTestingAssert(
		expectValue,
		false,
		(message || "Expect {{expectValue}} is {{value}}")
	);
};

/**
 * @method isNotFalse
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {String} message 
 */
SGAppsTestingAssert.isNotFalse = function (expectValue, message) {
	return new SGAppsTestingAssert(
		expectValue,
		false,
		(message || "Expect {{expectValue}} is not {{value}}"),
		true
	);
};

/**
 * @method isNull
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {String} message 
 */
SGAppsTestingAssert.isNull = function (expectValue, message) {
	return new SGAppsTestingAssert(
		expectValue,
		null,
		(message || "Expect {{expectValue}} is {{value}}"),
		false
	);
};

/**
 * @method isNotNull
 * @memberof SGAppsTestingAssert
 * @param {*} expectValue 
 * @param {String} message 
 */
SGAppsTestingAssert.isNotNull = function (expectValue, message) {
	return new SGAppsTestingAssert(
		expectValue,
		null,
		(message || "Expect {{expectValue}} is not {{value}}"),
		true
	);
};

/**
 * @class AssertError
 * @memberof SGAppsTestingAssert
 * @param {String} message 
 * @param {String} name 
 */
 function AssertError(message, name) {
	//@ts-ignore
	if (this === global) return new AssertError(message, name);
	this.name    = name;
	this.message = message;
	this.stack   = '';

	return this;
}
AssertError.prototype = new Error();

module.exports = SGAppsTestingAssert;
