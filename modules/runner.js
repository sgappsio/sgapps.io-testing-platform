let puppeteerFirefox = Application.NodeInterface().require('puppeteer-firefox');
let puppeteer        = Application.NodeInterface().require('puppeteer');

module.exports = async (devices, /*** @type {import('../index')} */ Scenario, callback) => {

	console.info('🐙 \x1b[1m SGApps.IO - Testing Platform » Running Tests');

	let devicesChecker   = await module.require('./devices');
	let reporter         = await Application.require('./reporter');
	let asyncOperations  = await Application.require('async');

	devices = devicesChecker(devices);

	let operations = Scenario.operations.list();

	console.log('\t- \x1b[33;1m' + devices.length + '\x1b[0m Devices');
	console.log('\t- \x1b[33;1m' + operations.length + '\x1b[0m Operations');

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
			console.log('');
			console.log('');
			console.log("🐚  \x1b[34;1mTesting \x1b[0m", device);
			let _isInterrupted = false;

			let instanceHandler = function (instance, done) {
				let indent = 0;
				let indentValue = function (isLast) {
					let n = -1, s = '';
					isLast
					while (n++ < indent) {
						if (n === indent) {
							s+= "├───";
						} else {
							s+= "│   ";
						}
					}
					if (isLast) {
						s = s.replace('├', '└');
					}
					return s;
				};
				asyncOperations.forEach(
					operations,
					function (next, item, index, arr) {
						let isLast = (
							((arr[index + 1] || {}).labels || []).indexOf('__DescribeClose') !== -1
							||
							((arr[index + 1] || {}).labels || []).indexOf('__ScenarioGroupClose') !== -1
						);

						if (!isLast && !Scenario.getOption('verbose')) {
							let found = false;
							for (let i=index + 1;i<arr.length;i++) {
								if (
									arr[i].labels.indexOf('__DescribeClose') !== -1
									||
									arr[i].labels.indexOf('__ScenarioGroupClose') !== -1
								) {
									if (!found) {
										isLast = true;
									}
									break;
								} else if (arr[i].message) {
									break;
								}
							}
						}
						if (_isInterrupted) {
							_skipped++;
							return next();
						}
						if (item.labels.indexOf('__Describe') !== -1) {
							console.log(indentValue(isLast) + (indent ? '📑' : '📒') + '  \x1b[32;1m' + item.message || 'Describe');
							indent++;
						} else if (item.labels.indexOf('__DescribeClose') !== -1) {
							indent--;
						} else if (item.labels.indexOf('__ScenarioGroup') !== -1) {
							console.log(indentValue(isLast) + (indent ? '📂' : '💼') + '  \x1b[32;1m' + item.message || 'Scenario Group');
							indent++;
						} else if (item.labels.indexOf('__ScenarioGroupClose') !== -1) {
							indent--;
						} else if (item.labels.indexOf('__Deactivated') !== -1) {
							if (item.message) {
								console.log(indentValue(isLast).replace(/(\u2500|\u251c)/g, '╌') + '📴  \x1b[2;1mDeactivated: \x1b[0;2m ' + item.message);
							} else {
								console.log(indentValue(isLast).replace(/(\u2500|\u251c)/g, '╌') + '📴  \x1b[2;1mDeactivated: \x1b[0;2m ' + (index + 1) + '. \x1b[32m' + item.name + ' \x1b[0;36m(\x1b[0m', reporter.prettyCliRow(item.params),'\x1b[36m)\x1b[0m');
							}
							return next();
						} else if (item.message) {
							console.log(indentValue(isLast) + '🔖  ' + item.message);
						}
						if (Scenario.getOption('verbose')) {
							console.log(indentValue(isLast) + '' + (index + 1) + '. \x1b[32m' + item.name + ' \x1b[36m(\x1b[0m', reporter.prettyCliRow(item.params),'\x1b[36m)\x1b[0m');
						}
						
						try {
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
						} catch (err) {
							(err) => {
								_isInterrupted = true;
								_failed++;
								_errors.push(err);
								Application.consoleOptions({ file: true });
								console.error(err);
								Application.consoleOptions({ file: false });
							}
						}
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

			let deviceDone = (instance) => {
				if (_isInterrupted) {
					_fallenDevices.push(device);
				}
				let err;
				try {
					instance.close();
				} catch (err) {};
				_deviceDone();
			};
			let options = device.options || {};
			if (!("headless" in options)) {
				//@ts-ignore
				options.headless = !!_self.getOption('headless');
			}
			(device.type === "firefox" ? puppeteerFirefox : puppeteer).launch(
				options
			).then(function (/*** @type {import('puppeteer').Browser} */ instance) {
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
										deviceDone(instance);
									});
								}, function (err) {
									_isInterrupted = true;
									_errors.push(Error('⛔ Unable to emulate ' + JSON.stringify(device)));
									Application.consoleOptions({ file: true });
									console.error('⛔ Unable to emulate device ; ' + err.message, device);
									Application.consoleOptions({ file: false });
									deviceDone(instance);
								}
							).catch(
								function (err) {
									try {
										_isInterrupted = true;
										_errors.push(Error('⛔ Unable to emulate ' + JSON.stringify(device)));
										Application.consoleOptions({ file: true });
										console.error('⛔ Unable to emulate device ; ' + err.message, device);
										Application.consoleOptions({ file: false });
										deviceDone(instance);
									} catch (err) {
										console.error(err);
									}
								}
							);
						} else {
							instanceHandler(instance, () => {
								deviceDone(instance);
							});
						}
					}, err => {
						_isInterrupted = true;
						_errors.push(Error('⛔ Unable to obtain page ; ' + err.message));
						Application.consoleOptions({ file: true });
						console.error(err);
						Application.consoleOptions({ file: false });
						deviceDone(instance);
					}).catch(err => {
						try {
							_isInterrupted = true;
							_errors.push(Error('⛔ Unable to obtain page ; ' + err.message));
							Application.consoleOptions({ file: true });
							console.error(err);
							Application.consoleOptions({ file: false });
							deviceDone(instance);
						} catch (err) {
							console.error(err);
						}
					});
			}, (err) => {
				_errors.push(err);
				_isInterrupted = true;
				Application.consoleOptions({ file: true });
				console.error(err);
				Application.consoleOptions({ file: false });
			}).catch((err) => {
				try {
					_errors.push(err);
					_isInterrupted = true;
					Application.consoleOptions({ file: true });
					console.error(err);
					Application.consoleOptions({ file: false });
				} catch (err) {
					console.error(err);
				}
			});
		},
		function () {
			if (_errors.length) {
				console.info('\x1b[31;1m' + _failed + ' Tests failed\x1b[0m');
				if (_skipped)
					console.info('\x1b[33;1m' + _skipped + ' skipped\x1b[0m');

				if (_fallenDevices.length)
				console.info('\x1b[31;1mUnsupported devices: \x1b[0m', _fallenDevices);
			} else if (_warns || _skipped) {
					console.log('\x1b[33;1m' + _warns + ' Tests failed\x1b[0m');
				if (_skipped)
					console.info('\x1b[33;1m' + _skipped + ' skipped\x1b[0m');
			} else {
				console.info('\x1b[32;1m Done tests for ' + devices.length + ' devices passed\x1b[0m');
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
};