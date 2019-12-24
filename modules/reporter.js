module.exports = {
	logArguments : (args) => {
		args = Array.prototype.slice.call(args);
		let message = '';

		let _log = function (item) {
			let message = '';
			switch (typeof(item)) {
				case "string":
					message += '\x1b[32m' + JSON.stringify(item) + '\x1b[0m';
				break;
				case "boolean":
					message += '\x1b[34m' + JSON.stringify(item) + '\x1b[0m';
				break;
				case "number":
					message += '\x1b[33m' + JSON.stringify(item) + '\x1b[0m';
				break;
				case "function":
					message += '\x1b[32m ' + item.toString().replace(/\{[\s\S]*\}/, '{ ... }') + '\x1b[0m';
				break;
				case "object":
					if (Array.isArray(item)) {
						message  += '\x1b[37m[\x1b[0m ';
						let items = [];
						item.forEach(val => {
							items.push(_log(val));
						});
						message += items.join(', ') + ' \x1b[37m]\x1b[0m';
					} else if (item) {
						message += '\x1b[37m{\x1b[0m ';
						let prop, items = [];
						for (prop in item) {
							items.push(_log(prop + "") + ': ' + _log(item[prop]));
						}
						message += items.join(', ') + ' \x1b[37m}\x1b[0m';
					} else {
						message += '\x1b[31m' + JSON.stringify(item) + '\x1b';
					}
				break;
				default:
					message += ( item + '' );
				break;
			}

			return message;
		};

		message += args.map(item => {
			return _log(item)
		}).join(', ');

		return message + '\x1b[0m';
	}
}