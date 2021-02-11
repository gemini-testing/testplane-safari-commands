'use strict';

const {PNG} = require('pngjs');
const concat = require('concat-stream');
const streamifier = require('streamifier');
const {calcWebViewCoords, getPixelRatio} = require('../command-helpers/element-utils');
const {runInNativeContext} = require('../command-helpers/context-switcher');
const debug = require('debug')('hermione-safari-commands:screenshot');

module.exports = (browser) => {
    const baseScreenshotFn = browser.screenshot;

    browser.addCommand('screenshot', async () => {
        try {
            debug(`before get body width for sessionId: ${browser.requestHandler.sessionID}`);
            const {width: bodyWidth} = await browser.getElementSize('body');
            debug(`got bodyWidth: ${bodyWidth} for sessionId: ${browser.requestHandler.sessionID}`);
            const pixelRatio = await getPixelRatio(browser);
            debug(`got pixelRatio: ${pixelRatio} for sessionId: ${browser.requestHandler.sessionID}`);
            const cropCoords = await runInNativeContext(browser, {fn: calcWebViewCoords, args: [browser, {bodyWidth, pixelRatio}]});
            debug(`got cropCoords: ${JSON.stringify(cropCoords)} for sessionId: ${browser.requestHandler.sessionID}`);

            const {value: base64} = await baseScreenshotFn.call(this);
            debug(`got base64 image for sessionId: ${browser.requestHandler.sessionID}`);

            return new Promise((resolve, reject) => {
                const handleError = (msg) => (err) => {
                    debug(`before reject error: ${err} with message: ${msg} for sessionId: ${browser.requestHandler.sessionID}`);
                    return reject(`Error occured while ${msg}: ${err.message}`);
                };

                debug(`before create createReadStream for sessionId: ${browser.requestHandler.sessionID}`);
                streamifier.createReadStream(Buffer.from(base64, 'base64'))
                    .on('error', handleError('converting buffer to readable stream'))
                    .pipe(new PNG())
                    .on('error', handleError('writing buffer to png data'))
                    .on('parsed', function() {
                        debug(`before create destination for sessionId: ${browser.requestHandler.sessionID}`);
                        const destination = new PNG({width: cropCoords.width, height: cropCoords.height});
                        debug(`after create destination: ${destination} for sessionId: ${browser.requestHandler.sessionID}`);

                        try {
                            debug(`before bitblt for sessionId: ${browser.requestHandler.sessionID}`);
                            this.bitblt(destination, cropCoords.left, cropCoords.top, cropCoords.width, cropCoords.height);
                            debug(`after bitblt for sessionId: ${browser.requestHandler.sessionID}`);
                        } catch (err) {
                            reject(`Error occured while copying pixels from source to destination png: ${err.message}`);
                        }

                        debug(`before pack destination: ${browser.requestHandler.sessionID}`);
                        destination.pack()
                            .on('error', handleError('packing png data to buffer'))
                            .pipe(concat((buffer) => {
                                debug(`before resolve value for sessionId: ${browser.requestHandler.sessionID}`);
                                const newBase64 = buffer.toString('base64');

                                if (bodyWidth > cropCoords.webViewSize.width) {
                                    debug(`=====> initial base64 for sessionId: ${browser.requestHandler.sessionID}, base64: ${base64}`);
                                    debug(`=====> cropped base64 for sessionId: ${browser.requestHandler.sessionID}, croppedBade64:: ${newBase64}`);
                                }

                                return resolve({value: newBase64});
                            }))
                            .on('error', handleError('concatenating png data to a single buffer'));
                    });
            });
        } catch (err) {
            debug(`catched error ${err} for sessionId: ${browser.requestHandler.sessionID}`);
            throw err;
        }
    }, true);
};
