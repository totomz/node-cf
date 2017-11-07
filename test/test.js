const NodeCF = require('../NodeCF');
const expect = require('chai').expect;
const AWS = require('aws-sdk');
const YAML = require('yamljs');
const Promise = require("bluebird");
const readFile = Promise.promisify(require("fs").readFile);

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

    it('Create a CloudFormation stack (manual only)', function(){

        return Promise.resolve('yay!');

        cf = new NodeCF({
            inputFile: 'test/templates/simple-sns.json',
            action: 'createStack',
            aws_profile: 'elysium',
            dryRun: true
        });

        return cf
            .buildTemplate()
            .then(template => { return cf.saveTempalteToTempFile(template); })
            .then(data => { return cf.saveToCloudFormation(data); })
            .then(data => { return new AWS.CloudFormation({ region: 'eu-west-1'}).describeStacks({StackName: 'xxx-test-nodecf'}).promise(); })
    });

    it('Create a CloudFormation stack (manual only) - YAML', function(){

        return Promise.resolve('yay!');

        cf = new NodeCF({
            inputFile: 'test/templates/simple-sns.yaml',
            action: 'createStack',
            aws_profile: 'elysium',
            dryRun: true
        });

        const cloudFormation = new AWS.CloudFormation({ region: 'eu-west-1'});

        return cf
            .buildTemplate()
            .then(template => { return cf.saveTempalteToTempFile(template); })
            .then(data => { return cf.saveToCloudFormation(data); })
            .then(data => {
                return cloudFormation.describeStacks({StackName: 'xxx-test-nodecf-yaml'}).promise()
                    // .then(res => { console.log(res); return true; })
                    // .catch(errr => { console.log(err); })
            })

    });


});