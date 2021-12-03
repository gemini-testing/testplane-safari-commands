'use strict';

const proxyquire = require('proxyquire');
const {getNativeLocators} = require('lib/native-locators');
const {mkBrowser_} = require('../../utils');

describe('"deviceClickBack" command', () => {
    let browser, addDeviceClickBack, runInNativeContext, nativeLocators;

    beforeEach(() => {
        browser = mkBrowser_();
        nativeLocators = getNativeLocators(browser);
        runInNativeContext = sinon.stub().named('runInNativeContext');

        addDeviceClickBack = proxyquire('lib/commands/deviceClickBack', {
            '../command-helpers/context-switcher': {runInNativeContext}
        });
    });

    afterEach(() => sinon.restore());

    it('should add command "deviceClickBack"', () => {
        addDeviceClickBack(browser, {nativeLocators});

        assert.calledOnceWith(browser.addCommand, 'deviceClickBack', sinon.match.func, true);
    });

    it('should run "click" action with correct args in native context', async () => {
        const {DEVICE_BACK} = getNativeLocators(browser);
        addDeviceClickBack(browser, {nativeLocators});

        await browser.deviceClickBack();

        assert.calledOnceWith(runInNativeContext,
            browser,
            {fn: browser.click, args: [DEVICE_BACK, {unwrap: true}]}
        );
    });
});
