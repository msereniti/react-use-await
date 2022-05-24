#!/bin/sh

rm -rf dist &&
tsc --outDir dist &&

esbuild --minify --sourcemap src/useAwait.tsx --outfile=dist/index.js --target=esnext --format=cjs && 
esbuild --minify --sourcemap src/useAwait.tsx --outfile=dist/index.mjs --target=esnext --format=esm 