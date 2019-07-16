module.exports = {
    mode: "development",
    entry: {
      bundle: './src/index.js',
      worker: './src/worker.js'
    },
    //output: {
   //   filename: 'dist/main.js'
   // },
    module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
}
}