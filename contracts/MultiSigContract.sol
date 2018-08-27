pragma solidity ^0.4.20;

import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

/** @title MultiSignatureWallet */
/**
 *     A MultiSignaturewallet responsbile for holding ether funded
 *     by the contributors and dispurse ether for proposers
 *     based on enough approval count
 */
contract MultiSigContract is Pausable {
    using SafeMath for uint256;

    // Variables
    address private contractOwner = msg.sender;
    bool private isContractActive = false;
    uint private signerCount;
    uint private contributorCount;
    uint private totalContributions;
    uint public availableContributions;

    mapping (address => uint) public contributionsMap;
    mapping (address => bool) public signerList;
    mapping(address => uint) _beneficiaryProposalIndex;  
    mapping (address => uint) amountToWithdraw;
    address[] contributorsList;
    
    Proposal[] proposals;

    struct Proposal {
        uint _valueInWei;
        address _beneficiary;
        uint approvalCount;
        uint rejectedCount;
        mapping (address => uint) sigatures;
    }

    // Constructor
    constructor()  public { 
        /*       
        _beneficiaryProposalIndex[0x4a321b274338988d8ae5ea794ac1d5999f042002] = 0;
        _beneficiaryProposalIndex[0x57913bb2e7d6feaf3aae607875d44a0d744fa8b9] = 1;
        _beneficiaryProposalIndex[0xa04dad4445126b79aaaae2f4d0201749945ff3e2] = 2;
        signerCount = signerCount.add(3);
        */  
    }

    // Events to trigger where ever state changes happen
    event ReceivedContribution(address indexed _contributor, uint _valueInWei);
    event ProposalSubmitted(address indexed _beneficiary, uint _valueInWei);
    event ProposalApproved(address indexed _approver, address indexed _beneficiary, uint _valueInWei);
    event ProposalRejected(address indexed _rejecter, address indexed _beneficiary, uint _valueInWei);
    event WithdrawPerformed(address indexed _beneficiary, uint _valueInWei);

    // Modifiers 
    modifier onlyifContractStatusActive() {
        require(isContractActive == true);
        _;
    }
    modifier acceptContributions() {
        require(isContractActive == false);
        _;
    }
    modifier onlySigner() {
        //require(signerList[msg.sender], "You are not a signer!!");
        require(1 == 1, "You are not a signer!!");
        _;
    }
    
    modifier onlyIfValueAllowed(uint _amount) {
        require(_amount.mul(10) <= totalContributions);
        require(_amount <= availableContributions);
        _;   
    }
        
    modifier onlyIfNoOpenProposal() {
        require(_beneficiaryProposalIndex[msg.sender] == 0 || isProposalClosed(msg.sender));
        _;
    }
        
    modifier onlyIfNotVoted(address _beneficiary) {
        require(_beneficiaryProposalIndex[_beneficiary] > 0);
        require(proposals[_beneficiaryProposalIndex[_beneficiary]].sigatures[msg.sender] == 0);
        _;
    }
        
    modifier onlyIfWithdrawable(uint _amountToWithdraw) {        
        require(amountToWithdraw[msg.sender] >= _amountToWithdraw);
        _;
    }

    /**
    * @dev A function to check if the proposal is closed
    * @param _beneficiary The address of the proposer
    * @return boolean Returns true if proposal closed or false if proposal is opened
    */
    function isProposalClosed(address _beneficiary) public view returns (bool) {
        if(proposals[_beneficiaryProposalIndex[_beneficiary]].rejectedCount > signerCount.div(2)) {
            return true;
        }
        if(proposals[_beneficiaryProposalIndex[_beneficiary]].approvalCount > signerCount.div(2)) {
            return true;
        }   
        return false;     
    }
        
    /**
    * @dev Fallback function which gets executed when the called function
    *      doesnot exist and emits an event
    */
    function () payable public whenNotPaused acceptContributions {
        require(msg.value > 0);
        contributionsMap[msg.sender] = contributionsMap[msg.sender].add(msg.value);
        totalContributions = totalContributions.add(msg.value);
        bool alreadyExists = false;
        for(uint i = 0; i< contributorsList.length; i++){
            if(contributorsList[i] == msg.sender){
                alreadyExists = true;
            }
        }
        if(!alreadyExists){
            contributorsList.push(msg.sender);
        }
        emit ReceivedContribution(msg.sender, msg.value);
    }

    /**
    * @dev This function is called to set the contract status to active so that 
    *      the proposals are made to the contributed amount
    */
    //function endContributionPeriod() acceptContributions onlySigner external {
    function endContributionPeriod() acceptContributions external {

        require(totalContributions > 0);
        availableContributions = totalContributions;
        isContractActive = true;
    }

    /**
    * @dev This function will give us the list of users that contributed
    *      to the smart contract
    * @return address[] Returns array of addresses
    */
    function listContributors() external view returns (address[]) {
        return contributorsList;
    }

    /**
    * @dev This function will return contributed amount in wei by each user
    * @param _contributor Address of the contributor
    * @return address Address of the contributor
    * @return Amount contributed in wei
    */
    function getContributorAmount(address _contributor) external view returns (address, uint) {
        return (_contributor, contributionsMap[_contributor]);
    }

    /**
    * @dev Will return the status of the contract
    * @return boolean Will return true or false based on the contract
    */
    function getContractStatus() external view returns (bool) {
        return isContractActive;
    }

    /**
    * @dev Will return the contributions in total
    * @return int Returns the total contributions in wei
    */
    function getTotalContributions() external view returns (uint) {
        return totalContributions;
    }

    /**
    * @dev This function accepts a proposal based on the modifier conditions met
    * @param _valueInWei is the value proposed by the proposer
     */
    function submitProposal(uint _valueInWei) external payable whenNotPaused onlyifContractStatusActive onlyIfNoOpenProposal onlyIfValueAllowed(_valueInWei) {
        proposals.push(Proposal(_valueInWei, msg.sender, 0, 0));
        _beneficiaryProposalIndex[msg.sender] = proposals.length - 1;
        availableContributions = availableContributions.sub(_valueInWei);
        emit ProposalSubmitted(msg.sender, _valueInWei);
    }
    
    /**
    * @dev This function is responsible to approve a proposal
    * @param _beneficiary The address of the proposal whose approval count increased by 1
     */
    //function approve(address _beneficiary) external onlyifContractStatusActive onlySigner onlyIfNotVoted(_beneficiary) {
    function approve(address _beneficiary) external{
        Proposal storage p = proposals[_beneficiaryProposalIndex[_beneficiary]];
        p.sigatures[msg.sender] = 1;  
        p.approvalCount = p.approvalCount.add(1);

        if(p.approvalCount > signerCount.div(2)) {
            amountToWithdraw[_beneficiary] = amountToWithdraw[_beneficiary].add(p._valueInWei);
        }
        emit ProposalApproved(msg.sender, _beneficiary, p._valueInWei);
    } 

     /**
    * @dev This function is responsible to reject a proposal
    * @param _beneficiary The address of the proposal whose reject count increased by 1
     */       
    //function reject(address _beneficiary) external onlyifContractStatusActive onlySigner onlyIfNotVoted(_beneficiary) {
    function reject(address _beneficiary) external {  
        Proposal storage p = proposals[_beneficiaryProposalIndex[_beneficiary]];
        p.sigatures[msg.sender] = 2;
        p.rejectedCount++;
            
        if(p.rejectedCount > signerCount.div(2)) {
            availableContributions = availableContributions.add(p._valueInWei);
        }
        emit ProposalRejected(msg.sender, _beneficiary, p._valueInWei);
    }
    
    /**
    * @dev This function will withdraw ether from contact and transfer it to proposer
    * @param beneficiary The address to which ether needs to be transferred
    * @param _valueInWei The amount that needs to be transferred to intended account
     */
    function withdraw(address beneficiary, uint _valueInWei) external whenNotPaused onlyifContractStatusActive onlyIfWithdrawable(_valueInWei) {
        amountToWithdraw[msg.sender] = amountToWithdraw[msg.sender].sub(_valueInWei);        
        beneficiary.transfer(_valueInWei);
        emit WithdrawPerformed(beneficiary, _valueInWei);
    }

    /**
    * @dev This function will return no of votes signed against the beneficiary
    * @param _signer "The address of the signer who approved the contract"
    * @param _beneficiary "The address of the proposer whose proposal is signed"
    * @return _int   "The no of votes signed"
     */

    function getSignerVote(address _signer, address _beneficiary) view external returns(uint) {
        return proposals[_beneficiaryProposalIndex[_beneficiary]].sigatures[_signer];
    }

    /**
    * @dev The function will list the beneficiary proposals made till date
    * @return Will return the array of addresses
     */
    function listOpenBeneficiariesProposals() external view returns (address[]) {
        address[] memory openBeneficiaries = new address[](proposals.length);
        uint j = 0;

        if(p.rejectedCount <= signerCount.div(2) && p.approvalCount <= signerCount.div(2)) {
            openBeneficiaries[j] = p._beneficiary;
            j++;
        }
        
        for(uint i = 0; i < proposals.length; i++) {
            Proposal storage p = proposals[i];
            address[] memory openBeneficiariesActual = new address[](j);
            for(i = 0;i<j;i++){
                openBeneficiariesActual[i] = openBeneficiaries[i];
            }
        }
        return openBeneficiariesActual;
    }

    /**
    * @dev This function will return the value of the proposal made
    * @param address "will take address as the parameter" 
    * @return uint "will return the value in wei"
     */
    function getBeneficiaryProposal(address _beneficiary) external view returns (uint) {
        return proposals[_beneficiaryProposalIndex[_beneficiary]]._valueInWei;
    }

    /**
    * @dev This function will return the proposal details 
    * @param proposerAddress Address of the details needed
    * @return address "Address of the proposer"
    * @return _valueInWei "The value in wei that is proposed"
    * @return approvalCount "The no of approvals received till date"
    * @return rejectedCount "The no of rejections received till date"
    * @return withdrawnAmount "The amount that is withdrawn till date by the proposer"
     */
    function getProposalDetails(address proposerAddress) external view 
        returns(address, uint,uint,uint,uint){

        Proposal storage p = proposals[_beneficiaryProposalIndex[proposerAddress]];
        
        return (proposerAddress, p._valueInWei, p.approvalCount, p.rejectedCount, amountToWithdraw[msg.sender]);
    }

    /**
    * @dev Returns the list of proposals made till date
    * @return Open proposal addresses are returned
    * @return Closed proposal addresses are returned
     */
    function getProposalAddressList() external view returns(address[], address[]){
        address[] memory openBeneficiaries = new address[](proposals.length);
        address[] memory closedBeneficiaries = new address[](proposals.length);
        uint j = 0;
        uint k = 0;
        for(uint i = 0; i < proposals.length; i++) {
            Proposal memory p = proposals[i];
            if(p._beneficiary != address(0)){
                if(p.rejectedCount <= 2 && p.approvalCount <= 2) {
                    openBeneficiaries[j] = p._beneficiary;
                    j++;
                }
                
                if(p.rejectedCount >= 2 || p.approvalCount >= 2){
                    closedBeneficiaries[k] = p._beneficiary;
                    k++;
                }
            }
        }

        return (openBeneficiaries, closedBeneficiaries);
    }

    /**
    * @dev A function which can only be called by the owner and will release a negative gas
    *      when the contract have to be decomissioned.
    */
    function kill() public {
        if(msg.sender == owner){
            selfdestruct(owner);
        }
    }
}

    /**
    * @title SafeMath
    * @dev Math operations with safety checks that throw on error
    */
library SafeMath {

    /**
    * @dev Multiplies two numbers, throws on overflow.
    */
    function mul(uint256 a, uint256 b) internal pure returns (uint256 c) {
        // Gas optimization: this is cheaper than asserting 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        c = a * b;
        assert(c / a == b);
        return c;
    }

    /**
    * @dev Integer division of two numbers, truncating the quotient.
    */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        // uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        return a / b;
    }

    /**
    * @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
    */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    /**
    * @dev Adds two numbers, throws on overflow.
    */
    function add(uint256 a, uint256 b) internal pure returns (uint256 c) {
        c = a + b;
        assert(c >= a);
        return c;
    }
}