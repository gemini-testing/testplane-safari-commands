'use strict';

const addClickCommand = require('lib/commands/click');
const {mkBrowser_} = require('../../utils');

describe('"click" command', () => {
    it('should add "click" command', () => {
        const browser = mkBrowser_();

        addClickCommand(browser);

        assert.calledOnceWith(browser.addCommand, 'click', sinon.match.func, true);
    });

    it('should pass through control to the "touch" command', async () => {
        const browser = mkBrowser_();

        addClickCommand(browser);

        await browser.click('.some-selector');

        assert.calledOnceWith(browser.touch, '.some-selector');
    });

    it('should call base click-command if "unwrap" option is specified', async () => {
        const browser = mkBrowser_();
        const baseClick = browser.click;

        addClickCommand(browser);

        await browser.click('some-selector', {unwrap: true});

        assert.calledOnceWith(baseClick, 'some-selector');
        assert.notCalled(browser.touch);
    });
});
