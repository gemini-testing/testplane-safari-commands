'use strict';

const _ = require('lodash');
const proxyquire = require('proxyquire');
const {mkBrowser_} = require('../../utils');
const {NATIVE_CONTEXT} = require('lib/constants');
const {IS_NATIVE_CTX, WEB_VIEW_CTX} = require('lib/command-helpers/test-context');

describe('"context-switcher" helper', () => {
    let browser, actionFn, getTestContext, runInNativeContext;

    const runInContext_ = async (browser, action = {}, testCtx) => {
        action = _.defaults(action, {fn: actionFn, args: 'default-args'});

        return await runInNativeContext(browser, action, testCtx);
    };

    beforeEach(() => {
        browser = mkBrowser_();
        browser.options = {[WEB_VIEW_CTX]: 'DEFAULT_WEBVIEW'};
        actionFn = sinon.stub().named('action.fn').resolves();
        getTestContext = sinon.stub().named('getTestContext').returns({});

        runInNativeContext = proxyquire('lib/command-helpers/context-switcher', {
            './test-context': {getTestContext}
        }).runInNativeContext;
    });

    afterEach(() => sinon.restore());

    describe('"runInNativeContext" method', () => {
        describe('test context', () => {
            it('should get test context if it is not specified', async () => {
                await runInContext_(browser);

                assert.calledOnceWith(getTestContext, browser.executionContext);
            });

            it('should not get test context if it is specified', async () => {
                const testCtx = {};

                await runInContext_(browser, {}, testCtx);

                assert.notCalled(getTestContext);
            });
        });

        describe('already in native context', () => {
            beforeEach(() => {
                getTestContext.withArgs(browser.executionContext).returns({[IS_NATIVE_CTX]: true});
            });

            it('should call action without switching to native context', async () => {
                const action = {fn: actionFn, args: ['some-arg']};

                await runInContext_(browser, action);

                assert.calledOnceWith(actionFn, ...action.args);
                assert.notCalled(browser.getContext);
                assert.notCalled(browser.getContexts);
            });

            it('should return result from calling passed action', async () => {
                actionFn.resolves({foo: 'bar'});
                const action = {fn: actionFn, args: ['some-arg']};

                const result = await runInContext_(browser, action);

                assert.deepEqual(result, {foo: 'bar'});
            });
        });

        it(`should switch context to "${NATIVE_CONTEXT}" before performing action`, async () => {
            await runInContext_(browser, {args: 'foo-bar'});

            assert.callOrder(
                browser.switchContext.withArgs(NATIVE_CONTEXT),
                actionFn.withArgs('foo-bar')
            );
        });

        it('should switch context to webview after performing action', async () => {
            browser.options[WEB_VIEW_CTX] = 'WEBVIEW_12345';

            await runInContext_(browser, {args: 'foo-bar'});

            assert.callOrder(
                actionFn.withArgs('foo-bar'),
                browser.switchContext.withArgs('WEBVIEW_12345')
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

        it(`should set "${IS_NATIVE_CTX}" to test context with "true" value before call action`, async () => {
            const testCtx = {};
            let isNativeCtx;

            actionFn.callsFake(() => {
                isNativeCtx = testCtx[IS_NATIVE_CTX];
            });

            await runInContext_(browser, {fn: actionFn}, testCtx);

            assert.isTrue(isNativeCtx);
        });

        it(`should set "${IS_NATIVE_CTX}" to test context with "false" value after change bro context to web`, async () => {
            const testCtx = {};
            let isNativeCtxBefore;

            browser.options[WEB_VIEW_CTX] = 'WEBVIEW_12345';
            browser.switchContext.withArgs('WEBVIEW_12345').callsFake(() => {
                isNativeCtxBefore = testCtx[IS_NATIVE_CTX];
            });

            await runInContext_(browser, {}, testCtx);

            assert.isTrue(isNativeCtxBefore);
            assert.isFalse(testCtx[IS_NATIVE_CTX]);
        });
    });
});
