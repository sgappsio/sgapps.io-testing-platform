let TestingScenario = require("../../index");
let assert = TestingScenario.assert;
let expect = TestingScenario.expect;

describe ("Running DuckDuckGo Search", ()=> {
	it("Search Form", (done) => {
		let Scenario = new TestingScenario();

		Scenario
			.isHeadLess(false) // set it to true in production mode
			.isVerbose(true) // set it to false in production mode
			.getPage()
			.goto("https://duckduckgo.com/", {
				waitUntil: "domcontentloaded"
			})
			.typeOnSelector('#search_form_input_homepage', 'SGApps.IO Testing Platform', {
				delay: 100
			})
			.clickOnSelector('#search_button_homepage')
			.wait(2000)
			.getPage()
			.evaluateOnSelectorAll(
				'a[href="https://www.npmjs.com/package/sgapps.io-testing-platform"]',
				function (element, value) {
					element.style.background = value;
				},
				"red"
			)
			.wait(2000)
			.it(async (done, evaluate, assert, expect) => {
				let resultId = await evaluate(function (selector) {
					return document.querySelector('a[href="https://www.npmjs.com/package/sgapps.io-testing-platform"].result__a')
						.parentNode
						.parentNode
						.parentNode
						.getAttribute("id");
				});
				assert.typeof(resultId, "string", "result ID Detected");
				
				let position = parseInt(resultId.split('-')[1], 10);

				expect(position).to().be().notA("NaN");
				expect(position).to().be().a("NUMBER_FINITE");
				assert.isBelow(position, 10);


				done();
			}, "testing position of result to be below 10")
			.run(
				{ emulate: "iPad Pro", options: { ignoreHTTPSErrors: true, headless: false } },
				// "Galaxy Note 3",
				// "chrome:Nexus 10 landscape",
				// "iPhone 6 Plus",
				function (result) {
					if (result._errors.length) {
						done(result._errors[0]);
					} else {
						done();
					}
				}
			);
	}).timeout(60000)
});