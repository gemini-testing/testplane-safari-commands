'use strict';

const _ = require('lodash');
const proxyquire = require('proxyquire');
const {mkBrowser_} = require('../../utils');
const {NATIVE_CONTEXT} = require('lib/constants');
const {IS_NATIVE_CTX, WEB_VIEW_CTX} = require('lib/command-helpers/test-context');

describe('"context-switcher" helper', () => {
    let browser, actionFn, getTestContext, runInNativeContext, isWdioLatest;

    const runInContext_ = async (browser, action = {}, testCtx) => {
        action = _.defaults(action, {fn: actionFn, args: 'default-args'});

        return await runInNativeContext(browser, action, testCtx);
    };

    beforeEach(() => {
        browser = mkBrowser_();
        actionFn = sinon.stub().named('action.fn').resolves();
        getTestContext = sinon.stub().named('getTestContext').returns({});
        isWdioLatest = sinon.stub().named('isWdioLatest').returns(false);

        runInNativeContext = proxyquire('lib/command-helpers/context-switcher', {
            './test-context': {getTestContext},
            '../utils': {isWdioLatest}
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
                assert.notCalled(browser.context);
                assert.notCalled(browser.contexts);
            });

            it('should return result from calling passed action', async () => {
                actionFn.resolves({foo: 'bar'});
                const action = {fn: actionFn, args: ['some-arg']};

                const result = await runInContext_(browser, action);

                assert.deepEqual(result, {foo: 'bar'});
            });
        });

        describe(`"${WEB_VIEW_CTX}" is not specified in test context`, () => {
            it('should get current contexts', async () => {
                await runInContext_(browser);

                assert.calledOnceWith(browser.contexts);
            });

            [
                {name: 'latest', contexts: [NATIVE_CONTEXT, 'WEBVIEW_12345'], isWdioLatestRes: true},
                {name: 'old', contexts: {value: [NATIVE_CONTEXT, 'WEBVIEW_12345']}, isWdioLatestRes: false}
            ].forEach(({name, contexts, isWdioLatestRes}) => {
                describe(`executed with ${name} wdio`, () => {
                    it(`should set "${WEB_VIEW_CTX}" to test context`, async () => {
                        const testCtx = {};
                        browser.contexts.resolves(contexts);
                        isWdioLatest.returns(isWdioLatestRes);

                        await runInContext_(browser, {}, testCtx);

                        assert.equal(testCtx[WEB_VIEW_CTX], 'WEBVIEW_12345');
                    });
                });
            });

            it('should get current contexts before switching to native context', async () => {
                await runInContext_(browser);

                assert.callOrder(
                    browser.contexts,
                    browser.context.withArgs(NATIVE_CONTEXT)
                );
            });
        });

        describe(`"${WEB_VIEW_CTX}" is specified in test context`, () => {
            it('should not get current contexts', async () => {
                const testCtx = {[WEB_VIEW_CTX]: 'WEBVIEW_12345'};

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

            browser.contexts.resolves({value: [NATIVE_CONTEXT, 'WEBVIEW_12345']});
            browser.context.withArgs('WEBVIEW_12345').callsFake(() => {
                isNativeCtxBefore = testCtx[IS_NATIVE_CTX];
            });

            await runInContext_(browser, {}, testCtx);

            assert.isTrue(isNativeCtxBefore);
            assert.isFalse(testCtx[IS_NATIVE_CTX]);
        });
    });
});
