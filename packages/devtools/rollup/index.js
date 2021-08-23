const config = require('./default');
const multi = require('./multi');

module.exports = {
    configuration: config(),
    customConfiguration: config,
    multipleInputConfiguration: multi,
};
