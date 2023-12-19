const { execSync } = require("child_process");
const root = process.cwd();
const green = "\u001b[32m";
const reset = "\u001b[0m";

const dotenvs = [".env"]; //  ".env.test"
const packages = ["api-server", "app", "infrastructure"];

for (let e of dotenvs) {
    for (let p of packages) {
        execSync(`ln -s -f ../../${e} ${root}/packages/${p}/${e}`);
    }
}

console.log(
    green +
        `
================================
.env symlink success.
(${packages.join(", ")})
================================
` +
        reset
);
