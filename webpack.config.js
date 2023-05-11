
const path = require('path')
const fs = require('fs-extra')
const webpack = require('webpack')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

/**
 * Webpack can be passed a few environment variables to override the default
 * files used to run this project. The environment variables are CUSTOM_CSS,
 * HTML_FILE, YAML_CONFIG, and JS_CONFIG. They must each be passed in the
 * format --env.*=/path/to/file. For example:
 *
 *    yarn start --env.YAML_CONFIG=/absolute/path/to/config.yml
 */
module.exports = async env => {
  // Gather the CSS, HTML, YAML, and JS override files.

  const HTML_FILE = env && env.HTML_FILE || 'src/index.tpl.html'

//TODO new var configfile

  const YAML_CONFIG = env && env.YAML_CONFIG || './config.yml'
  // resolve the custom js file. If it is present, copy the file to a
  // temporary folder within this project so that the file will be able to
  // use the node_modules from this project

  const def_themes_path = path.resolve(__dirname, `src/themes/`);

  const THEMES_PATH = (env && env.THEMES_PATH) ? env.THEMES_PATH : def_themes_path;
  const THEME = (env && env.THEME) ? env.THEME : 'default';

  const THEME_PATH = path.join(THEMES_PATH, THEME, 'index.scss');

  if(fs.existsSync(THEME_PATH) === false) {
    console.warn(`Error theme path not exists: '${THEME_PATH}'`);
    process.exit(1)
  }

  let customJsFile = './config.js';
  if (env && env.JS_CONFIG) {
    const splitPath = env.JS_CONFIG.split(path.sep)
    customJsFile = `../tmp/${splitPath[splitPath.length - 1]}`
    // copy location is relative to root, while js file for app is relative to src
    await fs.copy(env.JS_CONFIG, `./tmp/${splitPath[splitPath.length - 1]}`)
  }

  return {
    entry: [
      './src/main.js'
    ],
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader']
        },
        {
          test: /\.(yml|yaml)$/,
          loader: ['json-loader', 'yaml-loader']
        },
        {
          test: /\.(sc|c)ss$/,
          use: [
            'css-hot-loader',
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: "sass-loader",
              /*options: {
                //TODO check if additionalData used
                additionalData:  (content, loaderContext) => {
                  return `$THEME: '${THEME}';`
                }
              }*/
            }
          ],
        },
        {
          test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/,
          loader: 'url-loader?limit=30000&name=[name]-[hash].[ext]'
        }
      ]
    },
    resolve: {
      extensions: ['*', '.js', '.jsx'],
      alias: {
        THEME_PATH
      }
    },
    output: {
      auxiliaryComment: 'version',
      path: path.join(__dirname, '/dist'),
      publicPath: '',
      filename: 'bundle.js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: HTML_FILE,
        inject: 'body',
        filename: 'index.html'
      }),
      new MiniCssExtractPlugin(),
      new webpack.DefinePlugin({
        // Optionally override the default config files with some other
        // files.
        YAML_CONFIG: JSON.stringify(YAML_CONFIG),
        JS_CONFIG: JSON.stringify(customJsFile)
      })
    ],
    optimization: {
      minimizer: [
        new TerserPlugin(),
        new OptimizeCSSAssetsPlugin({})
      ]
    },
    devServer: {
      contentBase: './',
      historyApiFallback: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
      }
    }
  }
}
