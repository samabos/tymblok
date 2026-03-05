#!/bin/bash
set -e

echo "=== Building workspace packages ==="
node ../../scripts/build-packages.js
echo "=== Workspace packages built successfully ==="
