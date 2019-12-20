let TestScenario = require('./index');


let Scenario = new TestScenario();


Scenario.headless = false;

Scenario
	.getPage()
	.goto('http://google.com', { waitUntil: "domcontentloaded" })
	.wait(1000)
	.goto('http://yahoo.com', { waitUntil: "domcontentloaded" })
	.wait(1000)
	.goto('http://bing.com', { waitUntil: "domcontentloaded" })
	.wait(1000)
	.goto('http://jsdoc.app', { waitUntil: "domcontentloaded" })
	.wait(1000)
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


// let Scenario2 = Scenario.fork();


Scenario.run(
	"ff:iPad Pro",
	"Galaxy Note 3",
	"firefox:Nexus 10 landscape",
	"iPhone 6 Plus"
);