use anchor_lang::prelude::*;
use anchor_spl::token_interface::{TokenInterface, Mint, TokenAccount, TransferChecked, transfer_checked, mint_to, MintTo, burn, Burn};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::Vault;
use anchor_lang::solana_program::pubkey;


// Use to test USDC restriction on localnet
// pub const USDC: Pubkey = pubkey!("5kPLgEdCvumyEBgSWoFGTpzQzd8d89kMUsN1UtxPezzM");

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        //address = Mint::USDC
    )]
    pub usdc: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = user,
        seeds = [b"vault"],
        space = Vault::INIT_SPACE,
        bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = usdc,
        associated_token::authority = vault
    )]
    pub vault_ata_usdc: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = usdc,
        associated_token::authority = user,
    )]
    pub user_ata_usdc: InterfaceAccount<'info, TokenAccount>,


    #[account(
        mut,
        seeds = [b"our_token"],
        bump
    )]
    pub our_token: InterfaceAccount<'info, Mint>,

    // Create Associated Token Account, if needed
    // This is the account that will hold the minted tokens
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = our_token,
        associated_token::authority = user,
    )]
    pub user_ata_our_token: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>, 
}

impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self, bumps: &WithdrawBumps, amount: u64) -> Result<()> {
        self.burn(amount);
        self.transfer(bumps, amount)
    }

    pub fn transfer(&mut self, bumps: &WithdrawBumps, amount: u64) -> Result<()> {
        let signer_seeds: [&[&[u8]];1] = [
            &[
                b"vault", 
                &[bumps.vault]
            ]
        ];


        // Create CPI context
        let cpi_accounts = TransferChecked {
            from: self.vault_ata_usdc.to_account_info(),
            to: self.user_ata_usdc.to_account_info(),
            authority: self.vault.to_account_info(),
            mint: self.usdc.to_account_info(),
        };

        // Fetch CPI program
        let cpi_program = self.token_program.to_account_info();

        // Create CPI context
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, &signer_seeds);

        // Transfer deposit amount to vault by invoking transfer_checked
        transfer_checked(cpi_ctx, amount, self.usdc.decimals)
    }

    pub fn burn(&mut self, amount: u64) -> Result<()> {
        let cpi_accounts = Burn {
            from: self.user_ata_our_token.to_account_info(),
            authority: self.user.to_account_info(),
            mint: self.our_token.to_account_info(),
        };

        // Fetch CPI program
        let cpi_program = self.token_program.to_account_info();

        // Create CPI context
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        burn(cpi_ctx, amount* 1000)
    }

}
