[![Build Status](https://travis-ci.org/totomz/node-cf.svg?branch=master)](https://travis-ci.org/totomz/node-cf)

# What
`cftpl` is a commandline utility to add a template engine ([Mustache](https://mustache.github.io/)) to [AWS CloudFormation](https://aws.amazon.com/it/cloudformation)

# Usage
1. Install: `npm install -g @my-ideas/cftpl`
2. Execution: `cftpl <create|changeset> <template> [--stage <stage>] [--profile <profile>]` 

Action `create` perform an upsert of the stack (create if doesn't exist, otherwise update). `changeset` create a ChangeSet with the given template

* `--profile ,profile>`: the [AWS profile](http://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html) to use to call CloudFormation (this is the **only** supported credential settings)
* `--dry-run`: if you specify this parameter, CloudFormation will not be called
* `--stage <stage>`: Add a variable `stages: [{name: <stage>}]` to the template metadata - this is usefull to create separate stack with the same template (see the examples in `/test`)


# How to write a template
The templating engine is [Mustache](https://mustache.github.io/), refer to Mustache' suser manual. 

* Check `test/templates/simple-sns.yaml` for a fully documented how-to write a template
* Check `test/gtemplates/test-api-gateway/stack.tpl` to see how to load external files in the template

For large templates it is possible to upload the stack generated to S3 by adding the property `Metadata.aws.template.__use_s3=bucket` . See `test/templates/simple-sns-s3-live.yaml`

## Custom functions
The following functions can be used inside a template:
* `{{funcTime}}`: returns the value of `new Date().getTime()` - @see `simple-sns-function.yaml`
* `{{#jsonize}}a.key{{/jsonize}}`: Return the json representation of the given key - @see `test-simple-functions.json`
* `{{#jsonizeEscapeQuotes}}a.key{{/jsonizeEscapeQuotes}},`: serialize object `a.key` in JSON and escape all the quotes (which means, convert the object in a string that you can include in other strings. @see `/test/templates/test-api-gateway/stack-functions.tpl`)

Notes:
* The name of the stack is in the template metadata

# How to count for difference in a ChangeSet
**BUG: If there are no changes, aws returns an error!**
`cftpl changeset test/templates/simple-sns.yaml --profile porketta --stage gamma | tail -n +4 |  jq '.Changes | length'`