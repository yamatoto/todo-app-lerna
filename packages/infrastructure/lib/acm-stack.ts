import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
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

export class AcmStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const certificateDomainName = `${params.domainPrefix}${Constants.domainName}`;
        const certificateSubjectAlternativeName = `*.${params.domainPrefix}${Constants.domainName}`;
        const certificate = new acm.Certificate(this, "Certificate", {
            domainName: certificateDomainName,
            subjectAlternativeNames: [certificateSubjectAlternativeName],
            validation: acm.CertificateValidation.fromDns(),
            certificateName: `${Constants.systemName}-${params.envName}-certificate-${props?.env?.region}`
        });

        // Outputs
        const exportNamePrefix = `${Constants.systemName}-${id}`;
        new cdk.CfnOutput(this, "CertificateOutPut", {
            value: certificate.certificateArn,
            exportName: `${exportNamePrefix}-Certificate`
        });
    }
}
