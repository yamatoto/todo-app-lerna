import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import { infraConfig } from "./config";
import { StackEnvironmentParams } from "./type";
import { Constants } from "./constants";

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

export class Route53Stack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const hostedZone = new route53.HostedZone(this, "HostedZone", {
            zoneName: `${params.domainPrefix}${Constants.domainName}`,
            comment: `${Constants.systemName}-${params.envName}-hostedzone`
        });

        const recordSetCaa =
            infraConfig.envName === "production"
                ? new route53.CaaRecord(this, "RecordSetCaa", {
                      zone: hostedZone,
                      values: [
                          {
                              flag: 0,
                              tag: route53.CaaTag.ISSUE,
                              value: "amazon.com"
                          }
                      ],
                      ttl: cdk.Duration.seconds(3600)
                  })
                : null;

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
        if (recordSetCaa) {
            new cdk.CfnOutput(this, "RecordSetCaaOutPut", {
                value: recordSetCaa.domainName,
                exportName: `${Constants.systemName}-${id}-RecordSetCaa`
            });
        }
        // コピペ用に一応出力
        const nsArray = hostedZone.hostedZoneNameServers as string[];
        new cdk.CfnOutput(this, "HostedZoneNameServersOutPut", {
            value: cdk.Fn.join(",", nsArray),
            exportName: `${exportNamePrefix}-HostedZoneNameServers`
        });
    }
}
