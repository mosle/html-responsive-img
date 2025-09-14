#!/usr/bin/env bash

# Test across multiple Node.js versions
# Requires nvm to be installed

set -e

echo "🚀 Testing html-responsive-img across multiple Node.js versions"
echo "================================================"

# Check if nvm is available
if ! command -v nvm &> /dev/null; then
    if [ -f "$HOME/.nvm/nvm.sh" ]; then
        source "$HOME/.nvm/nvm.sh"
    elif [ -f "/usr/local/opt/nvm/nvm.sh" ]; then
        source "/usr/local/opt/nvm/nvm.sh"
    else
        echo "⚠️  nvm not found. Testing with current Node.js version only."
        echo "Current version: $(node --version)"
        npm test
        exit 0
    fi
fi

# Node versions to test (matching our engines requirement: >=14.0.0)
NODE_VERSIONS=("18" "20" "22")

# Track results
declare -a RESULTS
FAILED=0

for VERSION in "${NODE_VERSIONS[@]}"; do
    echo ""
    echo "📦 Testing with Node.js v$VERSION"
    echo "--------------------------------"

    if nvm list | grep -q "v$VERSION"; then
        nvm exec "$VERSION" node --version

        if nvm exec "$VERSION" npm test; then
            RESULTS+=("✅ Node $VERSION: PASSED")
        else
            RESULTS+=("❌ Node $VERSION: FAILED")
            FAILED=$((FAILED + 1))
        fi
    else
        echo "⚠️  Node.js v$VERSION not installed. Skipping..."
        RESULTS+=("⏭️  Node $VERSION: SKIPPED (not installed)")
    fi
done

# Summary
echo ""
echo "📊 Test Results Summary"
echo "======================"
for RESULT in "${RESULTS[@]}"; do
    echo "$RESULT"
done

if [ $FAILED -gt 0 ]; then
    echo ""
    echo "❌ $FAILED version(s) failed tests"
    exit 1
else
    echo ""
    echo "✅ All tests passed!"
    exit 0
fi