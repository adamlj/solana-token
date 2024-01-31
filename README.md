# Solana Token

This projects creates a Token which is 1:1 exchangeable with another coin (like USDC)

The project is containerized

## Start

docker compose up

## Development

Go to the Solana container with docker compose exec solana bash

anchor build
anchor deploy
anchor run test

## References

https://github.com/ASCorreia/program-examples/tree/main/tokens/token-swap-escrow/anchor