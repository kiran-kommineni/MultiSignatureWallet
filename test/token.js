var Token = artifacts.require("./Token.sol");

contract('Token', function(accounts) {

  it("...Should display basic contract details.", function() {
    return Token.deployed().then(function(instance) {
      tokenInstance = instance;
      var data = {};
      data['name'] = tokenInstance.getName.call();
      data['symbol'] = tokenInstance.getSynbol.call();
      data['supply'] = tokenInstance.getTotalSupply.call(); 
      return tokenInstance.getName.call();
    }).then(function(data) {
      assert.equal(data['name'], "Kiran - Telecom Roaming Token", "Not a right name created");
      assert.equal(data['symbol'], "TRT", "The symbol should be TRT");
    });
  });

});
