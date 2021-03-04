'use strict';

const proxyquire = require('proxyquire');
const {mkBrowser_} = require('../../utils');
const {TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION, WEB_VIEW_SIZE} = require('lib/command-helpers/test-context');

describe('"orientation" command', () => {
    let browser, addOrientationCommand, resetTestContextValues, isWdioLatest;

    beforeEach(() => {
        browser = mkBrowser_();
        resetTestContextValues = sinon.stub().named('resetTestContextValues');
        isWdioLatest = sinon.stub().named('isWdioLatest').returns(false);

        addOrientationCommand = proxyquire('lib/commands/orientation', {
            '../command-helpers/test-context': {resetTestContextValues},
            '../utils': {isWdioLatest}
        });
    });

    afterEach(() => sinon.restore());

    [
        {name: 'latest', cmdName: 'setOrientation', isWdioLatestRes: true},
        {name: 'old', cmdName: 'orientation', isWdioLatestRes: false}
    ].forEach(({name, cmdName, isWdioLatestRes}) => {
        describe(`executed with ${name} wdio`, () => {
            beforeEach(() => {
                isWdioLatest.returns(isWdioLatestRes);
            });

            it(`should add "${cmdName}" command`, () => {
                addOrientationCommand(browser);

                assert.calledOnceWith(browser.addCommand, cmdName, sinon.match.func, true);
            });

            it(`should pass through call to base "${cmdName}" command`, async () => {
                const baseOrientationFn = browser[cmdName];
                addOrientationCommand(browser);

                await browser[cmdName]('portrait');

                assert.calledOn(baseOrientationFn, browser);
                assert.calledOnceWith(baseOrientationFn, 'portrait');
            });

            it(`should reset toolbar and web view values in test context if "${cmdName}" is passed`, async () => {
                addOrientationCommand(browser);

                await browser[cmdName]('landscape');

                assert.calledOnceWith(
                    resetTestContextValues,
                    browser.executionContext,
                    [TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION, WEB_VIEW_SIZE]
                );
            });

            describe('should not reset toolbar and web view values in test context if', () => {
                it(`"${cmdName}" is not passed`, async () => {
                    addOrientationCommand(browser);

                    await browser[cmdName]();

                    assert.notCalled(resetTestContextValues);
                });

                it('"browser.executionContext" is not inited yet', async () => {
                    browser.executionContext = undefined;
                    addOrientationCommand(browser);

                    await browser[cmdName]('landscape');

                    assert.notCalled(resetTestContextValues);
                });
            });
        });
    });
});
