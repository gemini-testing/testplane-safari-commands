'use strict';

const {PNG} = require('pngjs');
const concat = require('concat-stream');
const streamifier = require('streamifier');
const {calcWebViewCoords, getPixelRatio} = require('../command-helpers/element-utils');
const {runInNativeContext} = require('../command-helpers/context-switcher');
const {isWdioLatest} = require('../utils');

module.exports = (browser) => {
    const baseScreenshotFn = browser.screenshot;

    browser.addCommand('screenshot', async () => {
        const {width: bodyWidth} = await browser.getElementSize('body');
        const pixelRatio = await getPixelRatio(browser);
        const cropCoords = await runInNativeContext(browser, {fn: calcWebViewCoords, args: [browser, {bodyWidth, pixelRatio}]});

        const screenshotResult = await baseScreenshotFn.call(this);
        const base64 = isWdioLatest(browser) ? screenshotResult : screenshotResult.value;

        return new Promise((resolve, reject) => {
            const handleError = (msg) => (err) => reject(`Error occured while ${msg}: ${err.message}`);

            streamifier.createReadStream(Buffer.from(base64, 'base64'))
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
                            const result = isWdioLatest(browser) ? strBase64 : {value: strBase64};

                            resolve(result);
                        }))
                        .on('error', handleError('concatenating png data to a single buffer'));
                });
        });
    }, true);
};
