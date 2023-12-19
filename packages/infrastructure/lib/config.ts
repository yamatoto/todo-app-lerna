interface Config {
    envName: "development" | "staging" | "production";
}

const ENV_NAME = process.env.ENV_NAME as
    | "development"
    | "staging"
    | "production";

export const infraConfig: Config = {
    envName: ENV_NAME || "development"
};
