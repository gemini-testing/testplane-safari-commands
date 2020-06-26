'use strict';

const proxyquire = require('proxyquire');
const {mkBrowser_} = require('../../utils');
const {TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION, WEB_VIEW_SIZE} = require('lib/command-helpers/test-context');

describe('"orientation" command', () => {
    let browser, addOrientationCommand, resetTestContextValues;

    beforeEach(() => {
        browser = mkBrowser_();
        resetTestContextValues = sinon.stub();

        addOrientationCommand = proxyquire('lib/commands/orientation', {
            '../command-helpers/test-context': {resetTestContextValues}
        });
    });

    afterEach(() => sinon.restore());

    it('should add "orientation" command', () => {
        addOrientationCommand(browser);

        assert.calledOnceWith(browser.addCommand, 'orientation', sinon.match.func, true);
    });

    it('should pass through call to base "orientation" command', async () => {
        const baseOrientationFn = browser.orientation;
        addOrientationCommand(browser);

        await browser.orientation('portrait');

        assert.calledOn(baseOrientationFn, browser);
        assert.calledOnceWith(baseOrientationFn, 'portrait');
    });

    it('should reset toolbar and web view values in test context if "orientation" is passed', async () => {
        addOrientationCommand(browser);

        await browser.orientation('landscape');

        assert.calledOnceWith(
            resetTestContextValues,
            browser.executionContext,
            [TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION, WEB_VIEW_SIZE]
        );
    });

    describe('should not reset toolbar and web view values in test context if', () => {
        it('"orientation" is not passed', async () => {
            addOrientationCommand(browser);

            await browser.orientation();

            assert.notCalled(resetTestContextValues);
        });

        it('"browser.executionContext" is not inited yet', async () => {
            browser.executionContext = undefined;
            addOrientationCommand(browser);

            await browser.orientation('landscape');

            assert.notCalled(resetTestContextValues);
        });
    });
});
