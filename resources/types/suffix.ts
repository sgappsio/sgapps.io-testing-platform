
declare module "sgapps.io-testing-platform" {
    function TestingScenario(): SGAppsTestingScenario;
	function expect(value): SGAppsTestingExpect;
	function assert(): SGAppsTestingAssert;
}