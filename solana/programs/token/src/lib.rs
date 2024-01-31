use anchor_lang::prelude::*;

declare_id!("2j5DphxSZcCVyfUDvPc9AvztsLqfQ6dX71F9PvtskseF");

pub mod state;
pub mod contexts;

pub use state::*;
pub use contexts::*;

#[program]
pub mod token {

    use super::*;

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        ctx.accounts.deposit(&ctx.bumps, amount)
    }

    pub fn create_token(ctx: Context<CreateToken>, token_name: String, token_symbol: String, token_uri: String) -> Result<()> {
        ctx.accounts.create_token(token_name, token_symbol, token_uri, &ctx.bumps)
    }

}