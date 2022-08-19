'use strict';

const {PassThrough} = require('stream');
const {PNG} = require('pngjs');
const concat = require('concat-stream');
const streamifier = require('streamifier');
const proxyquire = require('proxyquire');

const {getElementUtils} = require('lib/command-helpers/element-utils');
const {mkBrowser_} = require('../../utils');

describe('"screenshot" command', () => {
    let wrapScreenshotCommand, browser, pngCtor, runInNativeContext, elementUtils;

    const mkReadStream_ = ({chunk} = {}) => {
        const mockReadStream = new PassThrough();

        chunk && mockReadStream.push(chunk);
        mockReadStream.end();

        return mockReadStream;
    };

    beforeEach(() => {
        browser = mkBrowser_();
        pngCtor = sinon.stub().named('pngCtor');
        runInNativeContext = sinon.stub().named('runInNativeContext').returns({});
        elementUtils = getElementUtils(browser);

        wrapScreenshotCommand = proxyquire('lib/commands/screenshot', {
            pngjs: {PNG: pngCtor.returns(Object.create(PNG.prototype))},
            '../command-helpers/context-switcher': {runInNativeContext}
        });

        sinon.stub(elementUtils, 'calcWebViewCoords').named('calcWebViewCoords');
        sinon.stub(elementUtils, 'getPixelRatio').named('getPixelRatio').returns(1);

        sinon.stub(PNG.prototype, 'bitblt');
        sinon.stub(PNG.prototype, 'end');
        sinon.stub(PNG.prototype, 'pack').returns(mkReadStream_({chunk: 'default-data'}));
        sinon.stub(PNG.prototype, 'write').callsFake(function(val) {
            this.emit('parsed', val);
        });
    });

    afterEach(() => sinon.restore());

    it('should wrap "takeScreenshot" command', () => {
        wrapScreenshotCommand(browser, {elementUtils});

        assert.calledOnceWith(browser.overwriteCommand, 'takeScreenshot', sinon.match.func);
    });

    it('should capture the whole page using base "takeScreenshot" command before starting to handle it', async () => {
        const buf = Buffer.from('screenshot-data');
        const baseTakeScreenshotFn = browser.takeScreenshot.resolves(buf.toString('base64'));

        sinon.spy(streamifier, 'createReadStream');
        wrapScreenshotCommand(browser, {elementUtils});

        await browser.takeScreenshot();

        assert.callOrder(baseTakeScreenshotFn, streamifier.createReadStream.withArgs(buf));
    });

    it('should convert destination png data to base64 buffer', async () => {
        const buf = Buffer.from('screenshot-data');
        const base64Buf = buf.toString('base64');
        browser.takeScreenshot.resolves(base64Buf);

        PNG.prototype.pack.returns(mkReadStream_({chunk: buf}));
        wrapScreenshotCommand(browser, {elementUtils});

        const result = await browser.takeScreenshot();

        assert.equal(result, base64Buf);
    });

    describe('should handle the error if', () => {
        it('converting image buffer to readable stream is failed', async () => {
            const readStream = new PassThrough();
            sinon.stub(readStream, '_read').callsFake(() => readStream.emit('error', new Error('o.O')));
            sinon.stub(streamifier, 'createReadStream').returns(readStream);

            wrapScreenshotCommand(browser, {elementUtils});

            await assert.isRejected(browser.takeScreenshot(), 'Error occured while converting buffer to readable stream: o.O');
        });

        it('writing image buffer to png data is failed', async () => {
            const writeStream = new PassThrough();
            sinon.stub(writeStream, '_write').callsFake(() => writeStream.emit('error', new Error('o.O')));
            pngCtor.onFirstCall().returns(writeStream);

            wrapScreenshotCommand(browser, {elementUtils});

            await assert.isRejected(browser.takeScreenshot(), 'Error occured while writing buffer to png data: o.O');
        });

        it('copying pixels from source to destination png', async () => {
            PNG.prototype.bitblt.throws(new Error('o.O'));

            wrapScreenshotCommand(browser, {elementUtils});

            await assert.isRejected(browser.takeScreenshot(), 'Error occured while copying pixels from source to destination png: o.O');
        });

        it('packing png data to buffer is failed', async () => {
            const readStream = new PassThrough();
            sinon.stub(readStream, '_read').callsFake(() => readStream.emit('error', new Error('o.O')));
            PNG.prototype.pack.returns(readStream);

            wrapScreenshotCommand(browser, {elementUtils});

            await assert.isRejected(browser.takeScreenshot(), 'Error occured while packing png data to buffer: o.O');
        });

        it('concatenating png data to a single buffer is failed', async () => {
            sinon.stub(concat.prototype, '_write').callsFake(function() {
                this.emit('error', new Error('o.O'));
            });

            wrapScreenshotCommand(browser, {elementUtils});

            await assert.isRejected(browser.takeScreenshot(), 'Error occured while concatenating png data to a single buffer: o.O');
        });
    });
});
