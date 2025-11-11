#!/bin/bash
# Script to help identify and fix 'any' types in the codebase
# This is a helper script - actual fixes should be done manually with proper types

echo "Finding all 'any' type usages..."
grep -r ": any\|as any\|any\[" src/modules --include="*.ts" | grep -v "node_modules" | wc -l

echo "Finding eslint-disable comments..."
grep -r "eslint-disable" src/modules --include="*.ts" | wc -l

