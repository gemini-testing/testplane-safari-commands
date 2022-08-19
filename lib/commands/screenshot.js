'use strict';

const {PNG} = require('pngjs');
const concat = require('concat-stream');
const streamifier = require('streamifier');
const {runInNativeContext} = require('../command-helpers/context-switcher');

module.exports = (browser, {elementUtils}) => {
    browser.overwriteCommand('takeScreenshot', async (baseScreenshotFn) => {
        const {width: bodyWidth} = await elementUtils.getElementSize(browser, 'body');
        const pixelRatio = await elementUtils.getPixelRatio(browser);
        const cropCoords = await runInNativeContext(browser, {fn: elementUtils.calcWebViewCoords.bind(elementUtils), args: [browser, {bodyWidth, pixelRatio}]});
        const screenshotResult = await baseScreenshotFn();

        return new Promise((resolve, reject) => {
            const handleError = (msg) => (err) => reject(`Error occured while ${msg}: ${err.message}`);

            streamifier.createReadStream(Buffer.from(screenshotResult, 'base64'))
                .on('error', handleError('converting buffer to readable stream'))
                .pipe(new PNG())
                .on('error', handleError('writing buffer to png data'))
                .on('parsed', function() {
                    const destination = new PNG({width: cropCoords.width, height: cropCoords.height});

                    try {
                        this.bitblt(destination, cropCoords.left, cropCoords.top, cropCoords.width, cropCoords.height);
                    } catch (err) {
                        reject(`Error occured while copying pixels from source to destination png: ${err.message}`);
                    }

                    destination.pack()
                        .on('error', handleError('packing png data to buffer'))
                        .pipe(concat((buffer) => {
                            const strBase64 = buffer.toString('base64');

                            resolve(strBase64);
                        }))
                        .on('error', handleError('concatenating png data to a single buffer'));
                });
        });
    });
};
