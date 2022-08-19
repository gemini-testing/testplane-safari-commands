'use strict';

const CommonUtils = require('../common');

const {withExisting, withNativeCtx, withTestCtxMemo} = require('../decorators');
const {TOP_TOOLBAR_SIZE} = require('../../test-context');

module.exports = class SafariOldUtils extends CommonUtils {
    async getTopToolbarHeight(browser) {
        const {TOP_TOOLBAR} = this._nativeLocators;
        const action = {fn: this.getElementSize, args: [browser, TOP_TOOLBAR], default: {width: 0, height: 0}};
        const existingWrapper = {fn: withExisting, args: action};
        const inNativeCtxWrapper = {fn: withNativeCtx, args: existingWrapper};

        return (await withTestCtxMemo.call(browser, inNativeCtxWrapper, TOP_TOOLBAR_SIZE)).height;
    }
};
