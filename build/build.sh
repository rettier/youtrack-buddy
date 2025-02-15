#!/usr/bin/env bash

cd $(dirname $0)/..
functions=$(<functions.js)
main=$(<main.js)
tampermonkey=$(<build/tampermonkey.prod.js)
tampermonkey=${tampermonkey//--inline--/$functions$main}
mkdir -p dist
echo "$tampermonkey" > dist/release.js
