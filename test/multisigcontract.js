var MultiSigContract = artifacts.require("./MultiSigContract.sol");
var Web3 = require("web3");
var web3 = new Web3();

contract('MultiSigWallet', function(accounts) {

  //Contributor should be listed properly
  it("... Contributer should be listed properly.", function() {
    return MultiSigContract.deployed().then(function(instance) {
      multiSigContractInstance = instance;

      return multiSigContractInstance.sendTransaction({
        from: accounts[0],
        value: web3.toWei(10, "ether")});
    }).then(function() {
      return multiSigContractInstance.listContributors.call();
    }).then(function(contributors) {
      assert.equal(contributors[0], accounts[0], "Contributor not listed properly");
    });
  });

  //Its amounts in wei to ether or vice versa should be done properly
  it("... Contributer Amount should be listed properly.", function() {
    return MultiSigContract.deployed().then(function(instance) {
      multiSigContractInstance = instance;

      return multiSigContractInstance.sendTransaction({
        from: accounts[0],
        value: web3.toWei(10, "ether")});
    }).then(function() {
      return multiSigContractInstance.listContributors.call();
    }).then(function(contributors) {
      return multiSigContractInstance.getContributorAmount(contributors[0]);
    }).then(function(result){
      assert.equal(20, web3.fromWei(result[1].toNumber(), "ether"), "Contributor amount not listed properly");
    });
  });

  //Contract status should be ended properly so that proposer can 
  //propose the details
  it("... Contract status should be true on calling endContribution", function() {
    return MultiSigContract.deployed().then(function(instance) {
      multiSigContractInstance = instance;
        return multiSigContractInstance.endContributionPeriod();
    }).then(function(){
      return multiSigContractInstance.getContractStatus.call();
    }).then(function(status){
      assert.equal(true, status, "Contract status is not set to true");
    });
  });

  //Proposer should be able to propose properly
  it("... Proposer should be able to propose his funding amount", function() {
    return MultiSigContract.deployed().then(function(instance) {
      multiSigContractInstance = instance;
        return multiSigContractInstance.submitProposal(web3.toWei(2, 'ether'),{from: accounts[0]});
    }).then(function(){
      return multiSigContractInstance.getProposalAddressList.call();
    }).then(function(openProposals, closedProposals){
      //console.log("open", openProposals[0][0]);
      assert.equal(openProposals[0][0], accounts[0], "Proposer address is same");
      return multiSigContractInstance.getProposalDetails.call(openProposals[0][0]);
    }).then(function(result){
      proposalAddress = result[0];
      assert.equal(2, web3.fromWei(result[1].toNumber(), "ether"), "Proposed ether should be same");
      assert.equal(0, result[2].toNumber(), "Approval count should be zero");
      assert.equal(0, result[3].toNumber(), "Rejected count should be zero");
    })
  });

  //Authorised person should be able approve the proposal
  it("... For a proposal approval count should be increased", function() {
    return MultiSigContract.deployed().then(function(instance) {
      multiSigContractInstance = instance;
        return multiSigContractInstance.approve(proposalAddress,{from: accounts[0]});
    }).then(function(){
        return multiSigContractInstance.getProposalDetails.call(proposalAddress);
    }).then(function(result){
      assert.equal(1, result[2].toNumber(), "Approval count not increased to one");
    })
  });
  
  //Authorised person be able to reject a proposal
  it("... For a proposal Rejected count should be increased", function() {
    return MultiSigContract.deployed().then(function(instance) {
      multiSigContractInstance = instance;
        return multiSigContractInstance.reject(proposalAddress,{from: accounts[0]});
    }).then(function(){
        return multiSigContractInstance.getProposalDetails.call(proposalAddress);
    }).then(function(result){
      assert.equal(1, result[3].toNumber(), "Rejected count not increased to one");
    })
  });

});
