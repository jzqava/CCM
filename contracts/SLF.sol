pragma solidity ^0.4.24;

// Structured Leverage Fund
contract SLF {

    /*** DATA TYPES ***/
    // This is a type for tranche that pays
    struct FixedIncomeTier {
        bytes32 name; // short name
        uint weight; // weights in percentage - divided by 1 ether when use
        uint commission; // commission in percentage
        uint interest; // interest rate in percentage
    }

    struct EquityTier {
        bytes32 name; // short name
        uint weight; // weight in percentage - divided by 1 ether when use
        uint commission; // commission in percentage
    }

    /*** STORAGE ***/
    // A note is composed of the following:
    //uint commission; // commission in percentage - divided by 1 ether when use
    // A 'FixedIncomeTier' struct
    FixedIncomeTier public tierFI;
    // A 'EquityTier' struct
    EquityTier public tierEQ;

    // Future: A dynamically-sized array of 'ZeroCouponBond' struct
    // FixedIncomeTier[] public tierFIs;
    // Future: A dynamically-sized array of 'EquityTier' structs.
    // EquityTier[] public tierEQs;

    // discription fields for the fund
    bool isIssued; //flag for whether the note is issued
    address public issuer; // address of the issuer
    bytes32 fundName; //fund name
    uint public issueDate; // date of issuance of the gsp note
    uint public maturity; // date of maturity of the gsp note
    uint public outstandingBalance; // total oustanding parent fund unit issued

    // Equity Linked
    bytes32 public underlying; // name of underlying index or asset
    uint public initialPx;  // price of the underlying index or asset
    uint public currentPx;  // price of the current underlying index or asset

    // Data related to force liquidation
    uint public minParentLiqPct; // in percentage - divided by 1 ether when use
    uint public maxParentLiqPct; // in percentage - divided by 1 ether when use
    bool isLiquidated;
    uint liqDate;
    uint liqParentVal;
    uint liqEQVal; //uint[] liqEQVal;

    // Balance for FixedIncomeTier and EquityTier
    mapping(address => uint) public balancesFI;
    mapping(address => uint) public balancesEQ;
    // // Future: Dynamically-sized array for balances
    // mapping(address => uint)[] public balancesFIArray;
    // mapping(address => uint)[] public balancesEQArray;

    /*** EVENTS ***/
    // Events allow light clients to react on
    // changes efficiently.
    event Sent(address from, address to, uint amount);

    /*** CONSTRUCTOR FUNCTION ***/
    // This is the constructor whose code is
    // run only when the contract is created.
    constructor() public {
        issuer = msg.sender;
        isIssued = false;
    }

    /*** FUNCTIONS ***/
    // -------------------------------------------------------------------------
    // Issuer functions

    // This is the new issuance part 1 - add FI and EQ
    function newIssue1(
                bytes32 FIName,
                uint FIWeight,
                uint FICommission,
                uint FIInterest,
                bytes32 EQName,
                uint EQWeight,
                uint EQCommission
                ) public returns(bool success){

        // make sure the issuer is the one performing issuance
        require(msg.sender == issuer,
                "Only the issuer can call new issue function."
        );

        // make sure the note has not been issued before
        require(isIssued == false,
            "Note has been issued already, check issued note."
        );

        // // make sure weights total to 1 ether
        // require((tierFI.weight + tierEQ.weight) == (1 ether),
        //     "Total percentage has to be 100%"
        // );

        // FI tier
        tierFI=FixedIncomeTier({
                name:           FIName,
                weight:         FIWeight,
                commission:     FICommission,
                interest:       FIInterest
        });

        // EQ tier
        tierEQ=EquityTier({
                name:           EQName,
                weight:         EQWeight,
                commission:     EQCommission
        });

        return true;
    }
        // This is the new issuance part 2
    function newIssue2(
                bytes32 noteName,
                uint noteIssueDate,
                uint noteMaturity,
                bytes32 underlyingName,
                uint initialUnderlyingPx,
                uint minLiqVal,
                uint maxLiqVal,
                uint amount
                ) public returns(bool success){
        // ERC721 compliant
        //uint256 tokenId = allTokens.length + 1;
        //_mint(msg.sender, tokenId);

        // make sure the issuer is the one performing issuance
        require(msg.sender == issuer,
                "Only the issuer can call new issue function."
        );

        // make sure the note has not been issued before
        require(isIssued == false,
                "Note has been issued already, check issued note."
        );

        // basic note data
        isIssued = true;
        outstandingBalance = 0;
        fundName = noteName;
        issueDate = noteIssueDate;
        maturity = noteMaturity;

        // Equity Linked data
        underlying = underlyingName;
        initialPx = initialUnderlyingPx;
        currentPx = initialUnderlyingPx;

        // Liquidation data
        isLiquidated = false;
        minParentLiqPct = minLiqVal;
        maxParentLiqPct = maxLiqVal;

        // Add amount to outstanding
        // Issued amount initially belongs to issuer
        outstandingBalance = outstandingBalance + amount;
        balancesFI[msg.sender] += amount * tierFI.weight/(1 ether);
        balancesEQ[msg.sender] += amount * tierEQ.weight/(1 ether);

        return true;
    }


    function additionalIssue(uint amount) public returns(bool success){
        // make sure the issuer is the one performing issuance
        require(msg.sender == issuer,
            "Only the issuer can call new issue function."
        );
        outstandingBalance = outstandingBalance + amount;
        balancesFI[msg.sender] += amount * tierFI.weight/(1 ether);
        balancesEQ[msg.sender] += amount * tierEQ.weight/(1 ether);
        return true;
    }

    function updatePrice(uint newPrice, uint updateDate) public returns(bool success){
        // make sure the issuer is the one performing issuance
        require(msg.sender == issuer,
            "Only the issuer can update price."
        );

        // make sure the note is not liquidated
        require(isLiquidated == false,
            "You cannot update price for liquidated note."
        );

        // update parent fund price to new price
        currentPx=newPrice;

        // Check if the new price reach below the min or max
        // If so, liquidate the fund
        uint parentFundVal = (currentPx/initialPx) * 1 ether ;
        if (parentFundVal <= minParentLiqPct) {
            // Perform Liquidation
            isLiquidated = true;
            liqDate = updateDate;
            liqParentVal = getNAV();
            liqEQVal = getEQNAV();
            // send comission back to issuer
        }
        if (parentFundVal >= maxParentLiqPct) {
            // Perform Liquidation
            isLiquidated = true;
            liqDate = updateDate;
            liqParentVal = getNAV();
            liqEQVal = getEQNAV();
            // send comission back to issuer
        }
        return true;
    }

    function payContract() public payable {
    }

    function closeFund(uint closeDate) public returns(bool success){
        // make sure the issuer is the one performing issuance
        require(msg.sender == issuer,
            "Only the issuer can update price."
        );

        // Require either reach maturity or liquidated
        require((closeDate >= maturity) || (isLiquidated == true),
            "Maturity not reached yet."
        );

        // Check all units as been redeemed/send back to issuer
        require(balancesFI[issuer] == outstandingBalance*tierFI.weight/(1 ether),
            "Part of FI tier is not redeemed."
        );
        require(balancesEQ[issuer] == outstandingBalance*tierEQ.weight/(1 ether),
            "Part of EQ tier is not redeemed."
        );

        // Send remaining commission to the Issuer
        // uint commissionPayable = (commission)*amount;
        // issuer.transfer(commissionPayable);
        uint remainingBal = address(this).balance;
        issuer.transfer(remainingBal); // exclude gas?

        isLiquidated = true;
        // Set issued to false and delete all the structs
        // ...

        return true;
    }

// ----------------------------------------------------------------------------------
    // user functions

    function sendNote(bytes32 tierName, address receiver, uint amount) public {
        // Don't allow issuer to send
        // since issue's notes are not sold
        // no ether to back up
        // make sure the issuer is the one performing issuance
        require(msg.sender != issuer,
            "Issuer cannot send GSP notes."
        );

        // tierName has to be either tierFI or tierEQ
        require((tierName == tierFI.name) || (tierName == tierEQ.name),
            "Tier name doesn not exists."
        );
        if (tierName == tierFI.name) {
            if (balancesFI[msg.sender] < amount) return;
            balancesFI[msg.sender] -= amount;
            balancesFI[receiver] += amount;
        }
        else {
            if (balancesEQ[msg.sender] < amount) return;
            balancesEQ[msg.sender] -= amount;
            balancesEQ[receiver] += amount;
        }
        emit Sent(msg.sender, receiver, amount);
    }

    function userGetSubscribePayable(bytes32 tierName, uint amount) public view returns (uint) {
        // tierName has to be either tierFI or tierEQ
        require((tierName == tierFI.name) || (tierName == tierEQ.name),
            "Tier name doesn not exists."
        );

        uint ETHpayable;

        // For FI tier - subscribe with no interest
        if (tierName == tierFI.name) {
            ETHpayable = amount * 1 ether;
        }

        // For EQ tier - subscribe with par
        if (tierName == tierEQ.name) {
            ETHpayable = amount * 1 ether;
        }

        // // Check ETH balance from user
        // uint ETHbalance;
        // ETHbalance = (msg.sender).balance;
        // // User has to have enough ETH for subscription
        // require(ETHbalance >= ETHpayable,
        //         "You don't have enough ETH balance to subscribe."
        // );

        return (ETHpayable);
    }

    function userSubscribe(bytes32 tierName, uint amount) public payable returns (bool) {
        // tierName has to be either tierFI or tierEQ
        require((tierName == tierFI.name) || (tierName == tierEQ.name),
            "Tier name doesn not exists."
        );

        // Check ETH balance from user
        uint ETHbalance = (msg.sender).balance;
        // User has to have enough ETH for subscription
        require(ETHbalance >= msg.value,
            "You don't have enough ETH balance to subscribe."
        );

        // For FI tier
        if (tierName == tierFI.name) {

            // Check fund balance from issuer
            uint FIBalance;
            FIBalance = balancesFI[issuer];
            // Issuer has to have enough balance for subscription
            require(FIBalance >= amount,
                "Issuer doesn't have enough units outstanding"
            );

            // Ether is paid to the contract
            // Commission is paid at maturity/liquidation
            // Do nothing at subscription


            // Add note units to user
            balancesFI[msg.sender] += amount;
            balancesFI[issuer] -= amount;
        }

        // For EQ tier
        if (tierName == tierEQ.name) {
            // Check fund balance from issuer
            uint EQBalance;
            EQBalance = balancesEQ[issuer];
            // Issuer has to have enough balance for subscription
            require(EQBalance >= amount,
                "Issuer doesn't have enough units outstanding"
            );

            // Add note units to user
            balancesEQ[msg.sender] += amount;
            balancesEQ[issuer] -= amount;
        }

        return true;
    }

    function userGetRedeemReceivable(bytes32 tierName, uint amount) public view returns(uint) {
         // tierName has to be either tierFI or tierEQ
        require((tierName == tierFI.name) || (tierName == tierEQ.name),
            "Tier name doesn not exists."
        );

        uint ETHreceivable;
        //= nav*amount/100;

        // For FI tier
        if (tierName == tierFI.name) {
            uint FInav = getFINAV();
            ETHreceivable = FInav*amount/100;

            // // Check fund balance from user
            // uint FIbalance;
            // FIbalance = balancesFI[msg.sender];
            // // Issuer has to have enough GSP note for subscription
            // require(FIbalance >= amount,
            //     "User don't have enough GSP notes to redeem"
            // );
        }

        // For EQ tier
        if (tierName == tierEQ.name) {
            uint EQnav = getEQNAV();
            ETHreceivable = EQnav*amount/100;

            // // Check fund balance from user
            // uint EQbalance;
            // EQbalance = balancesEQ[msg.sender];
            // // Issuer has to have enough GSP note for subscription
            // require(EQbalance >= amount,
            //     "User don't have enough GSP notes to redeem"
            // );
        }

        // view redeemed value
        return(ETHreceivable);
    }

     function userRedeem(bytes32 tierName, uint amount) public returns(bool) {

        // tierName has to be either tierFI or tierEQ
        require((tierName == tierFI.name) || (tierName == tierEQ.name),
            "Tier name doesn not exists."
        );

         // Only allow user to redeem at maturity
         // Add code here ....
         // Maybe allow early redemption for a penalty
         // Add code here ...

        uint ETHreceivable;

        // For FI tier
        if (tierName == tierFI.name) {
            uint FInav = getFINAV();
            ETHreceivable = FInav*amount/100;

            // Check fund balance from user
            uint FIbalance;
            FIbalance = balancesFI[msg.sender];
            // Issuer has to have enough GSP note for subscription
            require(FIbalance >= amount,
                "User don't have enough GSP notes to redeem"
            );

            // Send equalvilent ether to issuer
            (msg.sender).transfer(ETHreceivable);

            // Add note units to issuer
            balancesFI[issuer] += amount;
            balancesFI[msg.sender] -= amount;
        }

        // For EQ tier
        if (tierName == tierEQ.name) {
            uint EQnav = getEQNAV();
            ETHreceivable = EQnav*amount/100;

            // Check fund balance from user
            uint EQbalance;
            EQbalance = balancesEQ[msg.sender];
            // Issuer has to have enough GSP note for subscription
            require(EQbalance >= amount,
                "User don't have enough GSP notes to redeem"
            );

            // Send equalvilent ether to issuer
            (msg.sender).transfer(ETHreceivable);

            // Add note units to issuer
            balancesEQ[issuer] += amount;
            balancesEQ[msg.sender] -= amount;
        }

        return true;
     }
// ----------------------------------------------------------------------------------
    // For display information
    function getIfIssued() public view returns (bool) {
        return isIssued;
    }

    function getOutstanding() public view returns (uint) {
        return outstandingBalance;
    }

    function getFIOutstanding() public view returns (uint) {
        return outstandingBalance * tierFI.weight/(1 ether);
    }

    function getEQOutstanding() public view returns (uint) {
        return outstandingBalance * tierEQ.weight/(1 ether);
    }

    function getContractETHBalance() public view returns (uint) {
        return (address(this).balance);
    }

    function getIssuer() public view returns (address) {
        return issuer;
    }

    function getNoteName() public view returns (bytes32) {
        return fundName;
    }

    function getIssueDate() public view returns (uint) {
        return issueDate;
    }

    function getMaturity() public view returns (uint) {
        return maturity;
    }

    function getUnderlyingName() public view returns (bytes32) {
        return underlying;
    }

    function getUnderlyingInitialPx() public view returns (uint) {
        return initialPx;
    }

    function getUnderlyingCurrentPx() public view returns (uint) {
        return currentPx;
    }

    function getMinLiqPct() public view returns (uint) {
        return minParentLiqPct;
    }

    function getMaxLiqPct() public view returns (uint) {
        return maxParentLiqPct;
    }

    function getIfLiquidated() public view returns (bool) {
        return isLiquidated;
    }

    function getLiqDate() public view returns (uint) {
        return liqDate;
    }

    function getLiqVal() public view returns (uint) {
        return liqParentVal;
    }

    function getLiqEQVal() public view returns (uint) {
        return liqEQVal;
    }

    function getFITierName() public view returns (bytes32) {
        return tierFI.name;
    }

    function getEQTierName() public view returns (bytes32) {
        return tierEQ.name;
    }

    function getBalance(bytes32 tierName) public view returns (uint) {
        // tierName has to be either tierFI or tierEQ
        require((tierName == tierFI.name) || (tierName == tierEQ.name),
            "Tier name doesn not exists."
        );

        if (tierName == tierFI.name) {
            return balancesFI[msg.sender];
        }
        else {
            return balancesEQ[msg.sender];
        }
    }

    function getTierFI() public view
        returns (bytes32 FIname,uint FIweight,uint FIinterest) {
        return (tierFI.name,tierFI.weight,tierFI.interest);
    }

    function getTierEQ() public view
        returns (bytes32 EQname,uint EQweight) {
        return (tierEQ.name,tierEQ.weight);
    }

    // Not excluding commission
    function getNAV() public view returns (uint) {
        uint base = 100 ether;
        return base*currentPx/initialPx;
    }

    // Excluding commission
    function getFINAV() public view returns (uint) {
        uint base = 100 ether;
        // include interest
        return base + tierFI.interest*100;
    }

    // Excluding commission
    function getEQNAV() public view returns (uint) {
        uint base = 100 ether;
        uint eth = 1 ether;
        uint parentFundVal = base*currentPx/initialPx;
        uint FITierVal = base + tierFI.interest*100;
        uint FITierCommission = tierFI.commission*100;
        // need to multiple first before divide
        // otherwise will have decimal cut off
        uint FIAfterScaling = (FITierVal+FITierCommission)*tierFI.weight/eth;
        uint EQAfterScaling = parentFundVal - FIAfterScaling;
        uint EQBeforeScaling = EQAfterScaling*eth/tierEQ.weight;
        uint EQTierCommission = EQBeforeScaling*tierEQ.commission/eth;
        return EQBeforeScaling - EQTierCommission;
    }

}
