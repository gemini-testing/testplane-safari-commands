'use strict';

const _ = require('lodash');
const {runInNativeContext} = require('lib/command-helpers/context-switcher');
const {mkBrowser_} = require('../../utils');
const {NATIVE_CONTEXT} = require('lib/constants');

describe('"context-switcher" helper', () => {
    let browser, actionFn;

    const runInContext_ = async (browser, action = {}, testCtx = {}) => {
        action = _.defaults(action, {fn: actionFn, args: 'default-args'});

        return await runInNativeContext(browser, action, testCtx);
    };

    beforeEach(() => {
        browser = mkBrowser_();
        actionFn = sinon.stub().named('action.fn').resolves();
    });

    afterEach(() => sinon.restore());

    describe('runInNativeContext', () => {
        describe('"webViewContext" is not specified in test context', () => {
            it('should get current contexts', async () => {
                await runInContext_(browser);

                assert.calledOnceWith(browser.contexts);
            });

            it('should set "webViewContext" to test context', async () => {
                const testCtx = {};
                browser.contexts.resolves({value: [NATIVE_CONTEXT, 'WEBVIEW_12345']});

                await runInContext_(browser, {}, testCtx);

                assert.equal(testCtx.webViewContext, 'WEBVIEW_12345');
            });

            it('should get current contexts before switching to native context', async () => {
                await runInContext_(browser);

                assert.callOrder(
                    browser.contexts,
                    browser.context.withArgs(NATIVE_CONTEXT)
                );
            });
        });

        describe('"webViewContext" is specified in test context', () => {
            it('should not get current contexts', async () => {
                const testCtx = {webViewContext: 'WEBVIEW_12345'};

                await runInContext_(browser, {}, testCtx);

                assert.notCalled(browser.contexts);
            });
        });

        it(`should switch context to "${NATIVE_CONTEXT}" before performing action`, async () => {
            await runInContext_(browser, {args: 'foo-bar'});

            assert.callOrder(
                browser.context.withArgs(NATIVE_CONTEXT),
                actionFn.withArgs('foo-bar')
            );
        });

        it('should switch context to webview after performing action', async () => {
            browser.contexts.resolves({value: [NATIVE_CONTEXT, 'WEBVIEW_12345']});

            await runInContext_(browser, {args: 'foo-bar'});

            assert.callOrder(
                actionFn.withArgs('foo-bar'),
                browser.context.withArgs('WEBVIEW_12345')
            );
        });

        it('should correctly perform action with few arguments', async () => {
            await runInContext_(browser, {args: ['foo', ['bar']]});

            assert.calledOn(actionFn, browser);
            assert.calledOnceWith(actionFn, 'foo', ['bar']);
        });

        it('should return result of the action performing', async () => {
            actionFn.withArgs('foo-bar').resolves('some-result');

            const result = await runInContext_(browser, {args: 'foo-bar'});

            assert.equal(result, 'some-result');
        });
    });
});
