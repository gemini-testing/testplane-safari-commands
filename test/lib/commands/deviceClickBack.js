'use strict';

const proxyquire = require('proxyquire');
const {DEVICE_BACK} = require('lib/native-locators');
const {mkBrowser_} = require('../../utils');

describe('"deviceClickBack" command', () => {
    let browser, addDeviceClickBack, runInNativeContext;

    beforeEach(() => {
        browser = mkBrowser_();
        runInNativeContext = sinon.stub().named('runInNativeContext');

        addDeviceClickBack = proxyquire('lib/commands/deviceClickBack', {
            '../command-helpers/context-switcher': {runInNativeContext}
        });
    });

    afterEach(() => sinon.restore());

    it('should add command "deviceClickBack"', () => {
        addDeviceClickBack(browser);

        assert.calledOnceWith(browser.addCommand, 'deviceClickBack', sinon.match.func, true);
    });

    it('should run "click" action with correct args in native context', async () => {
        addDeviceClickBack(browser);

        await browser.deviceClickBack();

        assert.calledOnceWith(runInNativeContext,
            browser,
            {fn: browser.click, args: [DEVICE_BACK, {unwrap: true}]}
        );
    });
});
