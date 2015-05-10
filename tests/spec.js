var chai     = require('chai'),
    fs       = require('fs'),
    jsDom    = require('jsdom'),
    mapleify = require('./../bin/mapleify.js');

describe('Mapleify', function() {

    it('Should be able to compiled the HTML document', function() {
        chai.assert.ok(mapleify, 'Mapleify is defined');
    });

    it('Should throw an exception when input is not specified', function() {
        chai.expect(mapleify.transform.bind(null)).to.throw('Specify an input file, e.g: mapleify -i index.html');
    });

    it('Should be able to transform the index page', function(done) {

        var outputFile = 'tests/compiled/mapleified.html',
            options    = { input: 'tests/compiled/index.html', output: outputFile };

        mapleify.transform(options.input, options.output).then(function then(data) {

            jsDom.env(data.output, function(errors, window) {

                var document  = window.document,
                    templates = document.querySelectorAll('template');

                // First template using basic JavaScript include.
                chai.expect(templates[0].getAttribute('ref')).to.equal('imports/basic');
                chai.expect(templates[0].querySelectorAll('style').length).to.equal(1);
                chai.expect(templates[0].querySelectorAll('script').length).to.equal(1);
                chai.expect(templates[0].querySelectorAll('script')[0].getAttribute('src')).to.equal('imports/basic/default.js');

                // First template using JSX files.
                chai.expect(templates[1].getAttribute('ref')).to.equal('imports/jsx');
                chai.expect(templates[1].querySelectorAll('style').length).to.equal(1);
                chai.expect(templates[1].querySelectorAll('script').length).to.equal(1);
                chai.expect(templates[1].querySelectorAll('script')[0].getAttribute('type')).to.equal('text/javascript');
                chai.expect(templates[1].querySelectorAll('script')[0].getAttribute('src')).to.equal('imports/jsx/default.js');

                done();

            });

        });

    });

});