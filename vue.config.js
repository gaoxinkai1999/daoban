const { VantResolver } = require('@vant/auto-import-resolver');
const { defineConfig } = require('@vue/cli-service');
const Components = require('unplugin-vue-components/webpack').default;
const webpack = require('webpack');

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [
      Components({
        resolvers: [VantResolver()],
      }),
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
      }),
    ],
  },
});
