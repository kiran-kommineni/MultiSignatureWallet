var MultiSigContract = artifacts.require("./MultiSigContract.sol");

module.exports = function(deployer) {
  deployer.deploy(MultiSigContract);
};
