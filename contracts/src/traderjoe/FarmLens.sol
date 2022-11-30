// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;
import "../libraries/SafeMath.sol";
import "../libraries/SafeERC20.sol";

import "../interfaces/IERC20.sol";
import "./interfaces/IJoeERC20.sol";
import "./interfaces/IJoePair.sol";
import "./interfaces/IJoeFactory.sol";

import "../boringcrypto/BoringOwnable.sol";

interface IMasterChef {
    struct PoolInfo {
        IJoeERC20 lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. JOE to distribute per block.
        uint256 lastRewardTimestamp; // Last block number that JOE distribution occurs.
        uint256 accJoePerShare; // Accumulated JOE per share, times 1e12. See below.
    }

    function poolLength() external view returns (uint256);

    function poolInfo(uint256 pid) external view returns (IMasterChef.PoolInfo memory);

    function totalAllocPoint() external view returns (uint256);

    function joePerSec() external view returns (uint256);
}

contract FarmLens is BoringOwnable {
    using SafeMath for uint256;

    address public joe; // 0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd;
    address public wFIL; // 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    address public wFILUsdt; // 0xeD8CBD9F0cE3C6986b22002F03c6475CEb7a6256
    address public wFILUsdc; // 0x87Dee1cC9FFd464B79e058ba20387c1984aed86a
    address public wFILDai; // 0xA389f9430876455C36478DeEa9769B7Ca4E3DDB1
    IJoeFactory public joeFactory; // IJoeFactory(0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10);
    IMasterChef public chefv2; //0xd6a4F121CA35509aF06A0Be99093d08462f53052
    IMasterChef public chefv3; //0x188bED1968b795d5c9022F6a0bb5931Ac4c18F00

    constructor(
        address joe_,
        address wFIL_,
        address wFILUsdt_,
        address wFILUsdc_,
        address wFILDai_,
        IJoeFactory joeFactory_,
        IMasterChef chefv2_,
        IMasterChef chefv3_
    ) public {
        joe = joe_;
        wFIL = wFIL_;
        wFILUsdt = wFILUsdt_;
        wFILUsdc = wFILUsdc_;
        wFILDai = wFILDai_;
        joeFactory = IJoeFactory(joeFactory_);
        chefv2 = chefv2_;
        chefv3 = chefv3_;
    }

    /// @notice Returns price of FIL in usd.
    function getFILPrice() public view returns (uint256) {
        uint256 priceFromWFILUsdt = _getFILPrice(IJoePair(wFILUsdt)); // 18
        uint256 priceFromWFILUsdc = _getFILPrice(IJoePair(wFILUsdc)); // 18
        uint256 priceFromWFILDai = _getFILPrice(IJoePair(wFILDai)); // 18

        uint256 sumPrice = priceFromWFILUsdt.add(priceFromWFILUsdc).add(priceFromWFILDai); // 18
        uint256 FILPrice = sumPrice / 3; // 18
        return FILPrice; // 18
    }

    /// @notice Returns value of wFIL in units of stablecoins per wFIL.
    /// @param pair A wFIL-stablecoin pair.
    function _getFILPrice(IJoePair pair) private view returns (uint256) {
        (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();

        if (pair.token0() == wFIL) {
            reserve1 = reserve1.mul(_tokenDecimalsMultiplier(pair.token1())); // 18
            return (reserve1.mul(1e18)) / reserve0; // 18
        } else {
            reserve0 = reserve0.mul(_tokenDecimalsMultiplier(pair.token0())); // 18
            return (reserve0.mul(1e18)) / reserve1; // 18
        }
    }

    /// @notice Get the price of a token in Usd.
    /// @param tokenAddress Address of the token.
    function getPriceInUsd(address tokenAddress) public view returns (uint256) {
        return (getFILPrice().mul(getPriceInFIL(tokenAddress))) / 1e18; // 18
    }

    /// @notice Get the price of a token in FIL.
    /// @param tokenAddress Address of the token.
    /// @dev Need to be aware of decimals here, not always 18, it depends on the token.
    function getPriceInFIL(address tokenAddress) public view returns (uint256) {
        if (tokenAddress == wFIL) {
            return 1e18;
        }

        IJoePair pair = IJoePair(joeFactory.getPair(tokenAddress, wFIL));

        (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();
        address token0Address = pair.token0();
        address token1Address = pair.token1();

        if (token0Address == wFIL) {
            reserve1 = reserve1.mul(_tokenDecimalsMultiplier(token1Address)); // 18
            return (reserve0.mul(1e18)) / reserve1; // 18
        } else {
            reserve0 = reserve0.mul(_tokenDecimalsMultiplier(token0Address)); // 18
            return (reserve1.mul(1e18)) / reserve0; // 18
        }
    }

    /// @notice Calculates the multiplier needed to scale a token's numerical field to 18 decimals.
    /// @param tokenAddress Address of the token.
    function _tokenDecimalsMultiplier(address tokenAddress) private pure returns (uint256) {
        uint256 decimalsNeeded = 18 - IJoeERC20(tokenAddress).decimals();
        return 1 * (10**decimalsNeeded);
    }

    /// @notice Calculates the reserve of a pair in usd.
    /// @param pair Pair for which the reserve will be calculated.
    function getReserveUsd(IJoePair pair) public view returns (uint256) {
        address token0Address = pair.token0();
        address token1Address = pair.token1();

        (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();

        reserve0 = reserve0.mul(_tokenDecimalsMultiplier(token0Address)); // 18
        reserve1 = reserve1.mul(_tokenDecimalsMultiplier(token1Address)); // 18

        uint256 token0PriceInFIL = getPriceInFIL(token0Address); // 18
        uint256 token1PriceInFIL = getPriceInFIL(token1Address); // 18
        uint256 reserve0FIL = reserve0.mul(token0PriceInFIL); // 36;
        uint256 reserve1FIL = reserve1.mul(token1PriceInFIL); // 36;
        uint256 reserveFIL = (reserve0FIL.add(reserve1FIL)) / 1e18; // 18
        uint256 reserveUsd = (reserveFIL.mul(getFILPrice())) / 1e18; // 18

        return reserveUsd; // 18
    }

    struct FarmPair {
        uint256 id;
        uint256 allocPoint;
        address lpAddress;
        address token0Address;
        address token1Address;
        string token0Symbol;
        string token1Symbol;
        uint256 reserveUsd;
        uint256 totalSupplyScaled;
        address chefAddress;
        uint256 chefBalanceScaled;
        uint256 chefTotalAlloc;
        uint256 chefJoePerSec;
    }

    /// @notice Gets the farm pair data for a given MasterChef.
    /// @param chefAddress The address of the MasterChef.
    /// @param whitelistedPids Array of all ids of pools that are whitelisted and valid to have their farm data returned.
    function getFarmPairs(address chefAddress, uint256[] calldata whitelistedPids)
        public
        view
        returns (FarmPair[] memory)
    {
        IMasterChef chef = IMasterChef(chefAddress);

        uint256 whitelistLength = whitelistedPids.length;
        FarmPair[] memory farmPairs = new FarmPair[](whitelistLength);

        for (uint256 i = 0; i < whitelistLength; i++) {
            IMasterChef.PoolInfo memory pool = chef.poolInfo(whitelistedPids[i]);
            IJoePair lpToken = IJoePair(address(pool.lpToken));

            //get pool information
            farmPairs[i].id = whitelistedPids[i];
            farmPairs[i].allocPoint = pool.allocPoint;

            // get pair information
            address lpAddress = address(lpToken);
            address token0Address = lpToken.token0();
            address token1Address = lpToken.token1();
            farmPairs[i].lpAddress = lpAddress;
            farmPairs[i].token0Address = token0Address;
            farmPairs[i].token1Address = token1Address;
            farmPairs[i].token0Symbol = IJoeERC20(token0Address).symbol();
            farmPairs[i].token1Symbol = IJoeERC20(token1Address).symbol();

            // calculate reserveUsd of lp
            farmPairs[i].reserveUsd = getReserveUsd(lpToken); // 18

            // calculate total supply of lp
            farmPairs[i].totalSupplyScaled = lpToken.totalSupply().mul(_tokenDecimalsMultiplier(lpAddress));

            // get masterChef data
            uint256 balance = lpToken.balanceOf(chefAddress);
            farmPairs[i].chefBalanceScaled = balance.mul(_tokenDecimalsMultiplier(lpAddress));
            farmPairs[i].chefAddress = chefAddress;
            farmPairs[i].chefTotalAlloc = chef.totalAllocPoint();
            farmPairs[i].chefJoePerSec = chef.joePerSec();
        }

        return farmPairs;
    }

    struct AllFarmData {
        uint256 FILPriceUsd;
        uint256 joePriceUsd;
        uint256 totalAllocChefV2;
        uint256 totalAllocChefV3;
        uint256 joePerSecChefV2;
        uint256 joePerSecChefV3;
        FarmPair[] farmPairsV2;
        FarmPair[] farmPairsV3;
    }

    /// @notice Get all data needed for useFarms hook.
    /// @param whitelistedPidsV2 Array of all ids of pools that are whitelisted in chefV2.
    /// @param whitelistedPidsV3 Array of all ids of pools that are whitelisted in chefV3.
    function getAllFarmData(uint256[] calldata whitelistedPidsV2, uint256[] calldata whitelistedPidsV3)
        public
        view
        returns (AllFarmData memory)
    {
        AllFarmData memory allFarmData;

        allFarmData.FILPriceUsd = getFILPrice();
        allFarmData.joePriceUsd = getPriceInUsd(joe);

        allFarmData.totalAllocChefV2 = IMasterChef(chefv2).totalAllocPoint();
        allFarmData.joePerSecChefV2 = IMasterChef(chefv2).joePerSec();

        allFarmData.totalAllocChefV3 = IMasterChef(chefv3).totalAllocPoint();
        allFarmData.joePerSecChefV3 = IMasterChef(chefv3).joePerSec();

        allFarmData.farmPairsV2 = getFarmPairs(address(chefv2), whitelistedPidsV2);
        allFarmData.farmPairsV3 = getFarmPairs(address(chefv3), whitelistedPidsV3);

        return allFarmData;
    }
}
