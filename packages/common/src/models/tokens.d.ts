export interface TezosToken {
    /**
     * Token address on the Tezos network
     */
    readonly address: string;
    /**
     * Token type, e.g., FA2 or FA1.2
     */
    readonly type: 'FA2' | 'FA1.2';
    /**
     * Token symbol, e.g., "USDt", "tzBTC"
     */
    readonly symbol: string;
    /**
     * Token decimals, e.g., 8 for tzBTC
     */
    readonly decimals: number;
}
export interface Erc20Token {
    /**
     * Token address on the EVM network
     */
    readonly address: string;
    /**
     * Token symbol, e.g., "USDC", "DAI"
     */
    readonly symbol: string;
    /**
     * Token decimals, e.g., 6 for USDC
     */
    readonly decimals: number;
}
