const { ethers } = require("ethers");
const { ChainId, Fetcher, Token, Route, Percent, Trade, TokenAmount, TradeType } = require ('@uniswap/sdk');
require('dotenv').config()

const goerliInfuraUrl = 'https://goerli.infura.io/v3/41c57943e2fb405ea4739cf33cff403d';
const goerliProvider = new ethers.providers.JsonRpcProvider(goerliInfuraUrl);

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, goerliProvider);

const WETH = new Token(ChainId.GÖRLI, '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6', 18);
const LINK = new Token(ChainId.GÖRLI, '0x326c977e6efc84e512bb9c30f76e30c160ed06fb', 18);


const uniV2ABI = ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'];

const uniswapContract = new ethers.Contract('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', uniV2ABI, goerliProvider);

const run = async () => {
    try{
        const pair = await Fetcher.fetchPairData(LINK, WETH, goerliProvider);

        const route = new Route([pair], WETH);

        const slippageTolerance = new Percent('50', '10000');
        let amountIn = ethers.utils.parseEther('0.002');
        amountIn = amountIn.toString();


        const trade = new Trade(route, new TokenAmount(WETH, amountIn), TradeType.EXACT_INPUT);

        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
        const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString();

        const path = [WETH.address, LINK.address];
        const to = wallet.address
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20 

        const value = trade.inputAmount.raw; 
        const valueHex = await ethers.BigNumber.from(value.toString()).toHexString(); 


        const rawTxn = await uniswapContract.populateTransaction.swapExactETHForTokens(amountOutMinHex, path, to, deadline,
            {
            value: valueHex,
            gasLimit: 2100000
            });


        let sendTxn = (await wallet).sendTransaction(rawTxn);

   
        console.log((await sendTxn).hash);

        let reciept = (await sendTxn).wait();



    } catch(e){
        console.log(e)
    }


}

run();
