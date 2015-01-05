var cm = {};

function ready(fn) {
    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        document.attachEvent('onreadystatechange', function () {
            if (document.readyState === 'interactive')
                fn();
        });
    }
}

(function (cm) {
    'use strict';

    cm.init = function () {
        ready(cm.map.init);
    };
})(cm);
