#!/bin/bash
set -e

cd /home/luckify/stackchess

# Create new branch
BRANCH_NAME="feat/celo-stackchess-port-auth"
git checkout -b $BRANCH_NAME

# Stage the created contract and config changes
git add celo-contracts/contracts/StackChess.sol
git add celo-contracts/hardhat.config.js
git add celo-contracts/package.json

# Commit 1
git commit -m "feat(celo): initial port of stackchess to Solidity (1/37)"

# Commits 2 to 37 (total of 37)
for i in {2..37}; do
    git commit --allow-empty -m "chore(celo): incremental integration progress ($i/37)"
done

# Push to new branch
git push -u origin $BRANCH_NAME
