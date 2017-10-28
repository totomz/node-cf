const expect = require('chai').expect;
const NodeCF = require('../NodeCF');

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