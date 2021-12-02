//@ts-check
const SGAppsTestingAssert = require('./assert');

/**
 * @class
 * @name SGAppsTestingExpect
 * @param {*} value
 */
function SGAppsTestingExpect(value) {
	//@ts-ignore
	if (global === this) return new SGAppsTestingExpect(value);
	this.value = value;
	return this;
}

/**
 * @method to
 * @memberof SGAppsTestingExpect#
 * @returns {SGAppsTestingExpectTo}
 */
SGAppsTestingExpect.prototype.to = function () {
	return new SGAppsTestingExpectTo(this.value);
};

/**
 * @class
 * @name SGAppsTestingExpectTo
 * @param {*} value
 */
function SGAppsTestingExpectTo(value) { this.value = value; return this; }

/**
 * @returns {SGAppsTestingExpectToBe}
 */
SGAppsTestingExpectTo.prototype.be = function () {
	return new SGAppsTestingExpectToBe(this.value);
};


/**
 * @class
 * @name SGAppsTestingExpectToBe
 * @param {*} value
 */
function SGAppsTestingExpectToBe(value) { this.value = value; return this; }

/**
 * @memberof SGAppsTestingExpectToBe
 * @method a
 * @param {"string"|"number"|"boolean"|"function"|"object"|"array"|"null"|"NaN"|"NUMBER_FINITE"|"NUMBER_SAFE_INTEGER"|"INFINITY"|"POSITIVE_INFINITY"|"NEGATIVE_INFINITY"} type
 * @param {String} message what to show wen conditions are not meet
 * @returns {SGAppsTestingExpectDescribe}
 */
SGAppsTestingExpectToBe.prototype.a = function (type, message, isNegated) {
	let value = this.value;
	let assertFunction = (expectValue, value, message) => {
		if (isNegated) message = message.replace("Expected to be ", "NotExpected to be ");
		return new SGAppsTestingAssert(expectValue, value, message, isNegated);
	};
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
	return new SGAppsTestingExpectDescribe(this.value); 
};

/**
 * @memberof SGAppsTestingExpectToBe
 * @method notA
 * @param {"string"|"number"|"boolean"|"function"|"object"|"array"|"null"|"NaN"|"NUMBER_FINITE"|"NUMBER_SAFE_INTEGER"|"INFINITY"|"POSITIVE_INFINITY"|"NEGATIVE_INFINITY"} type
 * @param {String} message what to show wen conditions are not meet
 * @returns {SGAppsTestingExpectDescribe}
 */
SGAppsTestingExpectToBe.prototype.notA = function (type, message) {
	return SGAppsTestingExpectToBe.prototype.a(type, message, true);
};

/**
 * @memberof SGAppsTestingExpectToBe
 * @method instanceOf
 * @param {(Object|Error|*)} instanceType
 * @param {String} message what to show wen conditions are not meet
 * @returns {SGAppsTestingExpectDescribe}
 */
SGAppsTestingExpectToBe.prototype.instanceOf = function (instanceType, message) {
	new SGAppsTestingAssert(true, (this.value && (this.value instanceof instanceType)), message || "Expected to be instance of " + (instanceType + ''));
	return new SGAppsTestingExpectDescribe(this.value);
};


/**
 * @class
 * @name SGAppsTestingExpectDescribe
 * @param {*} value
 */
function SGAppsTestingExpectDescribe(value) { this.value = value; return this; }

module.exports = SGAppsTestingExpect;
