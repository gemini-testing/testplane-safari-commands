'use strict';

const _ = require('lodash');
const parseConfig = require('./config');
const browserCommands = require('./commands');
const {WEB_VIEW_CTX} = require('./command-helpers/test-context');
const {getNativeLocators} = require('./native-locators');
const {getElementUtils} = require('./command-helpers/element-utils');

module.exports = (hermione, opts) => {
    const pluginConfig = parseConfig(opts);

    if (!pluginConfig.enabled) {
        return;
    }

    if (!hermione.isWorker()) {
        hermione.on(hermione.events.SESSION_START, async (browser, {browserId}) => {
            if (_.isEmpty(getBrowserPluginCfg(pluginConfig, browserId))) {
                return;
            }

            // Clicking into the fake input before tests started
            // to fix bug with caret-color https://bugs.webkit.org/show_bug.cgi?id=228859
            await browser.execute(function() {
                const input = document.createElement('input');
                input.setAttribute('type', 'text');
                document.body.append(input);
                input.focus();
            });

            const contexts = await browser.getContexts();

            await browser.extendOptions({[WEB_VIEW_CTX]: contexts[1]});
        });

        return;
    }

    hermione.on(hermione.events.NEW_BROWSER, (browser, {browserId}) => {
        const {commands = []} = getBrowserPluginCfg(pluginConfig, browserId);

        if (_.isEmpty(commands)) {
            return;
        }

        const broConfig = hermione.config.forBrowser(browserId);

        if (commands.includes('screenshot') && !commands.includes('orientation')) {
            commands.push('orientation');
        }

        const nativeLocators = getNativeLocators(broConfig);
        const elementUtils = getElementUtils(broConfig, nativeLocators);
        commands.forEach((commandName) => {
            if (!browserCommands[commandName]) {
                throw new TypeError(`Can not find "${commandName}" command`);
            }

            browserCommands[commandName](browser, {config: broConfig, nativeLocators, elementUtils});
        });
    });

    hermione.on(hermione.events.AFTER_TESTS_READ, (collection) => {
        collection.eachRootSuite((root, browserId) => {
            if (_.isEmpty(getBrowserPluginCfg(pluginConfig, browserId))) {
                return;
            }

            const {testsPerSession} = hermione.config.forBrowser(browserId);
            const isTestRunsInOneSession = testsPerSession === 1;

            if (isTestRunsInOneSession) {
                return;
            }

            root.beforeEach(async function() {
                await this.browser.switchContext(this.browser.options[WEB_VIEW_CTX]);
            });
        });
    });
};

function getBrowserPluginCfg(pluginConfig, browserId) {
    return _.get(pluginConfig, `browsers[${browserId}]`, {});
}
