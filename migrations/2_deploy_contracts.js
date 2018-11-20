var GSP = artifacts.require("GSP");
var SLF = artifacts.require("SLF");
var IDX = artifacts.require("IDX");
module.exports = function(deployer,network,accounts) {
  deployer.deploy(GSP);
  deployer.deploy(SLF);
  //deployer.deploy(IDX,"CCMIDXTestToken", "IDXTest");
  deployer.deploy(IDX);
};

// module.exports = async function(deployer) {
//   await deployer.deploy(MyERC721, "MyERC721", "MyERC721")
//   const erc721 = await MyERC721.deployed()
// };
