var minifier = require('minifier')

var input =  ['./build/Main.js',]

minifier.on('error', function(err) {
	console.log('Error in Js Files Minifier!')
})

minifier.minify(input, {output:'./bundle.min.js'})