module.exports = {
  root: true,
  // This tells ESLint to load the config from the package `eslint-config-up4wjs`
  extends: ["up4wjs"],
  settings: {
    next: {
      rootDir: ["examples/*/"],
    },
  },
};
