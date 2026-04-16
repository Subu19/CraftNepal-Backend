const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');
const isProduction = process.env.NODE_ENV === 'production';

const options = {
  entryPoints: ['index.js'],
  bundle: true,
  outfile: 'dist/index.js',
  platform: 'node',
  target: 'node18',
  minify: isProduction,
  sourcemap: !isProduction,
  external: [
    // Native modules that shouldn't be bundled
    'bcrypt',
    'sharp',
    'mysql',
    'mysql2',
    'sqlite',
    'sqlite3',
    'pg',
    'better-sqlite3',
    // Mongoose types - must be external to work properly
    'mongoose'
  ],
  logLevel: 'info',
};

async function build() {
  try {
    if (isWatch) {
      const context = await esbuild.context(options);
      await context.watch();
      console.log('Watching for changes...');
    } else {
      await esbuild.build(options);
      console.log('Build completed successfully!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();

