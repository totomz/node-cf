#! /usr/bin/env node

const NodeCF = require('./NodeCF');
const program = require('commander');


program
    .version('0.1.5')
    // .option('-c, --create [path]', 'Create a new stack using the template specified by path')
    // .option('-u, --update [path]', 'Update an existing stack using the template specified by path')
    // .option('-c, --change-set [path]', 'Create and save an aws-changeset for the given stack')
    .arguments('<action> <stack>')  // Can be upsert|changeset
    .option('-d, --dry-run', 'Do not execute AWS CloudFormation')
    .option('-p, --profile [pofile]', 'Name of the AWS profile to use to call AWS CloudFormation')
    .option('-s, --stage [name]', 'Add a stage with this name to the list of stages in the template (that can be empty)')
    .action((action, stack) => {
        const runParams = {
            inputFile: stack,
            action: 'createStack',
            aws_profile: program.profile,
            dryRun: program.dryRun
        };

        if(program.stage){
            runParams.stages = [{name: program.stage}];
        }

        console.log(JSON.stringify(runParams));

        const cf = new NodeCF(runParams);
        return cf
            .buildTemplate()
            .then(template => { return cf.saveTempalteToTempFile(template); })
            .then(data => { return cf.validateTemplate(data); })
            .then(data => { return cf.saveToCloudFormation(data); })
            .then(data => {
                return cf.waitForIt(data); })
            .then(data => {
                console.log(data)
            });


    })
    .parse(process.argv);


//
// const cf = new NodeCF(runParams);
// return cf
//     .buildTemplate()
//     .then(template => { return cf.saveTempalteToTempFile(template); })
//     .then(data => { return cf.validateTemplate(data); })
//     .then(data => { return cf.saveToCloudFormation(data); })
//     .then(data => { console.log(data); });
