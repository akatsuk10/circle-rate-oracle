use anchor_lang::prelude::*;

declare_id!("8Kns8bTCHGWYh2MUcYb4p7tK6subWE9jkyZiWq2T5Tn7");

#[program]
pub mod contract {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()> {
        let oracle = &mut ctx.accounts.oracle_state;
        oracle.admin = admin;
        oracle.circle_rates = Vec::new();
        Ok(())
    }

    pub fn add_city(
        ctx: Context<AdminAccount>,
        city_name: String,
        area: u64,
        circle_rate: u64,
        country: String,
    ) -> Result<()> {
        let oracle = &mut ctx.accounts.oracle_state;
        let signer = *ctx.accounts.admin.key;
        require!(signer == oracle.admin, OracleError::Unauthorized);
        require!(
            oracle.circle_rates.iter().all(|c| c.city_name != city_name),
            OracleError::CityAlreadyExists
        );

        oracle.circle_rates.push(CircleInfo {
            city_name: city_name,
            rate: circle_rate,
            timestamp: Clock::get()?.unix_timestamp as u64,
            country: country,
            area: area,
        });
        Ok(())
    }

    pub fn update_city_rate(
        ctx: Context<AdminAccount>,
        city_name: String,
        rate: u64,
    ) -> Result<()> {
        let oracle = &mut ctx.accounts.oracle_state;
        let signer = *ctx.accounts.admin.key;
        require!(signer == oracle.admin, OracleError::Unauthorized);
        require!(
            oracle.circle_rates.iter().any(|c| c.city_name == city_name),
            OracleError::CityNotSupported
        );
        if let Some(r) = oracle
            .circle_rates
            .iter_mut()
            .find(|r| r.city_name == city_name)
        {
            r.rate = rate;
            r.timestamp = Clock::get()?.unix_timestamp as u64;
        }
        Ok(())
    }
    pub fn get_circle_rate(ctx: Context<ViewRate>, city_name: String) -> Result<u64> {
        let oracle = &ctx.accounts.oracle_state;
        if let Some(r) = oracle
            .circle_rates
            .iter()
            .find(|r| r.city_name == city_name)
        {
            Ok(r.rate)
        } else {
            Err(OracleError::CityNotSupported.into())
        }
    }

    pub fn get_city_list(ctx: Context<ViewRate>) -> Result<Vec<CircleInfo>> {
        let oracle = &ctx.accounts.oracle_state;
        Ok(oracle.circle_rates.clone())
    }
}

#[account]
#[derive(InitSpace)]
pub struct OracleState {
    pub admin: Pubkey,
    #[max_len(32)]
    pub circle_rates: Vec<CircleInfo>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone,InitSpace)]
pub struct CircleInfo {
    #[max_len(32)]
    pub city_name: String,
    pub rate: u64,
    pub timestamp: u64,
    #[max_len(32)]
    pub country: String,
    pub area: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin_signer,
        space = OracleState::INIT_SPACE,
        seeds = [b"oracle-state"],
        bump
    )]
    pub oracle_state: Account<'info, OracleState>,

    #[account(mut)]
    pub admin_signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct AdminAccount<'info> {
    pub admin: Signer<'info>,

    #[account(mut)]
    pub oracle_state: Account<'info, OracleState>,
}

#[derive(Accounts)]
pub struct ViewRate<'info> {
    pub oracle_state: Account<'info, OracleState>,
}
#[error_code]
pub enum OracleError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("City not supported")]
    CityNotSupported,
    #[msg("Rate not valid")]
    RateNotValid,
    #[msg("City already exists")]
    CityAlreadyExists,
}
