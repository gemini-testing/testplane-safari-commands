'use strict';

const proxyquire = require('proxyquire');

const {getElementUtils} = require('lib/command-helpers/element-utils');
const {mkBrowser_} = require('../../utils');

describe('"screenshot" command', () => {
    let wrapScreenshotCommand, browser, calcWebViewCoordsStub, elementUtils, mockedSharp, mkSharpInstance;

    const mkSharpStub_ = () => {
        const stub = {};
        stub.toBuffer = sinon.stub().resolves(Buffer.from('default-data'));
        stub.extract = sinon.stub().returns(stub);

        return stub;
    };

    beforeEach(() => {
        browser = mkBrowser_();
        elementUtils = getElementUtils(browser);
        mockedSharp = mkSharpStub_();
        mkSharpInstance = sinon.stub().callsFake(() => mockedSharp);

        wrapScreenshotCommand = proxyquire('lib/commands/screenshot', {
            sharp: mkSharpInstance
        });

        calcWebViewCoordsStub = sinon.stub(elementUtils, 'calcWebViewCoords');
    });

    afterEach(() => sinon.restore());

    it('should wrap "takeScreenshot" command', () => {
        wrapScreenshotCommand(browser, {elementUtils});

        assert.calledOnceWith(browser.overwriteCommand, 'takeScreenshot', sinon.match.func);
    });

    it('should capture the whole page using base "takeScreenshot" command before starting to handle it', async () => {
        const buf = Buffer.from('screenshot-data');
        const baseTakeScreenshotFn = browser.takeScreenshot.resolves(buf.toString('base64'));

        wrapScreenshotCommand(browser, {elementUtils});

        await browser.takeScreenshot();

        assert.callOrder(baseTakeScreenshotFn, mockedSharp.extract);
    });

    it('should convert destination png data to base64 buffer', async () => {
        const buf = Buffer.from('screenshot-data');
        mockedSharp.toBuffer.resolves(buf);
        const base64Buf = buf.toString('base64');
        wrapScreenshotCommand(browser, {elementUtils});

        const result = await browser.takeScreenshot();

        assert.equal(result, base64Buf);
    });

    it('should extract image with correct coords', async () => {
        const coords = {left: 0, top: 0, width: 2, height: 2};
        calcWebViewCoordsStub.resolves(coords);
        wrapScreenshotCommand(browser, {elementUtils});

        await browser.takeScreenshot();

        assert.calledOnceWith(mockedSharp.extract, coords);
    });

    it('should take into account pixel ratio and body width', async () => {
        const pixelRatio = 1;
        const bodyWidth = 200;
        sinon.stub(elementUtils, 'getPixelRatio').returns(pixelRatio);
        sinon.stub(elementUtils, 'getElementSize').resolves({
            width: bodyWidth
        });

        wrapScreenshotCommand(browser, {elementUtils});

        await browser.takeScreenshot();

        assert.deepEqual(calcWebViewCoordsStub.args[0][1], {
            bodyWidth,
            pixelRatio
        });
    });

    it('should throw error if extract with wrong params', async () => {
        mockedSharp.extract.throws(new Error('o.O'));

        wrapScreenshotCommand(browser, {elementUtils});

        await assert.isRejected(browser.takeScreenshot(), 'Failed to take screenshot: Error: o.O');
    });
});
