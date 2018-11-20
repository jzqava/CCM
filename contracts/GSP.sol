pragma solidity ^0.4.24;

// Global Structured Product
contract GSP {

    // type for a bond
    struct ZeroCouponBond {
        bytes32 name;
        uint issueDate; // date if issuance
        uint maturity; // date of maturity
        uint yld;
        uint price; // in terms of par=100
        uint contractSize; // one contract means par=100
        bool isLong; // Long or short the bond
    }

    // type for a european option
    struct EuropeanOption {
        bytes32 name;
        bool isCall; //call or put
        bytes32 underlying;
        uint strike;
        uint expiration; //date of expiration
        uint price; // price of 1 contract
        uint contractSize; // one contract means 100 shares
        bool isLong; // Long or short the option
    }

    // type for a digital option (to add later)
    struct DigitalOption {
        bytes32 name;
        bool isCall; //call or put
        bytes32 underlying;
        uint strike;
        uint payoff;
        uint expiration; //date of expiration
        uint price;
        uint contractSize; // one contract means 100 shares
        bool isLong; // Long or short the option
    }

    // discription fields for the GSP note
    bool isIssued; // flag for whether the note is issued
    address public issuer; // address of the issuer
    bytes32 name; //note name
    uint public issueDate; // date of issuance of the gsp note
    uint public maturity; // date of maturity of the gsp note
    uint public outstandingBalance;  // total oustanding unit issued
    mapping (address => uint) public balances;

    // A GSP note is composed of the following:
    uint commission;
    // A 'ZeroCouponBond' struct
    ZeroCouponBond public bond;
    // A dynamically-sized array of 'EuropeanOption' structs.
    EuropeanOption[] public europeanOptions;
    // A dynamically-sized array of 'DigitalOption' structs.
    //DigitalOption[] public digitalOption;

    // Events allow light clients to react on
    // changes efficiently.
    event Sent(address from, address to, uint amount);

    // This is the constructor whose code is
    // run only when the contract is created.
    constructor() public {
        issuer = msg.sender;
        isIssued = false;
    }

// ----------------------------------------------------------------------------------
    // Issuer functions

    // This is the new issuance part 1 - add bond
    function newIssue1AddBond(
                bytes32 bondName,
                uint bondIssueDate,
                uint bondMaturity,
                uint bondYld,
                uint bondPrice,
                uint bondPrincipal,
                bool bondLong
                ) public returns(bool success){

        // make sure the issuer is the one performing issuance
        require(msg.sender == issuer,
                "Only the issuer can call new issue function."
        );

        // make sure the note has not been issued before
        require(isIssued == false,
                "Note has been issued already, check issued note."
        );

        // Bond
        bond=ZeroCouponBond({
                name:           bondName,
                issueDate:      bondIssueDate,
                maturity:       bondMaturity,
                yld:            bondYld,
                price:          bondPrice,
                contractSize:   bondPrincipal,
                isLong:         bondLong
        });

        return true;
    }

    // This is the new issuance part 2 - add EuropeanOptions
    function newIssue2AddEuropeanOptions(
                bytes32[] eoName,
                bool[] eoIsCall,
                bytes32[] eoUnderlying,
                uint[] eoStrike,
                uint[] eoExpiration,
                uint[] eoPrice,
                uint[] eoContractSize,
                bool[] eoLong
                ) public returns(bool success) {

        // make sure the issuer is the one performing issuance
        require(msg.sender == issuer,
                "Only the issuer can call new issue function."
        );

        // make sure the note has not been issued before
        require(isIssued == false,
                "Note has been issued already, check issued note."
        );

        // Need eo arrays to to have the same length
        require(
            eoName.length == eoIsCall.length
            && eoName.length == eoUnderlying.length
            && eoName.length == eoStrike.length
            && eoName.length == eoExpiration.length
            && eoName.length == eoPrice.length
            && eoName.length == eoContractSize.length
            && eoName.length == eoLong.length,
            "Array length need to match."
        );
        // EuropeanOption
        // create a new EuropeanOption object and add it
        // to the end of the array.
        for (uint n = 0; n < eoName.length; n++) {
            europeanOptions.push(EuropeanOption({
                name:           eoName[n],
                isCall:         eoIsCall[n],
                underlying:     eoUnderlying[n],
                strike:         eoStrike[n],
                expiration:     eoExpiration[n],
                price:          eoPrice[n],
                contractSize:   eoContractSize[n],
                isLong:         eoLong[n]
            }));
        }

        return true;
    }

    // This is the new issuance part 3 - issue notes
    function newIssue3(bytes32 notename,
                uint noteIssueDate,
                uint noteMaturity,
                uint commissionFee,
                uint amount) public returns(bool success) {

        // make sure the issuer is the one performing issuance
        require(msg.sender == issuer,
                "Only the issuer can call new issue function."
        );

        // make sure the note has not been issued before
        require(isIssued == false,
                "Note has been issued already, check issued note."
        );

        // make sure bond is not empty
        if (bond.name == 0) return;

        isIssued = true;
        //issuer = msg.sender;
        outstandingBalance = 0;
        name = notename;
        issueDate = noteIssueDate;
        maturity = noteMaturity;
        commission = commissionFee;

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

    function updatePrice(uint newBondPrice, bytes32[] newEOName, uint[] newEOPrice) public returns(bool success){
        // make sure the issuer is the one performing issuance
        require(msg.sender == issuer,
                "Only the issuer can call new issue function."
        );

        // update bond price
        bond.price=newBondPrice;

        // update EO price
        for (uint n = 0; n < newEOName.length; n++) {
            for (uint i = 0; i < europeanOptions.length; i++) {
                if (newEOName[n] == europeanOptions[i].name) {
                    europeanOptions[i].price = newEOPrice[n];
                }
            }
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
        require(closeDate >= maturity,
            "Maturity not reached yet."
        );

        // Check all units as been redeemed/send back to issuer
        require(balances[issuer] == outstandingBalance,
            "Part of fund is not redeemed."
        );

        // Send remaining balance(if any) to the Issuer
        uint remainingBal = address(this).balance;
        issuer.transfer(remainingBal); // exclude gas?

        // Set issued to false and delete all the structs
        // ...

        return true;
    }

// ----------------------------------------------------------------------------------
    // user function
    function sendNote(address receiver, uint amount) public returns(bool sufficient) {
        // Don't allow issuer to send
        // since issue's notes are not sold
        // no ether to back up
        // make sure the issuer is the one performing issuance
        require(msg.sender != issuer,
                "Issuer cannot send GSP notes."
        );
        if (balances[msg.sender] < amount) return;
        balances[msg.sender] -= amount;
        balances[receiver] += amount;
        emit Sent(msg.sender, receiver, amount);
        return true;
    }

    function userGetSubscribePayable(uint amount) public view returns (uint) {
        // Check note value to subscribe

        // from getNav
        uint nav = 0;
        // Adding Bond price
        if (bond.isLong) {
            nav  = nav + bond.price * bond.contractSize;
        }
        else {
            nav  = nav - bond.price * bond.contractSize;
        }
        //Adding EO price
        for (uint i = 0; i < europeanOptions.length; i++) {
            if (europeanOptions[i].isLong) {
                nav  = nav + europeanOptions[i].price * europeanOptions[i].contractSize;
            }
            else {
                nav  = nav - europeanOptions[i].price * europeanOptions[i].contractSize;
            }
        }

        // Converstion between ETH and NAV
        uint ETHpayable = (nav+commission)/100*amount;

        // Check ETH balance from user
        uint ETHbalance;
        ETHbalance = (msg.sender).balance;
        // User has to have enough ETH for subscription
        require(ETHbalance >= ETHpayable,
                 "You don't have enough ETH balance"
        );

        // Check GSP balance from issuer
        uint GSPbalance;
        GSPbalance = balances[issuer];
        // Issuer has to have enough GSP note for subscription
        require(GSPbalance >= amount,
                "Issuer doesn't have enough GSP notes outstanding"
        );

        return (ETHpayable);
    }

    function userSubscribe(uint amount) public payable returns (bool) {
        // Check note value to subscribe
        //uint ETHpayable = userGetSubscribePayable(amount);
        // require(msg.value == ETHpayable,
        //         "Send eth is not equal to payable"
        // );

        // // Check ETH balance from user
        // uint ETHbalance;
        // ETHbalance = (msg.sender).balance;

        // // User has to have enough ETH for subscription
        // require(ETHbalance >= msg.value,
        //          "You don't have enough ETH balance"
        // );

        // // Check GSP balance from issuer
        // uint GSPbalance;
        // GSPbalance = balances[issuer];

        // // Issuer has to have enough GSP note for subscription
        // require(GSPbalance >= amount,
        //         "Issuer doesn't have enough GSP notes outstanding"
        // );

        // Method 1: issuer address hold ether -> not good
        // Send equalvilent ether to the issue
        //issuer.transfer(msg.value);

        // Method 2: contract address hold ether
        // Send equalvilent ether to the contract
        // Send equalvilent commision to the issuer
        uint commisionPayable = (commission)/100*amount;
        issuer.transfer(commisionPayable);

        // Add note units to user
        balances[msg.sender] += amount;
        balances[issuer] -= amount;

        return true;
    }

    function userGetRedeemReceivable(uint amount) public view returns(uint) {
        // from getNav
        uint nav = 0;
        // Adding Bond price
        if (bond.isLong) {
            nav = nav + bond.price * bond.contractSize;
        }
        else {
            nav = nav - bond.price * bond.contractSize;
        }
        //Adding EO price
        for (uint i = 0; i < europeanOptions.length; i++) {
            if (europeanOptions[i].isLong) {
                nav  = nav + europeanOptions[i].price * europeanOptions[i].contractSize;
            }
            else {
                nav  = nav - europeanOptions[i].price * europeanOptions[i].contractSize;
            }
        }

        // Converstion between ETH and NAV
        uint ETHreceivable = nav*amount/100;

        // Check GSP balance from user
        uint GSPbalance;
        GSPbalance = balances[msg.sender];
        // Issuer has to have enough GSP note for subscription
        require(GSPbalance >= amount,
                "You don't have enough GSP notes to redeem"
        );

        // view redeemed value
        return(ETHreceivable);
    }

     function userRedeem(uint amount) public returns(bool) {
     // Only allow user to redeem at maturity
     // Add code here ....
     // Maybe allow early redemption for a penalty
     // Add code here ...

     // from getNav
        uint nav = 0;
        // Adding Bond price
        if (bond.isLong) {
            nav = nav + bond.price * bond.contractSize;
        }
        else {
            nav = nav - bond.price * bond.contractSize;
        }
        //Adding EO price
        for (uint i = 0; i < europeanOptions.length; i++) {
            if (europeanOptions[i].isLong) {
                nav  = nav + europeanOptions[i].price * europeanOptions[i].contractSize;
            }
            else {
                nav  = nav - europeanOptions[i].price * europeanOptions[i].contractSize;
            }
        }

        // Converstion between ETH and NAV
        uint ETHreceivable = nav*amount/100;

        // Check GSP balance from user
        uint GSPbalance;
        GSPbalance = balances[msg.sender];
        // Issuer has to have enough GSP note for subscription
        require(GSPbalance >= amount,
                "You don't have enough GSP notes to redeem"
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

    function getNoteName() public view returns (bytes32) {
        return name;
    }

    function getIssueDate() public view returns (uint) {
        return issueDate;
    }

    function getMaturity() public view returns (uint) {
        return maturity;
    }

    function getNoteBalance() public view returns (uint) {
        return balances[msg.sender];
    }

    function getBond() public view returns (bytes32 bondName,uint bondContractSize,bool bondIsLong,uint bondPrice) {
        return (bond.name,bond.contractSize,bond.isLong,bond.price);
    }

    function getEuropeanOption() public view
    returns (bytes32[] memory _eoName,uint[] _eoContractSize,bool[] _eoIsLong,uint[] _eoPrice) {
        uint length = europeanOptions.length;
        bytes32[] memory eoName = new bytes32[](length);
        uint[] memory eoContractSize = new uint[](length);
        bool[] memory eoIsLong = new bool[](length);
        uint[] memory eoPrice = new uint[](length);
        for (uint i = 0; i < europeanOptions.length; i++) {
            eoName[i]=europeanOptions[i].name;
            eoContractSize[i]=europeanOptions[i].contractSize;
            eoIsLong[i]=europeanOptions[i].isLong;
            eoPrice[i]==europeanOptions[i].price;
        }
        return (eoName,eoContractSize,eoIsLong,eoPrice);
    }

    function getNAV() public view returns (uint) {
        uint nav = 0;
        // Adding Bond price
        if (bond.isLong) {
            nav  = nav + bond.price * bond.contractSize;
        }
        else {
            nav  = nav - bond.price * bond.contractSize;
        }

        //Adding EO price
        for (uint i = 0; i < europeanOptions.length; i++) {
            if (europeanOptions[i].isLong) {
                nav  = nav + europeanOptions[i].price * europeanOptions[i].contractSize;
            }
            else {
                nav  = nav - europeanOptions[i].price * europeanOptions[i].contractSize;
            }
        }
        return nav;
    }

}
