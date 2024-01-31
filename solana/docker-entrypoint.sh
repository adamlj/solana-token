#!/bin/bash
#tail -f /etc/passwd
solana config set --url localhost
solana config get
solana airdrop 1000

solana-test-validator -r --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s clones/metadata.so --quiet