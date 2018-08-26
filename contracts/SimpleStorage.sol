pragma solidity ^0.4.0;

contract SimpleStorage {
    
    uint256 storedData;
    function set(uint256 data) public{
        storedData = data;    
    }

    function get() public constant returns (uint256) {
        return storedData;
    }

}