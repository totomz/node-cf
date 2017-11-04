#! /usr/bin/env node

const NodeCF = require('./NodeCF');


const usage = 'USAGE cf <create|update> <path_to_the_stack> <profile> [dryrun]';

if (process.argv.length < 4) {
    return console.log(usage);
}

process.argv.forEach((val, index) => {
    console.log(`${index}: ${val}`);
});

const action = `${process.argv[2]}Stack`;
const inputFile = process.argv[3];
const aws_profile  = process.argv[4];
const dryRun  = !!(process.argv[5]);

const runParams = {
    inputFile,
    action,
    aws_profile,
    dryRun
};

console.log(JSON.stringify(runParams));

const cf = new NodeCF(runParams);
return cf
    .buildTemplate()
    .then(template => { return cf.saveTempalteToTempFile(template); })
    .then(data => { return cf.saveToCloudFormation(data); })
    .then(data => { console.log(data); });
