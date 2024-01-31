use anchor_lang::prelude::*;

#[account]
pub struct Vault {
}

impl Space for Vault {
    const INIT_SPACE: usize = 8;
}