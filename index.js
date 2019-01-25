#! /usr/bin/env node

const NodeCF = require('./NodeCF');
const program = require('commander');
const updateNotifier = require('update-notifier');
const pkg = require("./package");

const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000 * 60 * 60 * 24 // 1 day
});

program
    .version(pkg.version)
    // .option('-c, --create [path]', 'Create a new stack using the template specified by path')
    // .option('-u, --update [path]', 'Update an existing stack using the template specified by path')
    // .option('-c, --change-set [path]', 'Create and save an aws-changeset for the given stack')
    .arguments('<action> <stack>')  // Can be upsert|changeset
    // .command('pippo <stack>')
    // .command('pluto <stack>')
    .option('-d, --dry-run', 'Do not execute AWS CloudFormation')
    .option('-p, --profile [pofile]', 'Name of the AWS profile to use to call AWS CloudFormation')
    .option('-s, --stage [name]', 'Add a stage with this name to the list of stages in the template (that can be empty)')
    .action((action, stack) => {
        // console.log(":::::");
        // console.log(action);
        // console.log(":::::");
        const runParams = {
            inputFile: stack,
            action: action, // 'createStack',
            aws_profile: program.profile,
            dryRun: program.dryRun
        };

        if(program.stage){
            runParams.stages = [{name: program.stage}];
        }

        if(action !== 'changeset' && action !== 'create' && action !== 'update') {
            throw new Error('Action is undefined');
        }

        console.log(JSON.stringify(runParams));

        const cf = new NodeCF(runParams);
        return cf
            .buildTemplate()
            .then(template => { return cf.saveTempalteToTempFile(template); })
            .then(data => { return cf.validateTemplate(data); })
            .then(data => {
                let res;
                if(action === 'changeset') {
                    res = cf.createChangeset(data);
                }
                else {
                    res = cf.saveToCloudFormation(data);
                }

                return res;
            })
            .then(data => {
                return cf.waitForIt(data);
            })
            .catch(err => {
                console.log(err);
                process.exit(1);
            })
            .then(data => {
                console.log(JSON.stringify(data, null, 4));
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
