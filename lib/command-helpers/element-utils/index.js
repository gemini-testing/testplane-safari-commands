'use strict';

const _ = require('lodash');
const {withExisting, withNativeCtx, withTestCtxMemo} = require('./decorators');
const {TOP_TOOLBAR_SIZE, BOTTOM_TOOLBAR_LOCATION, WEB_VIEW_SIZE, PIXEL_RATIO} = require('../test-context');
const {TOP_TOOLBAR, BOTTOM_TOOLBAR, WEB_VIEW} = require('../../native-locators');
const debug = require('debug')('hermione-safari-commands:command-helpers');

exports.getTopToolbarHeight = async (browser) => {
    debug(`before call getTopToolbarHeight for sessionId: ${browser.requestHandler.sessionID}`);
    const action = {fn: browser.getElementSize, args: TOP_TOOLBAR, default: {width: 0, height: 0}};
    const existingWrapper = {fn: withExisting, args: action};
    const inNativeCtxWrapper = {fn: withNativeCtx, args: existingWrapper};

    const res = (await withTestCtxMemo.call(browser, inNativeCtxWrapper, TOP_TOOLBAR_SIZE)).height;

    debug(`after call getTopToolbarHeight: ${res} for sessionId: ${browser.requestHandler.sessionID}`);

    return res;
};

exports.getBottomToolbarY = async (browser) => {
    debug(`before call "getBottomToolbarY" for sessionId: ${browser.requestHandler.sessionID}`);
    const action = {fn: browser.getLocation, args: BOTTOM_TOOLBAR, default: {x: 0, y: 0}};
    const existingWrapper = {fn: withExisting, args: action};
    const inNativeCtxWrapper = {fn: withNativeCtx, args: existingWrapper};

    const res = (await withTestCtxMemo.call(browser, inNativeCtxWrapper, BOTTOM_TOOLBAR_LOCATION)).y;

    debug(`after call "getBottomToolbarY": ${res} for sessionId: ${browser.requestHandler.sessionID}`);

    return res;
};

exports.getWebViewSize = async (browser) => {
    debug(`before call "getWebViewSize" for sessionId: ${browser.requestHandler.sessionID}`);
    const action = {fn: browser.getElementSize, args: WEB_VIEW};
    const inNativeCtxWrapper = {fn: withNativeCtx, args: action};

    const res = await withTestCtxMemo.call(browser, inNativeCtxWrapper, WEB_VIEW_SIZE);

    debug(`after call "getWebViewSize": ${JSON.stringify(res)} for sessionId: ${browser.requestHandler.sessionID}`);

    return res;
};

exports.getElemCoords = async (browser, selector) => {
    const [size, location] = await Promise.all([browser.getElementSize(selector), browser.getLocation(selector)]);
    const {width, height} = _.isArray(size) ? size[0] : size;
    const {x, y} = _.isArray(location) ? location[0] : location;

    const topToolbarHeight = await exports.getTopToolbarHeight(browser);

    return {width, height, x, y: y + topToolbarHeight};
};

exports.getElemCenterLocation = async (browser, selector) => {
    const {width, height, x, y} = await exports.getElemCoords(browser, selector);

    return {
        x: Math.round(x + width / 2),
        y: Math.round(y + height / 2)
    };
};

exports.getPixelRatio = async (browser) => {
    const action = {fn: async () => (await browser.execute(() => window.devicePixelRatio)).value};

    return await withTestCtxMemo.call(browser, action, PIXEL_RATIO);
};

exports.calcWebViewCoords = async (browser, {bodyWidth, pixelRatio = 1} = {}) => {
    const [topToolbarHeight, bottomToolbarY, webViewSize] = await Promise.all([
        exports.getTopToolbarHeight(browser),
        exports.getBottomToolbarY(browser),
        exports.getWebViewSize(browser)
    ]);
    debug(`after get web view coords topToolbarHeight: ${topToolbarHeight}, bottomToolbarY: ${bottomToolbarY}, webViewSize: ${JSON.stringify(webViewSize)} with for sessionId: ${browser.requestHandler.sessionID}`);
    const bottomToolbarHeight = bottomToolbarY > 0 ? webViewSize.height - bottomToolbarY : 0;
    debug(`calculated bottomToolbarHeight: ${bottomToolbarHeight} for sessionId: ${browser.requestHandler.sessionID}`);

    return {
        width: Math.ceil(bodyWidth * pixelRatio),
        height: Math.ceil((webViewSize.height - topToolbarHeight - bottomToolbarHeight) * pixelRatio),
        left: Math.max(Math.floor((webViewSize.width - bodyWidth) / 2 * pixelRatio), 0),
        top: Math.max(Math.floor(topToolbarHeight * pixelRatio), 0),
        webViewSize
    };
};
