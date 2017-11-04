[![Build Status](https://travis-ci.org/totomz/node-cf.svg?branch=master)](https://travis-ci.org/totomz/node-cf)

# What
`cftpl` is a commandline utility to add a template engine ([Mustache](https://mustache.github.io/)) to [AWS CloudFormation](https://aws.amazon.com/it/cloudformation)

# Usage
1. Install: `npm install -g cftpl`
2. Execution: `cftpl <create|update> <template_path> <profile> [dryrun]`

Parameters:
* `create` to create a new stack, `update` to update an existing stack using the same name
* `template_path` yep the path to your AWS CloudFormation template (json or YAML)
* `profile` is the [AWS profile](http://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html) to use to call CloudFormation (this is the **only** supported credential settings) 
* `dryrun` if you specify this parameter, CloudFormation will not be called

# How to write a template
The templating engine is [Mustache](https://mustache.github.io/), refer to Mustache' suser manual. 

* Check `test/templates/simple-sns.yaml` for a fully documented how-to write a template
* Check `test/gtemplates/test-api-gateway/stack.tpl` to see how to load external files in the template

Notes:
* The name of the stack is in the template metadata