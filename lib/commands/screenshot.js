'use strict';

const sharp = require('sharp');

module.exports = (browser, {elementUtils}) => {
    browser.overwriteCommand('takeScreenshot', async (baseScreenshotFn) => {
        const {width: bodyWidth} = await elementUtils.getElementSize(browser, 'body');
        const pixelRatio = await elementUtils.getPixelRatio(browser);
        const cropCoords = await elementUtils.calcWebViewCoords(browser, {bodyWidth, pixelRatio});
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
