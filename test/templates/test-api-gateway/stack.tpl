{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Stack to test API Gateway",
  "Metadata":{
    "aws": {
      "region": "eu-west-1",
      "capabilities": "CAPABILITY_IAM",
      "isTemplate": true,
      "__external": {"swaggerdef": "swagger.json"},
      "template": {
        "stages": [
          {"name": "devtotomz"},
          {"name": "gamma"},
          {"name": "prod"}
        ]
      }
  }},
  "Parameters": {
    "domainName": {
      "Type": "String",
      "Default": "daje.tech"
    }
  },
  "Resources": {

    "EchoLambdaPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:invokeFunction",
        "FunctionName": "LOL",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {"Fn::Join": ["",["arn:aws:execute-api:", {"Ref": "AWS::Region"}, ":", {"Ref": "AWS::AccountId"}, ":", {"Ref": "Elyapi"}, "/*"]]}
      }
    },

    "Elyapi": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Description": "Elysium HTTP API ",
        "FailOnWarnings": true,
        "Name": "ElyAPI",
        "Body": {{{swaggerdef}}}
      }
    },

    "LambdaSignupPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:invokeFunction",
        "FunctionName": {"Fn::ImportValue" : "lambda-signup:SignupFunction"},
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {"Fn::Join": ["", ["arn:aws:execute-api:", {"Ref": "AWS::Region"}, ":", {"Ref": "AWS::AccountId"}, ":", {"Ref": "Elyapi"}, "/*"]]}
      }
    },

    {{#stages}}
    "LambdaSignupPermission{{name}}": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:invokeFunction",
        "FunctionName": {"Fn::ImportValue" : "lambda-signup:SignupFunctionAlias{{name}}"},
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {"Fn::Join": ["", ["arn:aws:execute-api:", {"Ref": "AWS::Region"}, ":", {"Ref": "AWS::AccountId"}, ":", {"Ref": "Elyapi"}, "/*"]]}
      }
    },
    {{/stages}}

    {{#stages}}
    "Deployment{{name}}": {
      "Type": "AWS::ApiGateway::Deployment",
      "Properties": {
        "RestApiId": { "Ref": "Elyapi" },
        "Description": "Deployment in {{name}}",
        "StageName": "{{name}}",
        "StageDescription": {
          "Variables" : { "elyenv":"{{name}}" }
        }
      }
    },
    {{/stages}}
    {{#stages}}

    "PathMapping{{name}}": {
      "Type": "AWS::ApiGateway::BasePathMapping",
      "DependsOn": ["Deployment{{name}}","EyApiDomainName{{name}}"],
      "Properties": {
        "BasePath": "",
        "DomainName": "{{name}}.daje.tech",
        "RestApiId": { "Ref": "Elyapi" },
        "Stage": "{{name}}"
      }
    },
    "EyApiDomainName{{name}}":{
      "Type": "AWS::ApiGateway::DomainName",
      "Properties": {
        "CertificateArn": "LOL",
        "DomainName": "{{name}}.daje.tech"
      }
    },
    {{/stages}}

    "DNSRecordsetGroup": {
      "Type" : "AWS::Route53::RecordSetGroup",
      "Properties" : {
         "HostedZoneId" : "LOL",
         "RecordSets" : [
           {{#stages}}
           {
             "AliasTarget": {
               "DNSName" : { "Fn::GetAtt" : ["EyApiDomainName{{name}}", "DistributionDomainName"] },
               "HostedZoneId" : "LOL"
             },
             "Name" : "{{name}}.daje.tech.",
             "Type" : "A"
           },
           {{/stages}}
           {
             "Name" : "dummy.daje.tech.",
             "TTL" : "120",
             "Type" : "A",
             "ResourceRecords" : ["151.100.152.220"]
           }
         ]
      }
   }
  }
}
