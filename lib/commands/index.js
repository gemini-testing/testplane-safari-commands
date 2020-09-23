'use strict';

module.exports = {
    // wrappers
    url: require('./url'),
    click: require('./click'),
    swipe: require('./swipe'),
    touch: require('./touch'),
    dragAndDrop: require('./dragAndDrop'),
    screenshot: require('./screenshot'),
    orientation: require('./orientation'),

    // commands to work with native elements
    deviceClickBack: require('./deviceClickBack')
};
