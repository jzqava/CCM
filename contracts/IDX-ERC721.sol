pragma solidity ^0.4.24;

import "../node_modules/zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import '../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';
import "../node_modules/zeppelin-solidity/contracts/introspection/SupportsInterfaceWithLookup.sol";
import './IDXBase.sol';


// Structured Leverage Fund
contract IDXERC721 is IDXBase, ERC721Token {
    /*** Constants ***/
    // Configure these for your own deployment
    /// @notice Name and symbol of the non fungible token, as defined in ERC721.

    string public name_ = "CCMIDXTestToken";
    string public symbol_ = "IDXTest";

    // Total amount of tokens
    uint256 private totalTokens_;


    /*** Constructor function ***/
    constructor (string _name, string _symbol) public
        ERC721Token(_name, _symbol)
    {
      issuer = msg.sender;
      isIssued = false;

      name_ = _name;
      symbol_ = _symbol;
      totalTokens_ = 10000000000;

      // register the supported interfaces to conform to ERC721 via ERC165
      _registerInterface(InterfaceId_ERC721Enumerable);
      _registerInterface(InterfaceId_ERC721Metadata);
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
    /// @dev Required for ERC-721 compliance
    function totalSupply() public view returns (uint256) {
      return totalTokens_;
    }

    /// @dev Required for ERC-721 compliance.
    function balanceOf(address _owner) public view returns (uint256 _balance){
      return balances[_owner];
    }

    /// @dev Required for ERC-721 compliance.
    function ownerOf(uint256 _tokenId) public view returns (address _owner){
      return msg.sender;
    }

    /// @dev Required for ERC-721 compliance.
    function exists(uint256 _tokenId) public view returns (bool _exists){
      return true;
    }

    /// @dev Required for ERC-721 compliance.
    function approve(address _to, uint256 _tokenId) public{

    }

    /// @dev Required for ERC-721 compliance.
    function getApproved(uint256 _tokenId)
      public view returns (address _operator){
        return msg.sender;
    }

    /// @dev Required for ERC-721 compliance.
    function setApprovalForAll(address _operator, bool _approved) public{

    }

    /// @dev Required for ERC-721 compliance.
    function isApprovedForAll(address _owner, address _operator)
      public view returns (bool){
        return true;
    }

    /// @dev Required for ERC-721 compliance.
    function transferFrom(address _from, address _to, uint256 _tokenId) public {
    }

    /// @dev Required for ERC-721 compliance.
    function safeTransferFrom(address _from, address _to, uint256 _tokenId) public {
    }

    /// @dev Required for ERC-721 compliance.
    function safeTransferFrom(
      address _from,
      address _to,
      uint256 _tokenId,
      bytes _data
    ) public {
    }

}
