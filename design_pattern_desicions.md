
1) Used open source frameworks & libraries
   openzepplin frameworks are used to reduce boiler plate code. This way the logic is encapsulated. At the same time I have used libraries for intercontract communication.

2) Used selfDestruct() so that we can generate -ve gas when ever we want to decommision the smart contract.

3) Implemented 'events' wherever necessary so the transactions can be audited at state changes of the smart contract.

4) Implemented fall back function with payable key word so that if any ether is sent its captured by the smart contract instead of sending it back to the user.

5) Used require(condition) where ever input validation needs to be performed.

6) Made sure that the visibility of the functions and state variables are explicitly specified.
