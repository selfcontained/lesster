
//
// Add a `versionize` fn available w/in less files
// + fn accepts a string path to a static file, and should return the versioned asset path
//
module.exports = function(versionize, lessLib) {
    if(typeof versionize != 'function') throw new Error('version function required');

    if(!lessLib || !lessLib.tree || !lessLib.tree.functions) {
        throw new Error("This doesn't taste like the less library");
    }

    // register versionize function w/ less compiler
    lessLib.tree.functions.versionize = function(v) {
        return {
            eval: function() {
                return this;
            },
            toCSS: function() {
                return versionize(v.value);
            }
        };
    };

};
