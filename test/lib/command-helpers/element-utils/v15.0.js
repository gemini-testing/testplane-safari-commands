const proxyquire = require('proxyquire');
const {mkBrowser_} = require('../../../utils');
const {getNativeLocators} = require('lib/native-locators');
const {TOP_TOOLBAR_SIZE} = require('lib/command-helpers/test-context');

describe('new-safari "element-utils"', () => {
    let browser, utils, withExisting, withNativeCtx, withTestCtxMemo, isWdioLatest;
    let VIEW_PORT;

    const mkUtilsStub = (nativeLocators) => {
        const Safari15Utils = proxyquire('lib/command-helpers/element-utils/v15.0', {
            '../decorators': {withExisting, withNativeCtx, withTestCtxMemo},
            '../../../utils': {isWdioLatest}
        });

        return new Safari15Utils(nativeLocators);
    };

    beforeEach(() => {
        browser = mkBrowser_({version: '15.0'});

        withExisting = sinon.stub().named('withExisting').resolves({});
        withNativeCtx = sinon.stub().named('withNativeCtx').resolves({});
        withTestCtxMemo = sinon.stub().named('withTestCtxMemo').resolves({});
        isWdioLatest = sinon.stub().named('isWdioLatest').returns(false);

        const nativeLocators = getNativeLocators(browser);

        utils = mkUtilsStub(nativeLocators);

        VIEW_PORT = nativeLocators.VIEW_PORT;
    });

    afterEach(() => sinon.restore());

    describe('"getTopToolbarHeight" method', () => {
        it('should wrap base action to "withExisting" wrapper', async () => {
            const action = {fn: browser.getLocation, args: VIEW_PORT, default: {x: 0, y: 0}};

            await utils.getTopToolbarHeight(browser);

            const existingWrapper = withTestCtxMemo.firstCall.args[0].args;
            assert.deepEqual(existingWrapper, {fn: withExisting, args: action});
        });

        it('should wrap "withExisting" wrapper to "withNativeCtx" wrapper', async () => {
            await utils.getTopToolbarHeight(browser);

            const checkBroCtxWrapper = withTestCtxMemo.firstCall.args[0];
            assert.equal(checkBroCtxWrapper.fn, withNativeCtx);
            assert.equal(checkBroCtxWrapper.args.fn, withExisting);
        });

        it('should call "withTestCtxMemo" wrapper with correct args', async () => {
            await utils.getTopToolbarHeight(browser);

            assert.calledOn(withTestCtxMemo, browser);
            assert.calledOnceWith(withTestCtxMemo, sinon.match({fn: withNativeCtx}), TOP_TOOLBAR_SIZE);
        });

        it('should return view port "y" position from "withTestCtxMemo" wrapper', async () => {
            withTestCtxMemo.resolves({x: 1, y: 2});

            const height = await utils.getTopToolbarHeight(browser);

            assert.equal(height, 2);
        });
    });
});
