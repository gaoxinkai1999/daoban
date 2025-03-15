const { VantResolver } = require('@vant/auto-import-resolver');
const { defineConfig } = require('@vue/cli-service');
const Components = require('unplugin-vue-components/webpack').default;

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [
      Components({
        resolvers: [VantResolver()],
      }),
    ],
  },
});
