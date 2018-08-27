# MultiSignatureWallet
-- Requirements
  The multisignature wallet comprises of Contributors and Proposers. The contributors are responsible for funding ether to
  multisignature wallet and proposers can propose a value to get funds for their projects.
  The proposals can be made only when the contribution period has ended.
  Only 10% of the total amount can be proposed for a given project
  Atleast 2 approvals must be met to get the project funded
  If there are more than or equal to 2 rejections the overall proposal can be rejejected.
  The proposer can withdraw partial amounts till his withdrawl value is equal to proposed value

-- For Installation run the following steps
   1) ganache-cli
   2) npm install
   3) truffle compile
   4) truffle migrate --reset --network=development
   5) truffle test
   5) npm start
  
  
