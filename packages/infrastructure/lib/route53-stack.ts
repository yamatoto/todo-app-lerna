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
            zoneName: `${params.zonePrefix}${Constants.domainName}`,
            comment: `${Constants.systemName}-${params.environmentName}-hostedzone`
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
        new cdk.CfnOutput(this, "HostedZoneOutPut", {
            value: hostedZone.hostedZoneId,
            exportName: `${Constants.systemName}-${id}-HostedZone`
        });

        new cdk.CfnOutput(this, "HostedZoneDomainNameOutPut", {
            value: hostedZone.zoneName,
            exportName: `${Constants.systemName}-${id}-HostedZoneDomainName`
        });

        const nsArray = hostedZone.hostedZoneNameServers as string[];
        new cdk.CfnOutput(this, "HostedZoneNameServersOutPut", {
            value: cdk.Fn.join(",", nsArray),
            exportName: `${Constants.systemName}-${id}-HostedZoneNameServers`
        });
    }
}

type StackParams = {
    environmentName: string;
    zonePrefix: string;
};
const StackEnvParams: StackEnvironmentParams<StackParams> = {
    development: {
        environmentName: "dev",
        zonePrefix: "dev."
    },
    staging: {
        environmentName: "stg",
        zonePrefix: "stg."
    },
    production: {
        environmentName: "prod",
        zonePrefix: ""
    }
};

const params =
    infraConfig.envName === "production"
        ? StackEnvParams.production
        : infraConfig.envName === "staging"
          ? StackEnvParams.staging
          : StackEnvParams.development;
