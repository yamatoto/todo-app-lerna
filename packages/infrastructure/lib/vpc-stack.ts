import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { infraConfig } from "./config";
import { Az, StackEnvironmentParams } from "./type";
import { Constants } from "./constants";

type StackParams = {
    vpcCidrBlockBase: number;
    envName: string;
    tagPrefix: string;
};
const StackEnvParams: StackEnvironmentParams<StackParams> = {
    development: {
        vpcCidrBlockBase: 64,
        envName: Constants.envName.dev,
        tagPrefix: `${Constants.systemName}-${Constants.envName.dev}`
    },
    staging: {
        vpcCidrBlockBase: 32,
        envName: Constants.envName.stg,
        tagPrefix: `${Constants.systemName}-${Constants.envName.stg}`
    },
    production: {
        vpcCidrBlockBase: 0,
        envName: Constants.envName.prod,
        tagPrefix: `${Constants.systemName}-${Constants.envName.prod}`
    }
};

const params =
    infraConfig.envName === "production"
        ? StackEnvParams.production
        : infraConfig.envName === "staging"
          ? StackEnvParams.staging
          : StackEnvParams.development;

type SubnetType = "Public" | "Protected" | "Private";

export class VpcStack extends cdk.Stack {
    /**
     * <pre>
     * VPC内にサブネットを作成するためのファクトリ関数を生成します。
     * この関数は、指定されたルートテーブルIDとアベイラビリティゾーンを使用して、
     * 新しいサブネットを作成します。
     * サブネットは指定されたCIDRブロックを持ちます。
     * CIDRブロックは `10.0.x.0/24` の形式で、xは `vpcCidrBlockBase` に基づいて連番で割り当てられます。
     * これにより、各サブネットにユニークなアドレス範囲が保証されます。
     * </pre>
     * @param vpc VPC
     * @returns サブネットを作成する関数
     */
    private generateSubnetCreator({ vpcId }: Pick<ec2.Vpc, "vpcId">) {
        let cnt = 0;
        return (
            routeTable: ec2.CfnRouteTable,
            az: Az,
            subnetType: SubnetType
        ) => {
            const subnet = new ec2.Subnet(
                this,
                `Subnet${subnetType}${az.toUpperCase()}`,
                {
                    vpcId,
                    cidrBlock: `10.1.${params.vpcCidrBlockBase + cnt}.0/24`,
                    availabilityZone: `ap-northeast-1${az}`
                }
            );
            cnt++;

            cdk.Tags.of(subnet).add(
                "Name",
                `${params.tagPrefix}-public-subnet-${az}`
            );

            new ec2.CfnSubnetRouteTableAssociation(
                this,
                `SubnetRouteTableAssociation${subnetType}${az.toUpperCase()}`,
                {
                    subnetId: subnet.subnetId,
                    routeTableId: routeTable.ref
                }
            );

            return subnet;
        };
    }

    /**
     * <pre>
     * 指定されたルートテーブルにデフォルトルート（0.0.0.0/0）を設定します。
     * このデフォルトルートは、インターネットゲートウェイやNATゲートウェイへのトラフィックを
     * 指示するために使用されます。これにより、サブネット内のインスタンスが
     * インターネットまたは他のAWSサービスにアクセスできるようになります。
     * </pre>
     *
     * @param routeTable デフォルトルートを設定するルートテーブル
     * @param gateway トラフィックをルーティングするゲートウェイ
     * @param subnetType サブネットのタイプ（PublicまたはProtected）
     * @returns 作成されたルート
     */
    private createDefaultRoute(
        routeTable: ec2.CfnRouteTable,
        gateway: ec2.CfnInternetGateway | ec2.CfnNatGateway,
        subnetType: Exclude<SubnetType, "Private">
    ) {
        return new ec2.CfnRoute(this, `Route${subnetType}Default`, {
            routeTableId: routeTable.ref,
            destinationCidrBlock: "0.0.0.0/0",
            gatewayId: gateway.ref
        });
    }

