'use strict';

const addTouchCommand = require('lib/commands/touch');
const {mkBrowser_} = require('../../utils');
const {getElementUtils} = require('lib/command-helpers/element-utils');

describe('"touch" command', () => {
    let browser, elementUtils;

    beforeEach(() => {
        browser = mkBrowser_();
        elementUtils = getElementUtils(browser);
        sinon.stub(elementUtils, 'getElemCenterLocation').resolves({x: 0, y: 0});
    });

    afterEach(() => sinon.restore());

    it('should add "touch" command', () => {
        addTouchCommand(browser, {elementUtils});

        assert.calledOnceWith(browser.addCommand, 'touch', sinon.match.func, true);
    });

    it('should get center location of the passed selector', async () => {
        addTouchCommand(browser, {elementUtils});

        await browser.touch('.some-selector');

        assert.calledOnceWith(elementUtils.getElemCenterLocation, browser, '.some-selector');
    });

    describe('perform touch action', () => {
        it('should tap on the center location of the passed selector', async () => {
            elementUtils.getElemCenterLocation.resolves({x: 100, y: 500});
            addTouchCommand(browser, {elementUtils});

            await browser.touch('.some-selector');

            assert.calledOnceWith(
                browser.touchAction,
                sinon.match.array.deepEquals([
                    {action: 'tap', x: 100, y: 500}
                ])
            );
        });
    });
});
