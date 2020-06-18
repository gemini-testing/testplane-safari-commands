'use strict';

const _ = require('lodash');
const parseConfig = require('./config');
const browserCommands = require('./commands');

module.exports = (hermione, opts) => {
    const pluginConfig = parseConfig(opts);

    if (!pluginConfig.enabled || !hermione.isWorker()) {
        return;
    }

    hermione.on(hermione.events.NEW_BROWSER, (browser, {browserId}) => {
        const {commands = []} = _.get(pluginConfig, `browsers[${browserId}]`, {});
        const config = hermione.config.forBrowser(browserId);

        if (commands.includes('screenshot') && !commands.includes('orientation')) {
            commands.push('orientation');
        }

        commands.forEach((commandName) => {
            if (!browserCommands[commandName]) {
                throw new TypeError(`Can not find "${commandName}" command`);
            }

            browserCommands[commandName](browser, config);
        });
    });
};
