let SGAppsTestScenario = require('./index');
let expect       = SGAppsTestScenario.expect;
let assert       = SGAppsTestScenario.assert;

let Scenario = new SGAppsTestScenario();

Scenario
	.setOption('headless', true)
	.setOption('verbose', true) // enable to view detailed step logs
	.getPage()
	.goto('http://google.com', { waitUntil: "domcontentloaded" })
	.wait(1000)
	.describe('Testam ..A.')
		.goto('http://yahoo.com', { waitUntil: "domcontentloaded" })
		.wait(1000)
		.it(async (done, evaluate, assert, expect) => {
			let title = await evaluate('document.title');

			expect(title).to().be().a("string");

			assert.isNotNull(title);
			done();
		}, "checking title")
		.goto('http://bing.com', { waitUntil: "domcontentloaded" })
		.wait(1000)
		.goto('http://jsdoc.app', { waitUntil: "domcontentloaded" })

		.describe('Testam ..A.1.1.')
			.goto('https://sgapps.io', { waitUntil: "domcontentloaded" })
			.wait(1000)
			.goto('https://github.com', { waitUntil: "domcontentloaded" })
			.wait(1000)
			.goto('http://npmjs.com', { waitUntil: "domcontentloaded" })
			.wait(1000)
		.describeClose()
		.wait(1000)
	.describeClose()
	.describe('Testam ..A.')
		.goto('https://sgapps.io/contact', { waitUntil: "domcontentloaded" })
		.wait(1000)
		.goto('https://bing.com/', { waitUntil: "domcontentloaded" })
		.wait(1000)
		.clickOnSelector('button#i2', {
			button: "left",
			delay: 0
		})
		.deactivate(true)
		.goto('http://jsdoc.app', { waitUntil: "domcontentloaded" })
		.wait(1000)
	.describeClose()
	.waitForSelector('a', {
		visible: true,
		timeout: 100000
	})
	.deactivate(true)
	.close();


// let Scenario2 = Scenario.fork();

// assert.isFalse('some value');

Scenario.run(
	{ emulate: "iPad Pro", options: { ignoreHTTPSErrors: true, headless: false } },
	"Galaxy Note 3",
	"chrome:Nexus 10 landscape",
	"iPhone 6 Plus"
);
