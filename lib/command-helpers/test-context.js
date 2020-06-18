'use strict';

const getTestContext = (context) => {
    return context.type === 'hook' && /^"before each"/.test(context.title)
        ? context.ctx.currentTest
        : context;
};

const resetTestContextValues = (context, keys = []) => {
    const testCtx = getTestContext(context);

    [].concat(keys).forEach((key) => {
        delete testCtx[key];
    });
};

module.exports = {
    getTestContext,
    resetTestContextValues,

    TOP_TOOLBAR_SIZE: 'topToolbarSize',
    BOTTOM_TOOLBAR_LOCATION: 'bottomToolbarLocation',
    WEB_VIEW_SIZE: 'webViewSize',
    IS_NATIVE_CTX: 'isNativeCtx',
    WEB_VIEW_CTX: 'webViewContext',
    PIXEL_RATIO: 'pixelRatio'
};
