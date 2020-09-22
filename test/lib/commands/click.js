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
});
