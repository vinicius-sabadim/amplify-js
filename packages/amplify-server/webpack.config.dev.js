var config = require('./webpack.config.js');

var entry = {
	'amplify-server': './lib-esm/index.js',
};
module.exports = Object.assign(config, { entry, mode: 'development' });
