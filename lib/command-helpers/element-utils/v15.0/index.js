'use strict';

const CommonUtils = require('../common');

const {withExisting, withNativeCtx, withTestCtxMemo} = require('../decorators');
const {TOP_TOOLBAR_SIZE} = require('../../test-context');

module.exports = class Safari15Utils extends CommonUtils {
    async getTopToolbarHeight(browser) {
        const {VIEW_PORT} = this._nativeLocators;
        const action = {fn: browser.getLocation, args: VIEW_PORT, default: {x: 0, y: 0}};
        const existingWrapper = {fn: withExisting, args: action};
        const inNativeCtxWrapper = {fn: withNativeCtx, args: existingWrapper};

        return (await withTestCtxMemo.call(browser, inNativeCtxWrapper, TOP_TOOLBAR_SIZE)).y;
    }
};
