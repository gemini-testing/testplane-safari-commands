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

        assert.calledOnceWith(browser.addCommand, 'deviceClickBack', sinon.match.func);
    });

    it('should run "click" action with correct args in native context', async () => {
        const {DEVICE_BACK} = getNativeLocators(browser);
        addDeviceClickBack(browser, {nativeLocators});
        const deviceBackButton = Object.assign({selector: DEVICE_BACK}, await browser.$());
        browser.$.withArgs(DEVICE_BACK).resolves(deviceBackButton);

        await browser.deviceClickBack();

        assert.calledOnceWith(runInNativeContext,
            browser,
            {fn: sinon.match.func, args: [{unwrap: true}]}
        );
    });
});
