'use strict';

const {runInNativeContext} = require('../command-helpers/context-switcher');

module.exports = (browser, {nativeLocators}) => {
    browser.addCommand('deviceClickBack', async function() {
        const {DEVICE_BACK} = nativeLocators;
        async function clickDeviceBack(opts = {}) {
            const deviceBackButton = await this.$(DEVICE_BACK);
            return deviceBackButton.click(opts);
        }
        const action = {fn: clickDeviceBack, args: [{unwrap: true}]};

        await runInNativeContext(browser, action);
    });
};
