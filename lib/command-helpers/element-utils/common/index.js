'use strict';

const {runInNativeContext} = require('../../context-switcher');
const {withExisting, withNativeCtx, withTestCtxMemo} = require('../decorators');
const {WEB_VIEW_SIZE, BOTTOM_TOOLBAR_LOCATION, PIXEL_RATIO} = require('../../test-context');

module.exports = class CommonUtils {
    constructor(nativeLocators, nativeElementsSize) {
        this._nativeLocators = nativeLocators;
        this._nativeElementsSize = nativeElementsSize;
    }

    async getLocation(browser, selector) {
        const elem = await browser.$(selector);
        return elem.getLocation();
    }

    async getElementSize(browser, selector) {
        const elem = await browser.$(selector);
        return elem.getSize();
    }

    async getBottomToolbarY(browser) {
        const {BOTTOM_TOOLBAR} = this._nativeLocators;
        const action = {fn: this.getLocation, args: [browser, BOTTOM_TOOLBAR], default: {x: 0, y: 0}};
        const existingWrapper = {fn: withExisting, args: action};
        const inNativeCtxWrapper = {fn: withNativeCtx, args: existingWrapper};

        return (await withTestCtxMemo.call(browser, inNativeCtxWrapper, BOTTOM_TOOLBAR_LOCATION)).y;
    }

    getWebViewSize(browser) {
        const {WEB_VIEW} = this._nativeLocators;
        const action = {fn: this.getElementSize, args: [browser, WEB_VIEW]};
        const inNativeCtxWrapper = {fn: withNativeCtx, args: action};

        return withTestCtxMemo.call(browser, inNativeCtxWrapper, WEB_VIEW_SIZE);
    }

    async getElemCoords(browser, selector) {
        const [size, location] = await Promise.all([this.getElementSize(browser, selector), this.getLocation(browser, selector)]);
        const {width, height} = size;
        const {x, y} = location;

        const topToolbarHeight = await this.getTopToolbarHeight(browser);

        return {width, height, x, y: y + topToolbarHeight};
    }

    async getElemCenterLocation(browser, selector) {
        const {width, height, x, y} = await this.getElemCoords(browser, selector);

        return {
            x: Math.round(x + width / 2),
            y: Math.round(y + height / 2)
        };
    }

    getPixelRatio(browser) {
        const action = {fn: () => {
            return browser.execute(() => window.devicePixelRatio);
        }};

        return withTestCtxMemo.call(browser, action, PIXEL_RATIO);
    }

    async calcWebViewCoordsNative(browser, {bodyWidth, pixelRatio = 1} = {}) {
        const [topToolbarHeight, bottomToolbarY, webViewSize] = await Promise.all([
            this.getTopToolbarHeight(browser),
            this.getBottomToolbarY(browser),
            this.getWebViewSize(browser)
        ]);

        const bottomToolbarHeight = bottomToolbarY > 0 ? webViewSize.height - bottomToolbarY : 0;

        return {
            width: Math.ceil(Math.min(webViewSize.width, bodyWidth) * pixelRatio),
            height: Math.ceil((webViewSize.height - topToolbarHeight - bottomToolbarHeight) * pixelRatio),
            left: Math.max(Math.floor((webViewSize.width - bodyWidth) / 2 * pixelRatio), 0),
            top: Math.max(Math.floor(topToolbarHeight * pixelRatio), 0)
        };
    }

    async calcWebViewCoords(browser, {bodyWidth, pixelRatio = 1} = {}) {
        if (!this._nativeElementsSize) {
            return runInNativeContext(browser, {
                fn: this.calcWebViewCoordsNative.bind(this),
                args: [browser, {bodyWidth, pixelRatio}]
            });
        }

        let {
            topToolbar: {height: topToolbarHeight},
            bottomToolbar: {height: bottomToolbarHeight},
            webview: {width: webviewWidth, height: webviewHeight}
        } = this._nativeElementsSize;

        if (await browser.getOrientation() === 'LANDSCAPE') {
            [webviewWidth, webviewHeight] = [webviewHeight, webviewWidth];
            topToolbarHeight = 0;
            bottomToolbarHeight = 0;
        }

        return {
            width: Math.ceil(Math.min(webviewWidth, bodyWidth) * pixelRatio),
            height: Math.ceil((webviewHeight - topToolbarHeight - bottomToolbarHeight) * pixelRatio),
            left: Math.max(Math.floor((webviewWidth - bodyWidth) / 2 * pixelRatio), 0),
            top: Math.max(Math.floor(topToolbarHeight * pixelRatio), 0)
        };
    }

    getTopToolbarHeight() {
        throw new Error('Not implemented');
    }
};
