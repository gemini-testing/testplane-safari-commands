const proxyquire = require('proxyquire');
const {mkBrowser_} = require('../../../utils');
const {getNativeLocators} = require('lib/native-locators');
const {TOP_TOOLBAR_SIZE} = require('lib/command-helpers/test-context');

describe('old-safari "element-utils"', () => {
    let browser, utils, withExisting, withNativeCtx, withTestCtxMemo;
    let TOP_TOOLBAR;

    const mkUtilsStub = (nativeLocators) => {
        const SafariOldUtils = proxyquire('lib/command-helpers/element-utils/<v15.0', {
            '../decorators': {withExisting, withNativeCtx, withTestCtxMemo}
        });

        return new SafariOldUtils(nativeLocators);
    };

    beforeEach(() => {
        browser = mkBrowser_();

        withExisting = sinon.stub().named('withExisting').resolves({});
        withNativeCtx = sinon.stub().named('withNativeCtx').resolves({});
        withTestCtxMemo = sinon.stub().named('withTestCtxMemo').resolves({});

        const nativeLocators = getNativeLocators(browser);

        utils = mkUtilsStub(nativeLocators);
        TOP_TOOLBAR = nativeLocators.TOP_TOOLBAR;
    });

    afterEach(() => sinon.restore());

    describe('"getTopToolbarHeight" method', () => {
        it('should wrap base action to "withExisting" wrapper', async () => {
            const action = {fn: utils.getElementSize, args: [browser, TOP_TOOLBAR], default: {width: 0, height: 0}};

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

        it('should return top toolbar "height" size from "withTestCtxMemo" wrapper', async () => {
            withTestCtxMemo.resolves({width: 1, height: 2});

            const height = await utils.getTopToolbarHeight(browser);

            assert.equal(height, 2);
        });
    });
});
