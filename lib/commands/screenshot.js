'use strict';

const sharp = require('sharp');
const {runInNativeContext} = require('../command-helpers/context-switcher');

module.exports = (browser, {elementUtils}) => {
    browser.overwriteCommand('takeScreenshot', async (baseScreenshotFn) => {
        const {width: bodyWidth} = await elementUtils.getElementSize(browser, 'body');
        const pixelRatio = await elementUtils.getPixelRatio(browser);
        const cropCoords = await runInNativeContext(browser, {fn: elementUtils.calcWebViewCoords.bind(elementUtils), args: [browser, {bodyWidth, pixelRatio}]});
        const screenshotResult = await baseScreenshotFn();

        try {
            return await sharp(Buffer.from(screenshotResult, 'base64'))
                .extract(cropCoords)
                .toBuffer()
                .then(buf => buf.toString('base64'));
        } catch (e) {
            throw new Error(`Failed to take screenshot: ${e}`);
        }
    });
};
