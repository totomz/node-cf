const NodeCF = require('../NodeCF');
const expect = require('chai').expect;
const AWS = require('aws-sdk');
const YAML = require('yamljs');
const Promise = require("bluebird");
const readFile = Promise.promisify(require("fs").readFile);
require('dotenv').config();

if(!process.env.AWS_ACCESS_KEY_ID) {
    process.env.AWS_PROFILE = 'elysium';
}

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

                    console.log("::::");
                    console.log(template.contents);
                    let jj = YAML.parse(template.contents);
                    console.log("::::");

                    expect(YAML.parse(template.contents)).to.be.deep.equal(YAML.parse(expectedContents.toString()));
                    return true;
                });
        });
    });

    it('Test Inner Objects', function() {

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
        this.timeout(10 * 1000);
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

    it('Create a CloudFormation stack using s3', function(){

        if(process.env.TRAVIS){
            return Promise.resolve('Test disabled in Travis-ci');
        }

        this.timeout(300 * 1000);

        cf = new NodeCF({
            inputFile: 'test/templates/simple-sns-s3-live.yaml',
            action: 'createStack'
        });

        return cf
            .buildTemplate()
            .then(template => { return cf.saveTempalteToTempFile(template); })
            .then(data => { return cf.validateTemplate(data); })
            .then(data => { return cf.saveToCloudFormation(data); })
            .then(data => {
                console.log('Wating stack to be created');
                return new AWS.CloudFormation({ region: 'eu-west-1' }).waitFor('stackCreateComplete', {StackName: 'xxx-test-nodecf-yaml'}).promise();
            })
            .then(data => {
                console.log('Deleting test stack');
                return new AWS.CloudFormation({ region: 'eu-west-1' }).deleteStack({StackName: 'xxx-test-nodecf-yaml'}).promise(); })
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

    it('Handle externals - YAML 2', function(){

        cf = new NodeCF({
            inputFile: 'test/templates/externals/swagger2/stack.yaml',
            action: 'createStack',
            dryRun: true,
            stages: [{name: "gamma"}]
        });

        return cf
            .buildTemplate()
            .then(template => { return cf.saveTempalteToTempFile(template); })
            .then(data => {
                expect(data.contents).to.be.a('string'); return data; })
            .then(data => {
                const tpl = YAML.parse(data.contents);
                expect(tpl.Resources.HttpApi.Properties.Body.paths['/list_booking/{userID}'].get.summary).to.be.equal('list of bookings for a given user ID.');
            })
    });

    it('Expose function getTime()', function() {

        cf = new NodeCF({
            inputFile: 'test/templates/simple-sns-function.yaml',
            action: 'createStack',
            dryRun: true
        });

        return cf
            .buildTemplate()
            .then(template => { return cf.saveTempalteToTempFile(template); })
            .then(data => {
                return cf.validateTemplate(data); })
            .then(data => {
                const tpl = YAML.parse(data.contents);
                console.log(tpl.Resources.FakeSns.Properties.TopicName);
                expect(tpl.Resources.FakeSns.Properties.TopicName).to.be.a('number');
            });
    });

    it('Expose function jsonize()', function() {

        cf = new NodeCF({
            inputFile: 'test/templates/test-simple-functions.json',
            action: 'createStack',
            dryRun: true
        });

        return cf
            .buildTemplate()
            .then(template => { return cf.saveTempalteToTempFile(template); })
            .then(data => {
                const tpl = JSON.parse(data.contents);
                expect(tpl.Resources.something.array.data).to.be.an('array');
                expect(tpl.Resources.something.array.data.length).to.be.equal(3);
            });
    });

    it('Expose function jsonize() with externals', function() {

        cf = new NodeCF({
            inputFile: 'test/templates/test-api-gateway/stack-functions.tpl',
            action: 'createStack',
            dryRun: true
        });

        return cf
            .buildTemplate()
            .then(template => { return cf.saveTempalteToTempFile(template); })
            .then(data => {
                const tpl = YAML.parse(data.contents);
                expect(tpl.Resources.Elyapi.Properties.Body['/tags/r/{id}'].get.responses['400'].description).to.be.equal("400 response");
            });
    });

    it('Handle CloudFormation parameters', function() {

        cf = new NodeCF({
            inputFile: 'test/templates/simple-sns-params.yaml',
            action: 'createStack',
            dryRun: true
        });

        return cf
            .buildTemplate()
            .then(template => {
                return cf.saveTempalteToTempFile(template); })
            .then(data => {
                const tpl = JSON.parse(data.contents);
                expect(tpl.Resources.something.array.data).to.be.an('array');
                expect(tpl.Resources.something.array.data.length).to.be.equal(3);
            });
    });

});