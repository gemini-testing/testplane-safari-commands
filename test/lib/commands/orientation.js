'use strict';

const proxyquire = require('proxyquire');
const {mkBrowser_} = require('../../utils');
const {TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION, WEB_VIEW_SIZE} = require('lib/command-helpers/test-context');

describe('"orientation" command', () => {
    let browser, overwriteOrientationCommand, resetTestContextValues;

    beforeEach(() => {
        browser = mkBrowser_();
        resetTestContextValues = sinon.stub().named('resetTestContextValues');

        overwriteOrientationCommand = proxyquire('lib/commands/orientation', {
            '../command-helpers/test-context': {resetTestContextValues}
        });
    });

    afterEach(() => sinon.restore());

    it('should overwrite "setOrientation" command', () => {
        overwriteOrientationCommand(browser);

        assert.calledOnceWith(browser.overwriteCommand, 'setOrientation', sinon.match.func);
    });

    it('should pass through call to base "setOrientation" command', async () => {
        const baseOrientationFn = browser.setOrientation;
        overwriteOrientationCommand(browser);

        await browser.setOrientation('portrait');

        assert.calledOnceWith(baseOrientationFn, 'portrait');
    });

    it('should reset toolbar and web view values in test context if "setOrientation" is passed', async () => {
        overwriteOrientationCommand(browser);

        await browser.setOrientation('landscape');

        assert.calledOnceWith(
            resetTestContextValues,
            browser.executionContext,
            [TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION, WEB_VIEW_SIZE]
        );
    });

    describe('should not reset toolbar and web view values in test context if', () => {
        it('"setOrientation" is not passed', async () => {
            overwriteOrientationCommand(browser);

            await browser.setOrientation();

            assert.notCalled(resetTestContextValues);
        });

        it('"browser.executionContext" is not inited yet', async () => {
            browser.executionContext = undefined;
            overwriteOrientationCommand(browser);

            await browser.setOrientation('landscape');

            assert.notCalled(resetTestContextValues);
        });
    });
});
