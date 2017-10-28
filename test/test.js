const NodeCF = require('../NodeCF');
const expect = require('chai').expect;

describe('Full Test', function() {

    it('Parse a JSON input', function() {

        return new NodeCF({
            inputFile: 'test/templates/test-api-gateway/stack.tpl',
            action: 'create-stack',
            dryRun: true
        })
        .buildTemplate()
            .then(template => { expect(JSON.parse(template)).to.be.deep.equal(require('./fixtures/api-gateway-result.json')); })


    });

});