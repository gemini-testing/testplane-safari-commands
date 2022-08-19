'use strict';

const proxyquire = require('proxyquire');
const {mkBrowser_} = require('../../../utils');
const {BOTTOM_TOOLBAR_LOCATION, WEB_VIEW_SIZE, PIXEL_RATIO} = require('lib/command-helpers/test-context');
const {getNativeLocators} = require('lib/native-locators');

describe('common "element-utils" helper', () => {
    let browser, utils, withExisting, withNativeCtx, withTestCtxMemo;
    let BOTTOM_TOOLBAR, WEB_VIEW;

    const mkUtilsStub = (nativeLocators) => {
        const CommonUtils = proxyquire('lib/command-helpers/element-utils/common', {
            '../decorators': {withExisting, withNativeCtx, withTestCtxMemo}
        });

        sinon.stub(CommonUtils.prototype, 'getTopToolbarHeight').returns(0);

        return new CommonUtils(nativeLocators);
    };

    beforeEach(() => {
        browser = mkBrowser_();

        withExisting = sinon.stub().named('withExisting').resolves({});
        withNativeCtx = sinon.stub().named('withNativeCtx').resolves({});
        withTestCtxMemo = sinon.stub().named('withTestCtxMemo').resolves({});

        const nativeLocators = getNativeLocators(browser);

        utils = mkUtilsStub(nativeLocators);
        BOTTOM_TOOLBAR = nativeLocators.BOTTOM_TOOLBAR;
        WEB_VIEW = nativeLocators.WEB_VIEW;
    });

    afterEach(() => sinon.restore());

    describe('"getBottomToolbarY" method', () => {
        it('should wrap base action to "withExisting" wrapper', async () => {
            const action = {fn: utils.getLocation, args: [browser, BOTTOM_TOOLBAR], default: {x: 0, y: 0}};

            await utils.getBottomToolbarY(browser);

            const existingWrapper = withTestCtxMemo.firstCall.args[0].args;
            assert.deepEqual(existingWrapper, {fn: withExisting, args: action});
        });

        it('should wrap "withExisting" wrapper to "withNativeCtx" wrapper', async () => {
            await utils.getBottomToolbarY(browser);

            const checkBroCtxWrapper = withTestCtxMemo.firstCall.args[0];
            assert.equal(checkBroCtxWrapper.fn, withNativeCtx);
            assert.equal(checkBroCtxWrapper.args.fn, withExisting);
        });

        it('should call "withTestCtxMemo" wrapper with correct args', async () => {
            await utils.getBottomToolbarY(browser);

            assert.calledOn(withTestCtxMemo, browser);
            assert.calledOnceWith(withTestCtxMemo, sinon.match({fn: withNativeCtx}), BOTTOM_TOOLBAR_LOCATION);
        });

        it('should return bottom toolbar "y" coord from "withTestCtxMemo" wrapper', async () => {
            withTestCtxMemo.withArgs(sinon.match.any, BOTTOM_TOOLBAR_LOCATION).resolves({x: 1, y: 2});

            const y = await utils.getBottomToolbarY(browser);

            assert.equal(y, 2);
        });
    });

    describe('"getWebViewSize" method', () => {
        it('should wrap base action to "withNativeCtx" wrapper', async () => {
            const action = {fn: utils.getElementSize, args: [browser, WEB_VIEW]};

            await utils.getWebViewSize(browser);

            const checkBroCtxWrapper = withTestCtxMemo.firstCall.args[0];
            assert.deepEqual(checkBroCtxWrapper, {fn: withNativeCtx, args: action});
        });

        it('should call "withTestCtxMemo" wrapper with correct args', async () => {
            await utils.getWebViewSize(browser);

            assert.calledOn(withTestCtxMemo, browser);
            assert.calledOnceWith(withTestCtxMemo, sinon.match({fn: withNativeCtx}), WEB_VIEW_SIZE);
        });

        it('should return web view size from "withTestCtxMemo" wrapper', async () => {
            withTestCtxMemo.withArgs(sinon.match.any, WEB_VIEW_SIZE).resolves({width: 1, height: 2});

            const size = await utils.getWebViewSize(browser);

            assert.deepEqual(size, {width: 1, height: 2});
        });
    });

    describe('"getElemCoords" method', () => {
        it('should return element coords', async () => {
            const elementStub = {
                selector: '.selector',
                getSize: () => ({width: 10, height: 20}),
                getLocation: () => ({x: 1, y: 2})
            };
            browser.$.withArgs('.selector').returns(elementStub);

            const coords = await utils.getElemCoords(browser, '.selector');

            assert.deepEqual(coords, {width: 10, height: 20, x: 1, y: 2});
        });

        it('should increase y coordinate on top toolbar height', async () => {
            utils.getTopToolbarHeight.returns(10);
            const elementStub = {
                selector: 'some-selector',
                getLocation: () => ({x: 1, y: 2}),
                getSize: () => ({})
            };
            browser.$.withArgs('some-selector').returns(elementStub);

            const coords = await utils.getElemCoords(browser, 'some-selector');

            assert.equal(coords.y, 12);
        });
    });

    describe('"getElemCenterLocation" method', () => {
        it('should return center coords of passed selector', async () => {
            const elementStub = {
                selector: 'some-selector',
                getLocation: () => ({x: 1.1, y: 2.9}),
                getSize: () => ({width: 10, height: 20})
            };
            browser.$.withArgs('some-selector').returns(elementStub);

            const coords = await utils.getElemCenterLocation(browser, 'some-selector');
            assert.deepEqual(coords, {x: 6, y: 13});
        });
    });

    describe('"getPixelRatio" method', () => {
        it('should call "withTestCtxMemo" wrapper with correct args', async () => {
            await utils.getPixelRatio(browser);

            assert.calledOn(withTestCtxMemo, browser);
            assert.calledOnceWith(withTestCtxMemo, {fn: sinon.match.func}, PIXEL_RATIO);
        });

        it('should return pixel ratio from wrapped action', async () => {
            browser.execute.resolves(100500);

            await utils.getPixelRatio(browser);

            const baseAction = withTestCtxMemo.firstCall.args[0];
            const pixelRatio = await baseAction.fn();

            assert.equal(pixelRatio, 100500);
        });
    });

    describe('"calcWebViewCoords" method', () => {
        beforeEach(() => {
            sinon.stub(utils, 'getBottomToolbarY').withArgs(browser).returns(0);
            sinon.stub(utils, 'getWebViewSize').withArgs(browser).returns({height: 0, width: 0});
        });

        describe('web view "width" coord', () => {
            it('should calc with multiply body width by pixel ratio', async () => {
                utils.getWebViewSize.withArgs(browser).returns({width: 200});

                const {width} = await utils.calcWebViewCoords(browser, {bodyWidth: 100, pixelRatio: 2});

                assert.equal(width, 200);
            });

            it('should calc with multiplye web view width by pixel ratio', async () => {
                utils.getWebViewSize.withArgs(browser).returns({width: 100});

                const {width} = await utils.calcWebViewCoords(browser, {bodyWidth: 200, pixelRatio: 2});

                assert.equal(width, 200);
            });
        });

        describe('should correctly calc web view "height"', () => {
            it('if bottom toolbar exists and top toolbar does not', async () => {
                utils.getBottomToolbarY.withArgs(browser).returns(10);
                utils.getWebViewSize.withArgs(browser).returns({height: 12});

                const {height} = await utils.calcWebViewCoords(browser, {pixelRatio: 1});

                assert.equal(height, 10);
            });

            it('if top toolbar exists and bottom toolbar does not', async () => {
                utils.getTopToolbarHeight.withArgs(browser).returns(2);
                utils.getWebViewSize.withArgs(browser).returns({height: 12});

                const {height} = await utils.calcWebViewCoords(browser, {pixelRatio: 1});

                assert.equal(height, 10);
            });

            it('with multiply web view height by passed pixel ration', async () => {
                utils.getWebViewSize.withArgs(browser).returns({height: 5});

                const {height} = await utils.calcWebViewCoords(browser, {pixelRatio: 2});

                assert.equal(height, 10);
            });
        });

        describe('web view "left" coord', () => {
            describe('should correctly calc', () => {
                it('with substract passed body width from web view width and take half of it', async () => {
                    utils.getWebViewSize.withArgs(browser).returns({width: 20});

                    const {left} = await utils.calcWebViewCoords(browser, {bodyWidth: 10});

                    assert.equal(left, 5);
                });

                it('with multiply real web view width by passed pixel ratio', async () => {
                    utils.getWebViewSize.withArgs(browser).returns({width: 20});

                    const {left} = await utils.calcWebViewCoords(browser, {bodyWidth: 10, pixelRatio: 2});

                    assert.equal(left, 10);
                });
            });

            it('should set to zero if calculated coord is negative', async () => {
                utils.getWebViewSize.withArgs(browser).returns({width: 10});

                const {left} = await utils.calcWebViewCoords(browser, {bodyWidth: 20});

                assert.equal(left, 0);
            });
        });

        describe('web view "top" coord', () => {
            it('should correctly calc with multiply top toolbar height by passed pixel ratio', async () => {
                utils.getTopToolbarHeight.withArgs(browser).returns(2);

                const {top} = await utils.calcWebViewCoords(browser, {pixelRatio: 2});

                assert.equal(top, 4);
            });

            it('should set to zero if calculated coord is negative', async () => {
                utils.getTopToolbarHeight.withArgs(browser).returns(-10);

                const {top} = await utils.calcWebViewCoords(browser, {pixelRatio: 1});

                assert.equal(top, 0);
            });
        });

        it('should return "width", "height", "left" and "top" coords', async () => {
            const coords = await utils.calcWebViewCoords(browser);

            assert.hasAllKeys(coords, ['width', 'height', 'left', 'top']);
        });
    });
});
