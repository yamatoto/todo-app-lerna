import * as dotenv from "dotenv";
dotenv.config();

type Constants = {
    accountId: string;
    systemName: string;
    domainName: string;
    envName: {
        dev: string;
        stg: string;
        prod: string;
    };
    domainPrefix: {
        dev: string;
        stg: string;
        prod: string;
    };
};

export const Constants: Constants = {
    accountId: process.env.AWS_ACCOUNT_ID || "",
    systemName: "todo-app",
    domainName: process.env.DOMAIN_NAME || "",
    envName: {
        dev: "dev",
        stg: "stg",
        prod: "prod"
    },
    domainPrefix: {
        dev: "dev.",
        stg: "stg.",
        prod: ""
    }
};
