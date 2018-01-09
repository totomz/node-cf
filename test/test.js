const NodeCF = require('../NodeCF');
const expect = require('chai').expect;
const AWS = require('aws-sdk');
const YAML = require('yamljs');
const Promise = require("bluebird");
const readFile = Promise.promisify(require("fs").readFile);
require('dotenv').config();

describe('Full Test', function() {

    it('Parse a JSON input', function() {

        return new NodeCF({
            inputFile: 'test/templates/test-api-gateway/stack.tpl',
            action: 'createStack',
            dryRun: true
        })
        .buildTemplate()
            .then(template => { expect(JSON.parse(template.contents)).to.be.deep.equal(require('./fixtures/api-gateway-result.json')); })
    });

    it('Fail if the StackName is not specified in the template', function(done) {

        // This test is weird and not really usefull...there could be false-positive
        // To improve
        const runParams = {
            inputFile: 'test/templates/invalid-noname.yaml',
            action: 'createStack',
            dryRun: true,
            profile: 'invalid'
        };

        const cf = new NodeCF(runParams);
        cf
            .buildTemplate()
            .then(template => { return cf.saveTempalteToTempFile(template); })
            .then(data => { return cf.saveToCloudFormation(data); })
            .then(data => { done(new Error("A template without a name is invalid - failure expected")); })  // Faulty condition
            .catch(error => {
                expect(error.message).to.be.equal("[BadTemplate] Required field 'Metadata.aws.template.name' not found");
                done();
            });
    });

    it('Parse a YAMML input', function() {

        return new NodeCF({
            inputFile: 'test/templates/simple-sns.yaml',
            action: 'createStack',
            dryRun: true
        })
        .buildTemplate()
        .then(template => {
            return readFile('test/fixtures/simple-sns-result.yaml')
                .then(expectedContents => {
                    expect(YAML.parse(template.contents)).to.be.deep.equal(YAML.parse(expectedContents.toString()));
                    return true;
                });
        });
    });

    it('Stop invalid CloudFormation template', function() {

        const cf = new NodeCF({
            inputFile: 'test/templates/simple-sns-invalid.yaml',
            action: 'createStack',
            dryRun: true
        });

        return cf.buildTemplate()
        .then(template => { return cf.saveTempalteToTempFile(template); })
        .then(data => { return cf.validateTemplate(data); })
        .catch(err => { expect(err.name).to.be.equal('ValidationError'); return "ok200";})
        .then(data => { expect(data).to.be.equal("ok200") });
    });

    it('Create a CloudFormation stack ', function(){

        cf = new NodeCF({
            inputFile: 'test/templates/simple-sns.json',
            action: 'createStack',
            dryRun: true
        });

        return cf
            .buildTemplate()
            .then(template => { return cf.saveTempalteToTempFile(template); })
            .then(data => { return cf.validateTemplate(data); })
            .then(data => { return cf.saveToCloudFormation(data); })
            .then(data => { expect(data.contents).to.be.a('string'); })
    });

    it('Create a CloudFormation stack - YAML', function(){

        cf = new NodeCF({
            inputFile: 'test/templates/simple-sns.yaml',
            action: 'createStack',
            dryRun: true
        });

        return cf
            .buildTemplate()
            .then(template => { return cf.saveTempalteToTempFile(template); })
            .then(data => { return cf.validateTemplate(data); })
            .then(data => { return cf.saveToCloudFormation(data); })
            .then(data => { expect(data.contents).to.be.a('string'); })
    });

    it('Handle externals - YAML', function(){

        cf = new NodeCF({
            inputFile: 'test/templates/externals/stack.yaml',
            action: 'createStack',
            dryRun: true
        });

        return cf
            .buildTemplate()
            .then(template => { return cf.saveTempalteToTempFile(template); })
            .then(data => { return cf.validateTemplate(data); })
            .then(data => { expect(data.contents).to.be.a('string'); return data; })
            .then(data => {
                const tpl = YAML.parse(data.contents);
                expect(tpl.Resources.HttpApi.Properties.Body.paths['/list_booking/{userID}'].get.summary).to.be.equal('list of bookings for a given user ID.');
            })
    });

});