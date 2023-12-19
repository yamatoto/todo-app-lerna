import * as dotenv from "dotenv";
dotenv.config();

type Constants = {
    accountId: string;
    systemName: string;
    domainName: string;
};

export const Constants: Constants = {
    accountId: process.env.AWS_ACCOUNT_ID || "",
    systemName: "todo-app",
    domainName: process.env.DOMAIN_NAME || ""
};
