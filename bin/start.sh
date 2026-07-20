#!/usr/bin/env bash

set -e

export NODE_OPTIONS="--import ./instrument.js"

exec fastify start server/plugin.js -a 0.0.0.0 -l info -o
