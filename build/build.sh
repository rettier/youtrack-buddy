#!/usr/bin/env bash

cd $(dirname $0)/..
functions=$(<functions.js)
main=$(<main.js)
tampermonkey=$(<build/tampermonkey.prod.js)
today=$(date +'%Y-%m-%d')
tampermonkey=${tampermonkey//YYYY-MM-DD/"$today"}
tampermonkey=${tampermonkey//--inline--/"$functions
$main"}
mkdir -p dist
echo "$tampermonkey" > dist/dist2.js
