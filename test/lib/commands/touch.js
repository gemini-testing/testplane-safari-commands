'use strict';

const proxyquire = require('proxyquire');
const {mkBrowser_} = require('../../utils');

describe('"touch" command', () => {
    let browser, addTouchCommand, getElemCenterLocation;

    beforeEach(() => {
        browser = mkBrowser_();
        getElemCenterLocation = sinon.stub().resolves({x: 0, y: 0});

        addTouchCommand = proxyquire('lib/commands/touch', {
            '../command-helpers/element-utils': {getElemCenterLocation}
        });
    });

    afterEach(() => sinon.restore());

    it('should add "touch" command', () => {
        addTouchCommand(browser);

        assert.calledOnceWith(browser.addCommand, 'touch', sinon.match.func, true);
    });

    it('should get center location of the passed selector', async () => {
        addTouchCommand(browser);

        await browser.touch('.some-selector');

        assert.calledOnceWith(getElemCenterLocation, browser, '.some-selector');
    });

    describe('perform touch action', () => {
        it('should tap on the center location of the passed selector', async () => {
            getElemCenterLocation.resolves({x: 100, y: 500});
            addTouchCommand(browser);

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
