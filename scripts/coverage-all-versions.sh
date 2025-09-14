#!/usr/bin/env bash

# Test coverage across multiple Node.js versions
# Requires nvm to be installed

set -e

echo "📊 Running coverage tests across multiple Node.js versions"
echo "========================================================="

# Check if nvm is available
if ! command -v nvm &> /dev/null; then
    if [ -f "$HOME/.nvm/nvm.sh" ]; then
        source "$HOME/.nvm/nvm.sh"
    elif [ -f "/usr/local/opt/nvm/nvm.sh" ]; then
        source "/usr/local/opt/nvm/nvm.sh"
    else
        echo "⚠️  nvm not found. Running coverage with current Node.js version only."
        echo "Current version: $(node --version)"
        npm run test:coverage
        exit 0
    fi
fi

# Node versions to test (matching test-all-versions.sh)
NODE_VERSIONS=("18" "20" "22")

# Track results
declare -a RESULTS
FAILED=0

# Create coverage output directory if it doesn't exist
mkdir -p coverage

for VERSION in "${NODE_VERSIONS[@]}"; do
    echo ""
    echo "📦 Running coverage with Node.js v$VERSION"
    echo "----------------------------------------"

    if nvm list | grep -q "v$VERSION"; then
        nvm exec "$VERSION" node --version

        # Create version-specific coverage directory
        COVERAGE_DIR="coverage/node-$VERSION"
        mkdir -p "$COVERAGE_DIR"

        # Ensure we run in non-watch mode
        if nvm exec "$VERSION" npx vitest run --coverage; then
            # Move coverage report to version-specific directory
            if [ -d "coverage/lcov-report" ]; then
                cp -r coverage/lcov-report "$COVERAGE_DIR/"
            fi
            if [ -f "coverage/lcov.info" ]; then
                cp coverage/lcov.info "$COVERAGE_DIR/"
            fi

            RESULTS+=("✅ Node $VERSION: COVERAGE COMPLETED")

            # Display coverage summary if available
            if [ -f "coverage/coverage-summary.json" ]; then
                echo "Coverage Summary:"
                nvm exec "$VERSION" node -e "
                    const summary = require('./coverage/coverage-summary.json');
                    const total = summary.total;
                    console.log('  Lines:      ' + total.lines.pct + '%');
                    console.log('  Statements: ' + total.statements.pct + '%');
                    console.log('  Functions:  ' + total.functions.pct + '%');
                    console.log('  Branches:   ' + total.branches.pct + '%');
                " 2>/dev/null || true
            fi
        else
            RESULTS+=("❌ Node $VERSION: COVERAGE FAILED")
            FAILED=$((FAILED + 1))
        fi
    else
        echo "⚠️  Node.js v$VERSION not installed. Skipping..."
        RESULTS+=("⏭️  Node $VERSION: SKIPPED (not installed)")
    fi
done

# Summary
echo ""
echo "📊 Coverage Results Summary"
echo "=========================="
for RESULT in "${RESULTS[@]}"; do
    echo "$RESULT"
done

echo ""
echo "📁 Coverage reports saved in:"
for VERSION in "${NODE_VERSIONS[@]}"; do
    if [ -d "coverage/node-$VERSION" ]; then
        echo "   coverage/node-$VERSION/"
    fi
done

if [ $FAILED -gt 0 ]; then
    echo ""
    echo "❌ $FAILED version(s) failed coverage tests"
    exit 1
else
    echo ""
    echo "✅ All coverage tests completed!"
    exit 0
fi