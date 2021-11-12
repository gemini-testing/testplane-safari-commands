'use strict';

const {runInNativeContext} = require('../command-helpers/context-switcher');

module.exports = (browser, {nativeLocators}) => {
    browser.addCommand('deviceClickBack', async () => {
        const {DEVICE_BACK} = nativeLocators;
        const action = {fn: browser.click, args: [DEVICE_BACK, {unwrap: true}]};

        await runInNativeContext(browser, action);
    }, true);
};