    constructor(
        scope: Construct,
        id: string,
        props?: cdk.StackProps & {
            // Protected Subnetを作成するかどうか
            shouldCreateSubnetProtected: boolean;
        }
    ) {
        super(scope, id, props);
        const exportNamePrefix = `${Constants.systemName}-${id}`;

        const vpc = new ec2.Vpc(this, "Vpc", {
            ipAddresses: ec2.IpAddresses.cidr(
                `10.1.${params.vpcCidrBlockBase}.0/19`
            ),
            subnetConfiguration: [],
            vpcName: `${params.tagPrefix}-vpc`
        });

        // public
        const igw = new ec2.CfnInternetGateway(this, "InternetGateway", {
            tags: [
                {
                    key: "Name",
                    value: `${params.tagPrefix}-igw`
                }
            ]
        });
        new ec2.CfnVPCGatewayAttachment(this, "VPCGatewayAttachment", {
            vpcId: vpc.vpcId,
            internetGatewayId: igw.ref
        });
        const publicRt = new ec2.CfnRouteTable(this, `RouteTablePublic`, {
            vpcId: vpc.vpcId,
            tags: [
                {
                    key: "Name",
                    value: `${params.tagPrefix}-public-rtb`
                }
            ]
        });
        this.createDefaultRoute(publicRt, igw, "Public");
        const createSubnet = this.generateSubnetCreator(vpc);
        const [subnetPublicA, subnetPublicC, subnetPublicD] =
            Constants.azList.map((az) => createSubnet(publicRt, az, "Public"));

        // protected
        const [subnetProtectedA, subnetProtectedC, subnetProtectedD] =
            props?.shouldCreateSubnetProtected
                ? (() => {
                      const { attrAllocationId } = new ec2.CfnEIP(
                          this,
                          "EIPNATGatewayA",
                          {
                              tags: [
                                  {
                                      key: "Name",
                                      value: `${params.tagPrefix}-eip-nat-a`
                                  }
                              ]
                          }
                      );
                      const natGatewayA = new ec2.CfnNatGateway(
                          this,
                          "NATGatewayA",
                          {
                              allocationId: attrAllocationId,
                              subnetId: subnetPublicA.subnetId,
                              tags: [
                                  {
                                      key: "Name",
                                      value: `${params.tagPrefix}-nat-a`
                                  }
                              ]
                          }
                      );
                      return Constants.azList.map((az) => {
                          // NATゲートウェイを複数作る場合に備えて、Route Tableはサブネットごとに作っておく。
                          const protectedRt = new ec2.CfnRouteTable(
                              this,
                              `RouteTableProtected`,
                              {
                                  vpcId: vpc.vpcId,
                                  tags: [
                                      {
                                          key: "Name",
                                          value: `${params.tagPrefix}-protected-rtb${az}`
                                      }
                                  ]
                              }
                          );
                          this.createDefaultRoute(
                              protectedRt,
                              natGatewayA,
                              "Protected"
                          );
                          return createSubnet(protectedRt, az, "Protected");
                      });
                  })()
                : [];

        // private
        const privateRt = new ec2.CfnRouteTable(this, `RouteTablePrivate`, {
            vpcId: vpc.vpcId,
            tags: [
                {
                    key: "Name",
                    value: `${params.tagPrefix}-private-rtb`
                }
            ]
        });
        Constants.azList.forEach((az) =>
            createSubnet(privateRt, az, "Private")
        );

        const subnets = [
            {
                subnets: [
                    subnetPublicA,
                    subnetPublicC,
                    subnetPublicD,
                    ...(props?.shouldCreateSubnetProtected
                        ? [subnetProtectedA, subnetProtectedC, subnetProtectedD]
                        : [])
                ]
            }
        ];
        new ec2.GatewayVpcEndpoint(this, "VPCEndpointGatewayDynamoDB", {
            vpc,
            service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets
        });
        new ec2.GatewayVpcEndpoint(this, "VPCEndpointGatewayS3", {
            vpc,
            service: ec2.GatewayVpcEndpointAwsService.S3,
            subnets
        });

        // Outputs
        new cdk.CfnOutput(this, "VPCOutPut", {
            value: vpc.vpcId,
            exportName: `${exportNamePrefix}-VPC`
        });
        new cdk.CfnOutput(this, "SubnetPublicAOutPut", {
            value: subnetPublicA.subnetId,
            exportName: `${exportNamePrefix}-SubnetPublicA`
        });
        new cdk.CfnOutput(this, "SubnetPublicCOutPut", {
            value: subnetPublicC.subnetId,
            exportName: `${exportNamePrefix}-SubnetPublicC`
        });
        new cdk.CfnOutput(this, "SubnetPublicDOutPut", {
            value: subnetPublicD.subnetId,
            exportName: `${exportNamePrefix}-SubnetPublicD`
        });
        if (props?.shouldCreateSubnetProtected) {
            new cdk.CfnOutput(this, "SubnetProtectedA", {
                value: subnetProtectedA.subnetId,
                exportName: `${exportNamePrefix}-SubnetProtectedA`
            });
            new cdk.CfnOutput(this, "SubnetProtectedC", {
                value: subnetProtectedC.subnetId,
                exportName: `${exportNamePrefix}-SubnetProtectedC`
            });
            new cdk.CfnOutput(this, "SubnetProtectedD", {
                value: subnetProtectedD.subnetId,
                exportName: `${exportNamePrefix}-SubnetProtectedD`
            });
        }
    }
}
