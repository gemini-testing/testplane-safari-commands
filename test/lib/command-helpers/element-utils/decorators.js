'use strict';

const proxyquire = require('proxyquire');
const {mkBrowser_} = require('../../../utils');

describe('"element-utils" decorators', () => {
    let browser, decorators, actionFn, getTestContext, runInNativeContext;

    beforeEach(() => {
        browser = mkBrowser_();
        actionFn = sinon.stub().named('action.fn').resolves();
        getTestContext = sinon.stub().returns({});
        runInNativeContext = sinon.stub().resolves({});

        decorators = proxyquire('lib/command-helpers/element-utils/decorators', {
            '../test-context': {getTestContext},
            '../context-switcher': {runInNativeContext}
        });
    });

    afterEach(() => sinon.restore());

    describe('"withExisting" decorator', () => {
        describe('should check if an element with passed locator exists', () => {
            [
                {name: 'action args passed as string', args: 'some-locator'},
                {name: 'action args passed as array of strings', args: ['some-locator']}
            ].forEach(({name, args}) => {
                it(`${name}`, async () => {
                    const elem = await browser.$();
                    const action = {fn: actionFn, args};

                    await decorators.withExisting.call(browser, action);

                    assert.calledOnceWith(elem.isExisting);
                });
            });
        });

        describe('element does not exist', () => {
            it('should return default value if element does not exist', async () => {
                const elem = await browser.$();
                elem.isExisting.resolves(false);
                const defaultValue = {width: 0, height: 0};
                const action = {fn: actionFn, args: 'some-locator', default: defaultValue};

                const result = await decorators.withExisting.call(browser, action);

                assert.equal(result, defaultValue);
            });

            it('should not call passed action', async () => {
                const elem = await browser.$();
                elem.isExisting.resolves(false);
                const action = {fn: actionFn, args: 'some-locator'};

                await decorators.withExisting.call(browser, action);

                assert.notCalled(actionFn);
            });
        });

        describe('element exists', () => {
            it('should call passed action', async () => {
                const elem = await browser.$();
                elem.isExisting.resolves(true);
                const action = {fn: actionFn, args: 'some-locator'};

                await decorators.withExisting.call(browser, action);

                assert.calledOn(actionFn, browser);
                assert.calledOnceWith(actionFn, action.args);
            });

            it('should return result from calling passed action', async () => {
                const elem = await browser.$();
                elem.isExisting.resolves(true);
                actionFn.resolves({foo: 'bar'});
                const action = {fn: actionFn, args: 'some-locator'};

                const result = await decorators.withExisting.call(browser, action);

                assert.deepEqual(result, {foo: 'bar'});
            });
        });
    });

    describe('"withNativeCtx" decorator', () => {
        it('should call passed action in native context', async () => {
            const action = {fn: actionFn, args: ['some-arg']};

            await decorators.withNativeCtx.call(browser, action);

            assert.calledOnceWith(runInNativeContext, browser, action);
        });
    });

    describe('"withTestCtxMemo" decorator', () => {
        describe('passed key is not memoized in test context', () => {
            it('should call passed action', async () => {
                const action = {fn: actionFn, args: ['some-arg']};

                await decorators.withTestCtxMemo.call(browser, action, 'some-key');

                assert.calledOn(actionFn, browser);
                assert.calledOnceWith(actionFn, ...action.args);
            });

            it('should return result from calling passed action', async () => {
                actionFn.resolves({foo: 'bar'});
                const action = {fn: actionFn, args: ['some-arg']};

                const result = await decorators.withTestCtxMemo.call(browser, action, 'some-key');

                assert.deepEqual(result, {foo: 'bar'});
            });

            it('should memoize result from calling passed action', async () => {
                const testCtx = {};
                getTestContext.withArgs(browser.executionContext).returns(testCtx);

                actionFn.resolves({foo: 'bar'});
                const action = {fn: actionFn, args: ['some-arg']};

                await decorators.withTestCtxMemo.call(browser, action, 'some-key');

                assert.deepEqual(testCtx['some-key'], {foo: 'bar'});
            });
        });

        describe('passed key is memoized in test context', () => {
            beforeEach(() => {
                getTestContext.withArgs(browser.executionContext).returns({'some-key': 'some-value'});
            });

            it('should not call passed action', async () => {
                const action = {fn: actionFn, args: ['some-arg']};

                await decorators.withTestCtxMemo.call(browser, action, 'some-key');

                assert.notCalled(actionFn);
            });

            it('should return memoized value', async () => {
                const action = {fn: actionFn, args: ['some-arg']};

                const result = await decorators.withTestCtxMemo.call(browser, action, 'some-key');

                assert.equal(result, 'some-value');
            });
        });
    });
});
