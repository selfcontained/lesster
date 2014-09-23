var EventEmitter = require('events').EventEmitter,
    fs = require('fs'),
    path = require('path'),
    domain = require('domain'),
    deap = require('deap'),
    errorize = require('./errorize'),
    versionize = require('./versionize');

var Lesster = module.exports = function(config) {
    EventEmitter.call(this);

    this.config = deap.update({
        root: process.cwd(),
        paths: [],
        regex: /^\/(.+?)\.css$/,
        compileOptions: null,
        less: null,
        versionize: noop,
    }, config||config);

    // use built-in less if none is provided
    if(!this.config.less) this.config.less = require('less');

    // add version function to less engine
    versionize(
        this.config.versionize,
        this.config.less
    );
};

Lesster.prototype = deap.extend({

    compile: function(filename, done) {
        var self = this,
            root = this.config.root,
            less = this.config.less,
            paths = this.config.paths,
            compileOptions = this.config.compileOptions||{};

        fs.readFile(path.join(this.config.root, filename), 'utf8', function(err, src) {
            if(err) return done(err);

            // try/catch won't catch all the errors .parse() surfaces...
            domain.create()
                .on('error', function(e) {
                    done(new Error(errorize(e)));
                })
                .run(function() {
                    try {
                        // can't use less.render() - need to use parser for minify to work
                        var parser = new(less.Parser)({
                            paths: [
                                root,
                                path.join(root, path.dirname(filename)),
                            ].concat(paths),
                            filename: filename
                        });

                        parser.parse(src, function (err, tree) {
                            if(err) return done(new Error(errorize(err)));

                            done(null, tree.toCSS(compileOptions));
                        });
                    } catch(e) {
                        done(new Error(errorize(e)));
                    }
                });
        });

        return this;
    },

    middleware: function(regex) {
        var self = this;

        return function lessterMiddleware(req, res, next) {
            var match = req.url.match(regex);
            if(!match) return next();

            self.compile(match[1]+'.less', function(err, css) {
                if(err) return next(err);

                res.setHeader('Content-Type', 'text/css');

                // provide hook to set custom headers, etc
                self.emit('pre-response', res, css);

                res.write(css);
                res.end();
            });
        };
    }

}, EventEmitter.prototype);

function noop(v) {
    return v;
}
