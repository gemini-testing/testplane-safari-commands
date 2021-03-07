'use strict';

const {PassThrough} = require('stream');
const {PNG} = require('pngjs');
const concat = require('concat-stream');
const streamifier = require('streamifier');
const proxyquire = require('proxyquire');

const {mkBrowser_} = require('../../utils');

describe('"screenshot" command', () => {
    let wrapScreenshotCommand, browser, pngCtor, calcWebViewCoords, getPixelRatio, runInNativeContext, isWdioLatest;

    const mkReadStream_ = ({chunk} = {}) => {
        const mockReadStream = new PassThrough();

        chunk && mockReadStream.push(chunk);
        mockReadStream.end();

        return mockReadStream;
    };

    beforeEach(() => {
        browser = mkBrowser_();
        pngCtor = sinon.stub().named('pngCtor');
        calcWebViewCoords = sinon.stub().named('calcWebViewCoords');
        getPixelRatio = sinon.stub().named('getPixelRatio').returns(1);
        runInNativeContext = sinon.stub().named('runInNativeContext').returns({});
        isWdioLatest = sinon.stub().named('isWdioLatest').returns(false);

        wrapScreenshotCommand = proxyquire('lib/commands/screenshot', {
            pngjs: {PNG: pngCtor.returns(Object.create(PNG.prototype))},
            '../command-helpers/element-utils': {calcWebViewCoords, getPixelRatio},
            '../command-helpers/context-switcher': {runInNativeContext},
            '../utils': {isWdioLatest}
        });

        sinon.stub(PNG.prototype, 'bitblt');
        sinon.stub(PNG.prototype, 'end');
        sinon.stub(PNG.prototype, 'pack').returns(mkReadStream_({chunk: 'default-data'}));
        sinon.stub(PNG.prototype, 'write').callsFake(function(val) {
            this.emit('parsed', val);
        });
    });

    afterEach(() => sinon.restore());

    describe('executed with latest wdio', () => {
        beforeEach(() => {
            isWdioLatest.returns(true);
        });

        it('should wrap "takeScreenshot" command', () => {
            wrapScreenshotCommand(browser);

            assert.calledOnceWith(browser.addCommand, 'takeScreenshot', sinon.match.func, true);
        });

        it('should capture the whole page using base "takeScreenshot" command before starting to handle it', async () => {
            const buf = Buffer.from('screenshot-data');
            const baseTakeScreenshotFn = browser.takeScreenshot.resolves(buf.toString('base64'));
            isWdioLatest.returns(true);

            sinon.spy(streamifier, 'createReadStream');
            wrapScreenshotCommand(browser);

            await browser.takeScreenshot();

            assert.callOrder(baseTakeScreenshotFn, streamifier.createReadStream.withArgs(buf));
        });
    });

    describe('executed with old wdio', () => {
        beforeEach(() => {
            isWdioLatest.returns(false);
        });

        it('should capture the whole page using base "screenshot" command before starting to handle it', async () => {
            const buf = Buffer.from('screenshot-data');
            const baseScreenshotFn = browser.screenshot.resolves({value: buf.toString('base64')});

            sinon.spy(streamifier, 'createReadStream');
            wrapScreenshotCommand(browser);

            await browser.screenshot();

            assert.callOrder(baseScreenshotFn, streamifier.createReadStream.withArgs(buf));
        });

        it('should wrap "screenshot" command', () => {
            wrapScreenshotCommand(browser);

            assert.calledOnceWith(browser.addCommand, 'screenshot', sinon.match.func, true);
        });
    });

    it('should create source png stream without options', async () => {
        wrapScreenshotCommand(browser);

        await browser.screenshot();

        assert.calledWithExactly(pngCtor.firstCall);
    });

    it('should create destination png stream with "width" and "height" of calculated web view', async () => {
        browser.getElementSize.withArgs('body').resolves({width: 100});
        getPixelRatio.withArgs(browser).resolves(2);
        runInNativeContext
            .withArgs(browser, {fn: calcWebViewCoords, args: [browser, {bodyWidth: 100, pixelRatio: 2}]})
            .resolves({width: 200, height: 300});

        wrapScreenshotCommand(browser);

        await browser.screenshot();

        assert.calledWithExactly(pngCtor.secondCall, {width: 200, height: 300});
    });

    it('should copy pixels from source to destination png by passed coordinates', async () => {
        browser.getElementSize.withArgs('body').resolves({width: 100});
        getPixelRatio.withArgs(browser).resolves(2);
        runInNativeContext
            .withArgs(browser, {fn: calcWebViewCoords, args: [browser, {bodyWidth: 100, pixelRatio: 2}]})
            .resolves({left: 50, top: 75, width: 200, height: 300});

        const src = Object.create(PNG.prototype);
        const dst = Object.create(PNG.prototype);
        pngCtor
            .withArgs().returns(src)
            .withArgs({width: 200, height: 300}).returns(dst);

        wrapScreenshotCommand(browser);

        await browser.screenshot();

        assert.calledOnceWith(src.bitblt, dst, 50, 75, 200, 300);
    });

    describe('executed with latest wdio', () => {
        it('should convert destination png data to base64 buffer', async () => {
            const buf = Buffer.from('screenshot-data');
            const base64Buf = buf.toString('base64');
            browser.takeScreenshot.resolves(base64Buf);
            isWdioLatest.returns(true);

            PNG.prototype.pack.returns(mkReadStream_({chunk: buf}));
            wrapScreenshotCommand(browser);

            const result = await browser.takeScreenshot();

            assert.equal(result, base64Buf);
        });
    });

    describe('executed with old wdio', () => {
        it('should convert destination png data to base64 buffer', async () => {
            const buf = Buffer.from('screenshot-data');
            const base64Buf = buf.toString('base64');
            browser.screenshot.resolves({value: base64Buf});
            isWdioLatest.returns(false);

            PNG.prototype.pack.returns(mkReadStream_({chunk: buf}));
            wrapScreenshotCommand(browser);

            const result = await browser.screenshot();

            assert.deepEqual(result, {value: base64Buf});
        });
    });

    describe('should handle the error if', () => {
        it('converting image buffer to readable stream is failed', async () => {
            const readStream = new PassThrough();
            sinon.stub(readStream, '_read').callsFake(() => readStream.emit('error', new Error('o.O')));
            sinon.stub(streamifier, 'createReadStream').returns(readStream);

            wrapScreenshotCommand(browser);

            await assert.isRejected(browser.screenshot(), 'Error occured while converting buffer to readable stream: o.O');
        });

        it('writing image buffer to png data is failed', async () => {
            const writeStream = new PassThrough();
            sinon.stub(writeStream, '_write').callsFake(() => writeStream.emit('error', new Error('o.O')));
            pngCtor.onFirstCall().returns(writeStream);

            wrapScreenshotCommand(browser);

            await assert.isRejected(browser.screenshot(), 'Error occured while writing buffer to png data: o.O');
        });

        it('copying pixels from source to destination png', async () => {
            PNG.prototype.bitblt.throws(new Error('o.O'));

            wrapScreenshotCommand(browser);

            await assert.isRejected(browser.screenshot(), 'Error occured while copying pixels from source to destination png: o.O');
        });

        it('packing png data to buffer is failed', async () => {
            const readStream = new PassThrough();
            sinon.stub(readStream, '_read').callsFake(() => readStream.emit('error', new Error('o.O')));
            PNG.prototype.pack.returns(readStream);

            wrapScreenshotCommand(browser);

            await assert.isRejected(browser.screenshot(), 'Error occured while packing png data to buffer: o.O');
        });

        it('concatenating png data to a single buffer is failed', async () => {
            sinon.stub(concat.prototype, '_write').callsFake(function() {
                this.emit('error', new Error('o.O'));
            });

            wrapScreenshotCommand(browser);

            await assert.isRejected(browser.screenshot(), 'Error occured while concatenating png data to a single buffer: o.O');
        });
    });
});
