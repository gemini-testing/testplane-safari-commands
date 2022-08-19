'use strict';

const overwriteClickCommand = require('lib/commands/click');
const {mkBrowser_} = require('../../utils');

describe('"click" command', () => {
    it('should overwrite "click" command', () => {
        const browser = mkBrowser_();

        overwriteClickCommand(browser);

        assert.calledOnceWith(browser.overwriteCommand, 'click', sinon.match.func, true);
    });

    it('should overwrite browser.click, if exists', () => {
        const browser = mkBrowser_();
        browser.click = () => {};

        overwriteClickCommand(browser);

        assert.calledTwice(browser.overwriteCommand);
        assert.calledWithExactly(browser.overwriteCommand, 'click', sinon.match.func);
    });

    it('should pass through control to the "touch" command', async () => {
        const browser = mkBrowser_();

        overwriteClickCommand(browser);

        const elem = await browser.$();
        await elem.click();

        assert.calledOnce(elem.touch);
    });

    it('should call base click-command if "unwrap" option is specified', async () => {
        const browser = mkBrowser_();

        const elem = await browser.$('.some-selector');
        const baseClick = elem.click;
        overwriteClickCommand(browser);

        await elem.click({unwrap: true});

        assert.calledOnce(baseClick);
        assert.notCalled(elem.touch);
    });
});
