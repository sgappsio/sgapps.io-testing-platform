module.exports = {
	logArguments : (args) => {
		args = Array.prototype.slice.call(args);
		let message = '';

		let _log = function (item) {
			let message = '';
			switch (typeof(item)) {
				case "string":
					message += '\033[32m' + JSON.stringify(item) + '\033[0m';
				break;
				case "boolean":
					message += '\033[34m' + JSON.stringify(item) + '\033[0m';
				break;
				case "number":
					message += '\033[33m' + JSON.stringify(item) + '\033[0m';
				break;
				case "function":
					message += '\033[32m ' + item.toString().replace(/\{[\s\S]*\}/, '{ ... }') + '\033[0m';
				break;
				case "object":
					if (Array.isArray(item)) {
						message  += '\033[37m[\033[0m ';
						let items = [];
						item.forEach(val => {
							items.push(_log(val));
						});
						message += items.join(', ') + ' \033[37m]\033[0m';
					} else if (item) {
						message += '\033[37m{\033[0m ';
						let prop, items = [];
						for (prop in item) {
							items.push(_log(prop + "") + ': ' + _log(item[prop]));
						}
						message += items.join(', ') + ' \033[37m}\033[0m';
					} else {
						message += '\033[31m' + JSON.stringify(item) + '\033';
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

		return message + '\033[0m';
	}
}