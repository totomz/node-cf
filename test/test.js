const NodeCF = require('../NodeCF');
const expect = require('chai').expect;

describe('Full Test', function() {

    it('Parse a JSON input', function() {

        return new NodeCF({
            inputFile: 'test/templates/test-api-gateway/stack.tpl',
            action: 'createStack',
            dryRun: true
        })
        .buildTemplate()
            .then(template => { expect(JSON.parse(template)).to.be.deep.equal(require('./fixtures/api-gateway-result.json')); })
    });

    it('Create a CloudFormation stack (manual only)', function(){

        return Promise.resolve('yay!');

        cf = new NodeCF({
            inputFile: 'test/templates/simple-sns.json',
            action: 'updateStack',
            aws_profile: 'elysium',
            dryRun: true
        });

        return cf
            .buildTemplate()
            .then(template => { return cf.saveTempalteToTempFile(template); })
            .then(data => { return cf.saveToCloudFormation(data.template); })
    });


});