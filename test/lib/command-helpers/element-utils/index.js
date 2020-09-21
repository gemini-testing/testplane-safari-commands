'use strict';

const proxyquire = require('proxyquire');
const {mkBrowser_} = require('../../../utils');
const {TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION, WEB_VIEW_SIZE, PIXEL_RATIO} = require('lib/command-helpers/test-context');
const {TOP_TOOLBAR, BOTTOM_TOOLBAR, WEB_VIEW} = require('lib/native-locators');

describe('"element-utils" helper', () => {
    let browser, utils, withExisting, withNativeCtx, withTestCtxMemo;

    beforeEach(() => {
        browser = mkBrowser_();

        withExisting = sinon.stub().named('withExisting').resolves({});
        withNativeCtx = sinon.stub().named('withNativeCtx').resolves({});
        withTestCtxMemo = sinon.stub().named('withTestCtxMemo').resolves({});

        utils = proxyquire('lib/command-helpers/element-utils', {
            './decorators': {withExisting, withNativeCtx, withTestCtxMemo}
        });
    });

    afterEach(() => sinon.restore());

    describe('"getTopToolbarHeight" method', () => {
        it('should wrap base action to "withExisting" wrapper', async () => {
            const action = {fn: browser.getElementSize, args: TOP_TOOLBAR, default: {width: 0, height: 0}};

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

    describe('"getBottomToolbarY" method', () => {
        it('should wrap base action to "withExisting" wrapper', async () => {
            const action = {fn: browser.getLocation, args: BOTTOM_TOOLBAR, default: {x: 0, y: 0}};

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
            withTestCtxMemo.resolves({x: 1, y: 2});

            const y = await utils.getBottomToolbarY(browser);

            assert.equal(y, 2);
        });
    });

    describe('"getWebViewSize" method', () => {
        it('should wrap base action to "withNativeCtx" wrapper', async () => {
            const action = {fn: browser.getElementSize, args: WEB_VIEW};

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
            withTestCtxMemo.resolves({width: 1, height: 2});

            const size = await utils.getWebViewSize(browser);

            assert.deepEqual(size, {width: 1, height: 2});
        });
    });

    describe('"getElemCoords" method', () => {
        beforeEach(() => {
            sinon.stub(utils, 'getTopToolbarHeight').returns(0);
        });

        it('should return element coords', async () => {
            browser.getElementSize.withArgs('some-selector').returns({width: 10, height: 20});
            browser.getLocation.withArgs('some-selector').returns({x: 1, y: 2});

            const coords = await utils.getElemCoords(browser, 'some-selector');

            assert.deepEqual(coords, {width: 10, height: 20, x: 1, y: 2});
        });

        it('should return coords of first found element', async () => {
            browser.getElementSize.withArgs('some-selector').returns(
                [{width: 10, height: 20}, {width: 100, height: 200}]
            );
            browser.getLocation.withArgs('some-selector').returns(
                [{x: 1, y: 2}, {x: 11, y: 22}]
            );

            const coords = await utils.getElemCoords(browser, 'some-selector');

            assert.deepEqual(coords, {width: 10, height: 20, x: 1, y: 2});
        });

        it('should increase y coordinate on top toolbar height', async () => {
            utils.getTopToolbarHeight.returns(10);
            browser.getLocation.withArgs('some-selector').returns({x: 1, y: 2});

            const coords = await utils.getElemCoords(browser, 'some-selector');

            assert.equal(coords.y, 12);
        });
    });

    describe('"getElemCenterLocation" method', () => {
        it('should return center coords of passed selector', async () => {
            sinon.stub(utils, 'getElemCoords')
                .withArgs(browser, 'some-selector')
                .returns({width: 10, height: 20, x: 1.1, y: 2.9});

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

        it('should return pixel ratio value from wrapped action', async () => {
            browser.execute.resolves({value: 100500});

            await utils.getPixelRatio(browser);

            const baseAction = withTestCtxMemo.firstCall.args[0];
            const pixelRatio = await baseAction.fn();

            assert.equal(pixelRatio, 100500);
        });
    });

    describe('"calcWebViewCoords" method', () => {
        beforeEach(() => {
            sinon.stub(utils, 'getTopToolbarHeight').withArgs(browser).returns(0);
            sinon.stub(utils, 'getBottomToolbarY').withArgs(browser).returns(0);
            sinon.stub(utils, 'getWebViewSize').withArgs(browser).returns({height: 0, width: 0});
        });

        describe('should correctly calc web view "width"', () => {
            it('with multiply passed body width by passed pixel ratio', async () => {
                const {width} = await utils.calcWebViewCoords(browser, {bodyWidth: 100, pixelRatio: 2});

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

        describe('should correctly calc web view "left" coord', () => {
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

        describe('should correctly calc web view "top" coord', () => {
            it('with multiply top toolbar height by passed pixel ratio', async () => {
                utils.getTopToolbarHeight.withArgs(browser).returns(2);

                const {top} = await utils.calcWebViewCoords(browser, {pixelRatio: 2});

                assert.equal(top, 4);
            });
        });

        it('should return "width", "height", "left" and "top" coords', async () => {
            const coords = await utils.calcWebViewCoords(browser);

            assert.hasAllKeys(coords, ['width', 'height', 'left', 'top']);
        });
    });
});
