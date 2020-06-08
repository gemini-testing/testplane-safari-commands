'use strict';

const _ = require('lodash');

exports.mkConfig_ = (opts = {}) => {
    return _.defaultsDeep(opts, {
        browsers: {
            b1: {
                commands: ['default-command']
            }
        }
    });
};

exports.matchElemArrayByIndex_ = ({index, value}) => (refValue) => {
    return assert.deepEqual(refValue[index], value) || true;
};

exports.mkBrowser_ = () => {
    const session = Promise.resolve();

    session.executionContext = {};
    session.touchAction = sinon.stub().named('touchAction').resolves();
    session.getElementSize = sinon.stub().named('getElementSize').resolves({});
    session.getLocation = sinon.stub().named('getLocation').resolves({});
    session.context = sinon.stub().named('context').resolves({value: 'default-ctx'});
    session.contexts = sinon.stub().named('contexts').resolves({value: ['default-ctx-1', 'default-ctx-2']});

    session.addCommand = sinon.stub().callsFake((name, command) => {
        session[name] = command;
        sinon.spy(session, name);
    });

    return session;
};
