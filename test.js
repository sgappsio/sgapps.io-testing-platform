let TestScenario = require('./index');


let Scenario = new TestScenario();
// Scenario.wait = function (ms) {
// 	let TestScenario = Scenario;
// 	TestScenario.operations.push({ operation: function () {
// 		return new Promise(resolve => {
// 			setTimeout(resolve, ms);
// 		})
// 	} });

// 	return Scenario;
// }

Scenario
	.isHeadLess(true)
	.getPage()
	.goto('http://google.com', { waitUntil: "domcontentloaded" }, true, { a: true }, [1,2,3,"34", true], Scenario.getPage)
	.wait(1000)
	.describe('Testam ..A.')
		.goto('http://yahoo.com', { waitUntil: "domcontentloaded" })
		.wait(1000)
		.goto('http://bing.com', { waitUntil: "domcontentloaded" })
		.wait(1000)
		.goto('http://jsdoc.app', { waitUntil: "domcontentloaded" })

		.describe('Testam ..A.1.1.')
			.goto('http://yahoo.com', { waitUntil: "domcontentloaded" })
			.wait(1000)
			.goto('http://bing.com', { waitUntil: "domcontentloaded" })
			.wait(1000)
			.goto('http://jsdoc.app', { waitUntil: "domcontentloaded" })
			.wait(1000)
		.describeClose()
		.wait(1000)
	.describeClose()
	.describe('Testam ..A.')
		.goto('http://yahoo.com', { waitUntil: "domcontentloaded" })
		.wait(1000)
		.goto('http://bing.com', { waitUntil: "domcontentloaded" })
		.wait(1000)
		.goto('http://jsdoc.app', { waitUntil: "domcontentloaded" })
		.wait(1000)
	.describeClose()
	// .waitForSelector('a', {
	// 	visible: true,
	// 	timeout: 100000
	// })
	// .clickOnSelector('button#i2', {
	// 	button: "left",
	// 	delay: 0
	// })
	// .wait(100)
	// .clickOnSelector('button#i2', {
	// 	button: "left",
	// 	delay: 0
	// })
	.close();


let Scenario2 = Scenario.fork();


Scenario.run(
	"iPad Pro",
	"Galaxy Note 3",
	"firefox:Nexus 10 landscape",
	"iPhone 6 Plus"
);