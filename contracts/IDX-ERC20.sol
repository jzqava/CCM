pragma solidity ^0.4.24;

//import "../node_modules/zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
//import '../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';
//import "../node_modules/zeppelin-solidity/contracts/introspection/SupportsInterfaceWithLookup.sol";
import './IDXBase.sol';

// ----------------------------------------------------------------------------
// Safe maths
// ----------------------------------------------------------------------------
library SafeMath {
    function add(uint a, uint b) internal pure returns (uint c) {
        c = a + b;
        require(c >= a);
    }
    function sub(uint a, uint b) internal pure returns (uint c) {
        require(b <= a);
        c = a - b;
    }
    function mul(uint a, uint b) internal pure returns (uint c) {
        c = a * b;
        require(a == 0 || c / a == b);
    }
    function div(uint a, uint b) internal pure returns (uint c) {
        require(b > 0);
        c = a / b;
    }
}


// ----------------------------------------------------------------------------
// ERC Token Standard #20 Interface
// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
// ----------------------------------------------------------------------------
contract ERC20Interface {
    function totalSupply() public constant returns (uint);
    function balanceOf(address tokenOwner) public constant returns (uint balance);
    function allowance(address tokenOwner, address spender) public constant returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}


// ----------------------------------------------------------------------------
// Contract function to receive approval and execute function in one call
//
// Borrowed from MiniMeToken
// ----------------------------------------------------------------------------
contract ApproveAndCallFallBack {
    function receiveApproval(address from, uint256 tokens, address token, bytes data) public;
}


// ----------------------------------------------------------------------------
// Owned contract
// ----------------------------------------------------------------------------
contract Owned {
    address public owner;
    address public newOwner;

    event OwnershipTransferred(address indexed _from, address indexed _to);

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }
    function acceptOwnership() public {
        require(msg.sender == newOwner);
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        newOwner = address(0);
    }
}

// Structured Leverage Fund
contract IDX is IDXBase, ERC20Interface, Owned {
    /*** Constants ***/
    // Configure these for your own deployment
    /// @notice Name and symbol of the non fungible token, as defined in ERC721.

    using SafeMath for uint;

    string public symbol_;
    string public name_;
    uint8 public decimals;
    //uint totalTokens_;

    //mapping(address => uint) balances;
    mapping(address => mapping(address => uint)) allowed;


    /*** Constructor function ***/
    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    constructor() public {
        issuer = msg.sender;
        isIssued = false;

        symbol_ = "IDXTest";
        name_ = "CCM IDX Token Test1";
        decimals = 18;
        //totalTokens_ = 1000000 * 10**uint(decimals);
        //balances[owner] = totalTokens_;
        //emit Transfer(address(0), owner, totalTokens_);
    }

    /**
     * get token's name
     */
    function name() external view returns (string) {
      return name_;
    }

    /**
     * get symbols's name
     */
    function symbol() external view returns (string) {
      return symbol_;
    }

    /**
    * @notice Gets the total amount of tokens stored by the contract
    * @return uint256 representing the total amount of tokens
    */
    /// @dev Required for ERC-20 compliance
    function totalSupply() public view returns (uint256) {
      //return totalTokens_;
      return outstandingBalance*10**uint(decimals);
    }

    /// @dev Required for ERC-20 compliance.
    function balanceOf(address _owner) public view returns (uint256 _balance){
      return balances[_owner];
    }

    /// @dev Required for ERC-20 compliance.
    function transfer(address to, uint tokens) public returns (bool success) {
        balances[msg.sender] = balances[msg.sender].sub(tokens);
        balances[to] = balances[to].add(tokens);
        emit Transfer(msg.sender, to, tokens);
        return true;
    }


    /// @dev Required for ERC-20 compliance.
    function approve(address spender, uint tokens) public returns (bool success) {
        allowed[msg.sender][spender] = tokens;
        emit Approval(msg.sender, spender, tokens);
        return true;
    }

    /// @dev Required for ERC-20 compliance.
    // ------------------------------------------------------------------------
    // Transfer `tokens` from the `from` account to the `to` account
    //
    // The calling account must already have sufficient tokens approve(...)-d
    // for spending from the `from` account and
    // - From account must have sufficient balance to transfer
    // - Spender must have sufficient allowance to transfer
    // - 0 value transfers are allowed
    // ------------------------------------------------------------------------
    function transferFrom(address from, address to, uint tokens) public returns (bool success) {
        balances[from] = balances[from].sub(tokens);
        allowed[from][msg.sender] = allowed[from][msg.sender].sub(tokens);
        balances[to] = balances[to].add(tokens);
        emit Transfer(from, to, tokens);
        return true;
    }

    /// @dev Required for ERC-20 compliance.
    // ------------------------------------------------------------------------
    // Returns the amount of tokens approved by the owner that can be
    // transferred to the spender's account
    // ------------------------------------------------------------------------
    function allowance(address tokenOwner, address spender) public view returns (uint remaining) {
        return allowed[tokenOwner][spender];
    }

    // ------------------------------------------------------------------------
    // Token owner can approve for `spender` to transferFrom(...) `tokens`
    // from the token owner's account. The `spender` contract function
    // `receiveApproval(...)` is then executed
    // ------------------------------------------------------------------------
    function approveAndCall(address spender, uint tokens, bytes data) public returns (bool success) {
        allowed[msg.sender][spender] = tokens;
        emit Approval(msg.sender, spender, tokens);
        ApproveAndCallFallBack(spender).receiveApproval(msg.sender, tokens, this, data);
        return true;
    }
}
