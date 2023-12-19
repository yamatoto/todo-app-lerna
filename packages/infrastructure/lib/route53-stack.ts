import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import { infraConfig } from "./config";
import { StackEnvironmentParams } from "./type";
import { Constants } from "./constants";

export class Route53Stack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const hostedZone = new route53.HostedZone(this, "HostedZone", {
            zoneName: `${params.domainPrefix}${Constants.domainName}`,
            comment: `${Constants.systemName}-${params.envName}-hostedzone`
        });

        if (infraConfig.envName === "production") {
            const recordSetCaa = new route53.CaaRecord(this, "RecordSetCaa", {
                zone: hostedZone,
                values: [
                    {
                        flag: 0,
                        tag: route53.CaaTag.ISSUE,
                        value: "amazon.com"
                    }
                ],
                ttl: cdk.Duration.seconds(3600)
            });
            // Outputs
            new cdk.CfnOutput(this, "RecordSetCaaOutPut", {
                value: recordSetCaa.domainName,
                exportName: `${Constants.systemName}-${id}-RecordSetCaa`
            });
        }

        // Outputs
        const exportNamePrefix = `${Constants.systemName}-${id}`;
        new cdk.CfnOutput(this, "HostedZoneOutPut", {
            value: hostedZone.hostedZoneId,
            exportName: `${exportNamePrefix}-HostedZone`
        });

        new cdk.CfnOutput(this, "HostedZoneDomainNameOutPut", {
            value: hostedZone.zoneName,
            exportName: `${exportNamePrefix}-HostedZoneDomainName`
        });

        const nsArray = hostedZone.hostedZoneNameServers as string[];
        new cdk.CfnOutput(this, "HostedZoneNameServersOutPut", {
            value: cdk.Fn.join(",", nsArray),
            exportName: `${exportNamePrefix}-HostedZoneNameServers`
        });
    }
}

type StackParams = {
    envName: string;
    domainPrefix: string;
};
const StackEnvParams: StackEnvironmentParams<StackParams> = {
    development: {
        envName: Constants.envName.dev,
        domainPrefix: Constants.domainPrefix.dev
    },
    staging: {
        envName: Constants.envName.stg,
        domainPrefix: Constants.domainPrefix.stg
    },
    production: {
        envName: Constants.envName.prod,
        domainPrefix: Constants.domainPrefix.prod
    }
};

const params =
    infraConfig.envName === "production"
        ? StackEnvParams.production
        : infraConfig.envName === "staging"
          ? StackEnvParams.staging
          : StackEnvParams.development;
