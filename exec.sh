#!/usr/bin/env bash
docker build -t authc-javascript-sample-01-login .
docker run --init -p 3000:3000 -it authc-javascript-sample-01-login