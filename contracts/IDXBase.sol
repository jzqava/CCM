pragma solidity ^0.4.24;

// Exchange Traded Fund/Index Fund
contract IDXBase {

    /*** DATA TYPES ***/
    // This is a type for a single share.
    struct Underlying {
        bytes32 name; // short name (up to 32 bytes)
        uint amount; // weight in percentage
        uint price;  // price of the Share
    }

    /*** STORAGE ***/
    // A dynamically-sized array of 'Underlying' structs.
    Underlying[] public basket;
    // discription fields for the ETF
    bool isIssued; //flag for whether the note is issued
    address public issuer;
    bytes32 fundName; //note name
    bytes32 issueDate;
    //uint factor;
    uint fee; // management fee in percentage
    uint public outstandingBalance; //total oustanding ETF issued
    mapping (address => uint) public balances;

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
    // ----------------------------------------------------------------------------------
    // Issuer functions

    // This is the new issuance part 1 - add FI and EQ
    function newIssue(bytes32[] underlyingName,
                      uint[] underlyingWeight,
                      uint[] underlyingPrice,
                      uint basePrice,
                      bytes32 name,
                      bytes32 issuingDate,
                      uint managementFee,
                      uint amount) public returns(bool success) {

        // make sure the issuer is the one performing issuance
        require(msg.sender == issuer,
                "Only the issuer can call new issue function."
        );

        // make sure the note has not been issued before
        require(isIssued == false,
                "Note has been issued already, check issued note."
        );

        // Need name and weight to have the same length
        require(
            underlyingName.length == underlyingWeight.length && underlyingName.length == underlyingPrice.length,
            "Number of Shares Names and Number of Share weight and Number of price need to match."
        );

        // Need weight totals to 1 eth
        //for (uint k = 0; k < underlyingName.length; k++) {
        //    uint total = 0;
        //    total = total + underlyingWeight[k];
        //}
        //require(
        //    total == 1 ether,
        //    "Total of weight need to be 10000 %00"
        //);


        // For each of the provided share name and share weight
        // create a new Underlying object and add it
        // to the end of the array.
        //uint eth = 1 ether;
        for (uint n = 0; n < underlyingName.length; n++) {
            // 'Underlying({...})' creates a temporary
            // Underlying object and 'basket.push(...)'
            // appends it to the end of `basket`.
            basket.push(Underlying({
                name: underlyingName[n],
                amount: basePrice*underlyingWeight[n]/underlyingPrice[n],
                price: underlyingPrice[n]
            }));
        }

        isIssued = true;
        outstandingBalance = 0;
        fundName = name;
        issueDate=issuingDate;
        fee = managementFee;

        // Add amount to outstanding
        // Issued amount initially belongs to issuer
        outstandingBalance = outstandingBalance + amount;
        balances[msg.sender] += amount;

        return true;
    }


    function additionalIssue(uint amount) public returns(bool success){
        // make sure the issuer is the one performing issuance
        require(msg.sender == issuer,
                "Only the issuer can call new issue function."
        );
        outstandingBalance = outstandingBalance + amount;
        balances[msg.sender] += amount;
        return true;
    }

    function updatePrice(bytes32[] underlyingName, uint[] newPrice) public returns(bool success){
        // make sure the issuer is the one performing issuance
        require(msg.sender == issuer,
                "Only the issuer can call new issue function."
        );

        // update price
        for (uint n = 0; n < underlyingName.length; n++) {
            for (uint i = 0; i < basket.length; i++) {
                if (underlyingName[n] == basket[i].name) {
                    basket[i].price = newPrice[n];
                }
            }
        }

        return true;
    }

    // This is the rebalancer
    function rebalance(bytes32[] underlyingName,
                        uint[] underlyingWeight,
                        uint[] underlyingPrice,
                        uint basePrice) public {
        // make sure the issuer is the one performing rebalancing
        if (msg.sender != issuer) return;

        // Need name and weight and price to have the same length
        require(
            underlyingName.length == underlyingWeight.length && underlyingName.length == underlyingPrice.length,
            "Number of Shares Names and Number of Share weight and Number of price need to match."
        );

        // Need weight totals to 1 ether
        //for (uint k = 0; k < underlyingName.length; k++) {
        //    uint total = 0;
        //    total = total + underlyingWeight[k];
        //}
        //require(
        //    total == 1 ether,
        //    "Total of weight need to be 10000 %00"
        //);

        // Delete all the old basket
        for (uint o = basket.length; o > 0; o--) {
            // There is no 'basket.pop(...)'
            // need to delete one by one
            delete basket[o-1];
            basket.length--;
        }
        require(
            basket.length == 0,
            "Need to clear basket before add new basket"
        );

        // For each of the provided share name and share weight
        // create a new Underlying object and add it
        // to the end of the array.
        for (uint n = 0; n < underlyingName.length; n++) {
            // 'Underlying({...})' creates a temporary
            // Underlying object and 'basket.push(...)'
            // appends it to the end of `basket`.
            basket.push(Underlying({
                name: underlyingName[n],
                amount: basePrice*underlyingWeight[n]/underlyingPrice[n],
                price: underlyingPrice[n]
            }));
        }

        //factor = basketFactor;

        // Add check to check NAV is the same before and after rebalancing
    }

    function payContract() public payable {
    }

    function closeFund() public returns(bool success){
        // make sure the issuer is the one performing issuance
        require(msg.sender == issuer,
            "Only the issuer can update price."
        );

        // Check all units as been redeemed/send back to issuer
        require(balances[issuer] == outstandingBalance,
            "Part of fund is not redeemed."
        );

        // Send remaining balance(if any) to the Issuer
        uint remainingBal = address(this).balance;
        issuer.transfer(remainingBal); // exclude gas?

        // Set issued to false and delete all the structs
        isIssued = false;
        // ...

        return true;
    }

// ----------------------------------------------------------------------------------
    // user function

    function sendFund(address receiver, uint amount) public returns(bool sufficient){
        require(msg.sender != issuer,
                "Issuer cannot send fund."
        );
        if (balances[msg.sender] < amount) return;
        balances[msg.sender] -= amount;
        balances[receiver] += amount;
        emit Sent(msg.sender, receiver, amount);
        return true;
    }

    function userGetSubscribePayable(uint amount) public view returns (uint) {

        // from getNav
        uint nav = getNAV();

        // Converstion between ETH and NAV?
        //uint ETHpayable = nav/100*amount;
        uint ETHpayable = nav*amount;

        // Check ETH balance from user
        uint ETHbalance;
        ETHbalance = (msg.sender).balance;
        // User has to have enough ETH for subscription
        require(ETHbalance >= ETHpayable,
                 "You don't have enough ETH balance"
        );

        // Check GSP balance from issuer
        uint ETFbalance;
        ETFbalance = balances[issuer];
        // Issuer has to have enough GSP note for subscription
        require(ETFbalance >= amount,
                "Issuer doesn't have enough GSP notes outstanding"
        );

        return (ETHpayable);
    }

    function userSubscribe(uint amount) public payable returns (bool) {

        // commission stays in the contract, pays at the end

        // Check ETH balance from user
        uint ETHbalance = (msg.sender).balance;
        // User has to have enough ETH for subscription
        require(ETHbalance >= msg.value,
            "You don't have enough ETH balance to subscribe."
        );

        // Add note units to user
        balances[msg.sender] += amount;
        balances[issuer] -= amount;

        return true;
    }

    function userGetRedeemReceivable(uint amount) public view returns(uint) {
        // from getNav
        uint nav = getNAVwithFeeDeducted();

        // Converstion between ETH and NAV
        //uint ETHreceivable = nav*amount/100;
        uint ETHreceivable = nav*amount;

        // Check GSP balance from user
        uint GSPbalance;
        GSPbalance = balances[msg.sender];
        // Issuer has to have enough fund for subscription
        require(GSPbalance >= amount,
                "You don't have enough fund to redeem"
        );

        // view redeemed value
        return(ETHreceivable);
    }

     function userRedeem(uint amount) public returns(bool) {
        // Allow user to redeem at anytime

        // from getNav
        uint nav = getNAVwithFeeDeducted();
        //uint ETHreceivable = nav*amount/100;
        uint ETHreceivable = nav*amount;

        // Check fund balance from user
        uint balance;
        balance = balances[msg.sender];
        // Issuer has to have enough fund for subscription
        require(balance >= amount,
            "User don't have enough fund to redeem"
        );

        // Send equalvilent ether to issuer
        (msg.sender).transfer(ETHreceivable);

        // Add note units to issuer
        balances[issuer] += amount;
        balances[msg.sender] -= amount;

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

    function getContractETHBalance() public view returns (uint) {
        return (address(this).balance);
    }

    function getIssuer() public view returns (address) {
        return issuer;
    }

    function getFundName() public view returns (bytes32) {
        return fundName;
    }

    function getFundBalance() public view returns (uint) {
        return balances[msg.sender];
    }

    function getBasket() public view
        returns (bytes32[] memory _name,uint[] _amount,uint[] _price) {
        uint length = basket.length;
        bytes32[] memory underlyingname = new bytes32[](length);
        uint[] memory amount = new uint[](length);
        uint[] memory price = new uint[](length);
        for (uint i = 0; i < basket.length; i++) {
            underlyingname[i]=basket[i].name;
            amount[i]=basket[i].amount;
            price[i]=basket[i].price;
        }
        return (underlyingname,amount,price);
    }

    function getNAV() public view returns (uint) {
        uint nav = 0;
        uint eth = 1 ether;

        //Adding Underlying price
        for (uint i = 0; i < basket.length; i++) {
            nav = nav + basket[i].price * basket[i].amount;
        }

        // Adjust
        nav = nav/eth;

        return nav;
    }

    function getNAVwithFeeDeducted() public view returns (uint) {
        uint nav = 0;
        uint eth = 1 ether;

        //Adding Underlying price
        for (uint i = 0; i < basket.length; i++) {
            nav  = nav + basket[i].price * basket[i].amount;
        }

        // Adjust
        nav = nav/eth;

        // minus fee
        uint managementFee = nav*fee/eth;

        return nav-managementFee;
    }

}
