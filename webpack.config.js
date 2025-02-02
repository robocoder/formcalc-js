const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.mjs',
  output: {
    filename: 'formcalc.mjs',
    path: path.resolve(__dirname, 'dist'),
    //library: "formcalc",
    libraryTarget: "module",
  },
  externals: {
    chevrotain: "chevrotain",
  },
  experiments: {
    outputModule: true,
  },
};
