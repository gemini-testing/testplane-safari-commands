'use strict';

const _ = require('lodash');
const {withExisting, withNativeCtx, withTestCtxMemo} = require('../decorators');
const {WEB_VIEW_SIZE, BOTTOM_TOOLBAR_LOCATION, PIXEL_RATIO} = require('../../test-context');
const {isWdioLatest} = require('../../../utils');

module.exports = class CommonUtils {
    constructor(nativeLocators) {
        this._nativeLocators = nativeLocators;
    }

    async getBottomToolbarY(browser) {
        const {BOTTOM_TOOLBAR} = this._nativeLocators;
        const action = {fn: browser.getLocation, args: BOTTOM_TOOLBAR, default: {x: 0, y: 0}};
        const existingWrapper = {fn: withExisting, args: action};
        const inNativeCtxWrapper = {fn: withNativeCtx, args: existingWrapper};

        return (await withTestCtxMemo.call(browser, inNativeCtxWrapper, BOTTOM_TOOLBAR_LOCATION)).y;
    }

    async getWebViewSize(browser) {
        const {WEB_VIEW} = this._nativeLocators;
        const action = {fn: browser.getElementSize, args: WEB_VIEW};
        const inNativeCtxWrapper = {fn: withNativeCtx, args: action};

        return await withTestCtxMemo.call(browser, inNativeCtxWrapper, WEB_VIEW_SIZE);
    }

    async getElemCoords(browser, selector) {
        const [size, location] = await Promise.all([browser.getElementSize(selector), browser.getLocation(selector)]);
        const {width, height} = _.isArray(size) ? size[0] : size;
        // wdio returns elements in reverse order, so we need to take the last element in the array to pick first element on the page
        // https://github.com/webdriverio/webdriverio/blob/v4.14.1/lib/commands/getLocation.js#L48.
        const {x, y} = _.isArray(location) ? location[location.length - 1] : location;

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

    async getPixelRatio(browser) {
        const action = {fn: async () => {
            const result = await browser.execute(() => window.devicePixelRatio);

            return isWdioLatest(browser) ? result : result.value;
        }};

        return await withTestCtxMemo.call(browser, action, PIXEL_RATIO);
    }

    async calcWebViewCoords(browser, {bodyWidth, pixelRatio = 1} = {}) {
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

    getTopToolbarHeight() {
        throw new Error('Not implemented');
    }
};
