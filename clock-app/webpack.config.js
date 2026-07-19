const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'clock-app',
  exposes: {
  "./ClockWidget": "./src/app/widgets/clock/clock.component/clock.component.ts",
  "./Alertbanner": "./src/app/widgets/alert/alert-banner.component/alert-banner.component.ts"
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

});