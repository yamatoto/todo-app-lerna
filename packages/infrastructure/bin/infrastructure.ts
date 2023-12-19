#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { Route53Stack } from "../lib/route53-stack";

const env: cdk.StackProps["env"] = {
    region: "ap-northeast-1"
};
// const envUS: cdk.StackProps["env"] = {
//     region: "us-east-1"
// };

const app = new cdk.App();
new Route53Stack(app, "Route53Stack", {
    env
});
