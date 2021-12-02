const LoggerBuilder = require('sgapps-server/prototypes/logger');
const logger = new LoggerBuilder();
//@ts-ignore
module.exports = {
	logger: logger,
	prettyCliRow: function (params) {
		return Array.prototype.slice.call(
			params
		).map(function (item) {
			return logger.prettyCli.apply(logger, [item]).replace(/[\n\s]*\n[\n\s]*/g, ' ');
		}).join(', ');
	},
	logArguments : logger.log
};