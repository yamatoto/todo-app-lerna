#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { Route53Stack } from "../lib/route53-stack";
import { AcmStack } from "../lib/acm-stack";
import { Constants } from "../lib/constants";
import { VpcStack } from "../lib/vpc-stack";

const env: cdk.StackProps["env"] = {
    region: "ap-northeast-1"
};
const envUS: cdk.StackProps["env"] = {
    region: "us-east-1"
};

const app = new cdk.App();

new Route53Stack(app, `${Constants.systemName}-Route53Stack`, {
    env
});

new AcmStack(app, `${Constants.systemName}-AcmStackVirginia`, {
    env: envUS
});

new AcmStack(app, `${Constants.systemName}-AcmStackTokyo`, {
    env
});

new VpcStack(app, `${Constants.systemName}-VpcStack`, {
    env,
    shouldCreateSubnetProtected: false
});
