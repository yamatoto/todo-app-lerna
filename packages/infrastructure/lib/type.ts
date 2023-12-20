export type StackEnvironmentParams<T> = {
    local?: T;
    development: T;
    staging: T;
    production: T;
};

export type Az = "a" | "c" | "d";
