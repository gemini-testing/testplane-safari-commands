'use strict';

const _ = require('lodash');
const parseConfig = require('./config');
const browserCommands = require('./commands');

module.exports = (hermione, opts) => {
    const pluginConfig = parseConfig(opts);

    if (!pluginConfig.enabled) {
        return;
    }

    if (!hermione.isWorker()) {
        hermione.on(hermione.events.SESSION_START, async (browser, {browserId}) => {
            // Clicking into the fake input before tests started
            // to fix bug with caret-color https://bugs.webkit.org/show_bug.cgi?id=228859
            if (Object.keys(pluginConfig.browsers).includes(browserId)) {
                await browser.execute(function() {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'text');
                    document.body.append(input);
                    input.focus();
                });
            }
        });

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
