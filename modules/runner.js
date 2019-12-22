let puppeteerFirefox = Application.NodeInterface().require('puppeteer-firefox');
let puppeteer        = Application.NodeInterface().require('puppeteer');

module.exports = async (devices, /** @type {import('../index')} */ Scenario, callback) => {

	console.info('🐙 \033[1m SGApps.IO - Testing Platform » Running Tests');

	let devicesChecker   = await module.require('./devices');
	let reporter         = await Application.require('./reporter');
	let asyncOperations  = await Application.require('async');

	devices = devicesChecker(devices);

	let operations = Scenario.operations.list();

	console.log('\t- \033[33;1m' + devices.length + '\033[0m Devices\n');
	console.log('\t- \033[33;1m' + operations.length + '\033[0m Operations');

	console.log('');

	let _warns     = 0;
	let _skipped   = 0;
	let _failed    = 0;
	let _errors    = [];
	let _fallenDevices = [];

	let _self      = Scenario;

	asyncOperations.forEach(
		devices,
		function (_deviceDone, device, index) {
			console.log("🐚  \033[34;1mTesting \033[0m", device);
			let _isInterrupted = false;

			let instanceHandler = function (instance, done) {
				asyncOperations.forEach(
					operations,
					function (next, item, index) {
						if (_isInterrupted) {
							_skipped++;
							return next();
						}
						let params = Array.prototype.slice.call(item.params);
						console.log('\t' + (index + 1) + '. \033[32m' + item.name + ' \033[36m(\033[0m', reporter.logArguments(item.params),'\033[36m)\033[0m');
						item.operation(instance).then(function () {
							next();
						}, (err) => {
							_isInterrupted = true;
							_failed++;
							_errors.push(err);
							Application.consoleOptions({ file: true });
							console.error(err);
							Application.consoleOptions({ file: false });
							next();
						}).catch((err) => {
							_isInterrupted = true;
							_failed++;
							_errors.push(err);
							Application.consoleOptions({ file: true });
							console.error(err);
							Application.consoleOptions({ file: false });
						});
					},
					done
				).on('error', (err) => {
					_isInterrupted = true;
					_errors.push(err);
					Application.consoleOptions({ file: true });
					console.error(err);
					Application.consoleOptions({ file: false });
				});
			};

			let deviceDone = () => {
				if (_isInterrupted) {
					_fallenDevices.push(device);
				}
				let err;
				try {
					instance.close();
				} catch (err) {};
				_deviceDone();
			};
			(device.type === "firefox" ? puppeteerFirefox : puppeteer).launch(
				{
					headless: !!_self.headless
				}
			).then(function (/** @type {import('puppeteer').Browser} */ instance) {
				_self._getPage(instance)
					.then(page => {
						let config = device.emulate;
						if (typeof(config) === "string") {
							if (config in puppeteer.devices) {
								config = puppeteer.devices[config];
							} else {
								config = undefined;
								console.warn("Incorrect device name, choose one from: ", ...Object.keys(puppeteer.devices))
							}
						} else {
							config = config || undefined;
						}
						if (config) {
							page.emulate(config)
							.then(
								() => {
									instanceHandler(instance, () => {
										deviceDone();
									});
								}, function (err) {
									_isInterrupted = true;
									_errors.push(Error('⛔ Unable to emulate ' + JSON.stringify(device)));
									Application.consoleOptions({ file: true });
									console.error('⛔ Unable to emulate device ; ' + err.message, device);
									Application.consoleOptions({ file: false });
									deviceDone();
								}
							);
						} else {
							instanceHandler(instance, () => {
								deviceDone();
							});
						}
					}, err => {
						_isInterrupted = true;
						_errors.push(Error('⛔ Unable to obtain page ; ' + err.message));
						Application.consoleOptions({ file: true });
						console.error(err);
						Application.consoleOptions({ file: false });
						deviceDone();
					});
			}, (err) => {
				_errors.push(err);
				_isInterrupted = true;
				Application.consoleOptions({ file: true });
				console.error(err);
				Application.consoleOptions({ file: false });
			});
		},
		function () {
			if (_errors.length) {
				console.info('\033[31;1m' + _failed + ' Tests failed\033[0m');
				if (_skipped)
					console.info('\033[33;1m' + _skipped + ' skipped\033[0m');

				if (_fallenDevices.length)
				console.info('\033[31;1mUnsupported devices: \033[0m', _fallenDevices);
			} else if (_warns || _skipped) {
					console.log('\033[33;1m' + _warns + ' Tests failed\033[0m');
				if (_skipped)
					console.info('\033[33;1m' + _skipped + ' skipped\033[0m');
			} else {
				console.info('\033[32;1m Done tests for ' + devices.length + ' devices passed\033[0m');
			}

			if (callback) {
				callback(
					{
						_errors  : _errors,
						_skipped : _skipped,
						_warns   : _warns,
						_failed  : _failed,
						_fallenDevices : _fallenDevices
					}
				);
			} else if (process.argv.indexOf('--exit') !== -1) {
				if (_errors.length) {
					process.exit(1);
				} else {
					process.exit(0);
				}
			}
		}
	).on('error', (err) => {
		_errors.push(err);
		Application.consoleOptions({ file: true });
		console.error(err);
		Application.consoleOptions({ file: false });
	});
}