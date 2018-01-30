const expect = require('chai').expect;
const NodeCF = require('../NodeCF');
const Promise = require("bluebird");
const YAML = require('yamljs');
const readFile = Promise.promisify(require("fs").readFile);

describe('Unit tests', function() {

    it('LoadJSONFile', function() {

        const cf = new NodeCF({});

        return cf
            .readFileJson('test/templates/test-simple.json')
            .then(tpl => {
                expect(tpl.metadata).to.be.an('object');
                expect(tpl.contents).to.be.a('string');

                const expectedMetadata = {
                    aws: {
                        "region": "eu-west-1",
                        "capabilities": "CAPABILITY_IAM",
                        "isTemplate": true,
                        "__external": {
                            "swaggerdef": "swagger.json"
                        },
                        "template": {

                            "stages": [
                                { "name": "devtotomz" },
                                { "name": "gamma" },
                                { "name": "prod" }
                            ]
                        }
                    }
                };

                expect(tpl.metadata).to.deep.equal(expectedMetadata);
            });
    });

    it('Use the stage parameter for the name of the template', function(){

        const cf = new NodeCF({
            inputFile: 'test/templates/simple-sns-nostages.yaml',
            action: 'createStack',
            dryRun: true,
            profile: 'invalid',
            stages: [{name: 'gamma'}, {name: 'daje'}]
        });

        return cf
            .buildTemplate()
            .then(template => {
                const expectedMetadata = {
                    aws: {
                        "region": "eu-west-1",
                        "capabilities": ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"],
                        "isTemplate": true,
                        "template": {
                            "funcTime": function() {},
                            "jsonize": function() {},
                            "name": "gamma-test-nodecf-yaml",
                            "stages": [
                                { "name": "gamma" },
                                { "name": "daje" },
                            ],
                        }
                    }
                };

                // Equality on function fails
                expect(template.metadata.aws.template.name).to.be.eql(expectedMetadata.aws.template.name);
                expect(template.metadata.aws.template.stages).to.deep.eql(expectedMetadata.aws.template.stages);

                return readFile('test/fixtures/simple-sns-nostages-result.yaml')
                    .then(expectedContents => {
                        expect(YAML.parse(template.contents).Resources).to.be.deep.equal(YAML.parse(expectedContents.toString()).Resources);
                        return true;
                    });
            });


    });

    it('LoadExternals', function() {

        const cf = new NodeCF({});

        return cf.loadExternals('test/fixtures/fakefile.lol', {
            metadata: {
                aws: {
                    pippo: "plusto",
                    __external: {
                        uno: "one.txt",
                        due: "due.json"
                    },
                    template: { }
                }
            }, content: ""})

            .then(data => {
                expect(data.metadata).to.be.an('object');
                expect(data.metadata.aws.template.uno).to.be.equal('oneone');
                expect(data.metadata.aws.template.due).to.be.equal('gnappa');

                return true;
            });
    });


});