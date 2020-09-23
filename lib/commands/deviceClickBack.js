'use strict';

const {runInNativeContext} = require('../command-helpers/context-switcher');
const {DEVICE_BACK} = require('../native-locators');

module.exports = (browser) => {
    browser.addCommand('deviceClickBack', async () => {
        const action = {fn: browser.click, args: [DEVICE_BACK, {unwrap: true}]};

        await runInNativeContext(browser, action);
    }, true);
};
