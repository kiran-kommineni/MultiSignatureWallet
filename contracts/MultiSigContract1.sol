pragma solidity ^0.4.20;

contract MultiSigContract1 {

    address _owner = msg.sender;
    bool private contributionsOpen = true;
    uint totalContribution = 0;
    address[] contributorList;
    mapping( address => uint) contributions;
    mapping(address => uint8) voterList;
    address[] voters = [ 0xfA3C6a1d480A14c546F12cdBB6d1BaCBf02A1610, 0x2f47343208d8Db38A64f49d7384Ce70367FC98c0, 0x7c0e7b2418141F492653C6bF9ceD144c338Ba740 ];
    //address[] voters = [ 0x9f3767f1d2a439a504479d9275aae1dfbe207818, 0x87c402146e30819d55d7126cff41012b788701d6, 0x44a0f513fb22016eee2de6ead8a852587e741340 ];

    struct Proposal{
        address beneficiary;
        uint amount;
        uint8 voteCount;
        uint8 approveCount;
        uint8 rejectCount;
        address[] approvedVoters;
        address[] rejectedVoters;
        string status;
    }

    mapping( address => Proposal ) beneficiaryProposal;
    address[] openProposalList;

    modifier isOwner {
        require(msg.sender == _owner);
        _;
    }

    modifier isValidVoter {
        require(voterList[msg.sender] != 0);
        _;
    }

  /*
   * This event should be dispatched whenever the contract receives
   * any contribution (Ethers).
   */
    event ReceivedContribution(address indexed _contributor, uint value);
    event ProposalSubmitted(address indexed _beneficiary, uint _value);
    event ProposalApproved(address indexed _approver, address indexed _beneficiary, uint _value);
    event ProposalRejected(address indexed _approver, address indexed _beneficiary, uint _value);
    event WithdrawPerformed(address indexed beneficiary, uint _value);


    /*
   * A fallback function to receive contributions
   */
    function () public payable {
        // Check if the contribution is open
        require(contributionsOpen == true);
        contributions[msg.sender] += msg.value;
        totalContribution += msg.value;
        contributorList.push(msg.sender);
        emit ReceivedContribution(msg.sender, msg.value);
    }

    constructor () public {
        for (uint i = 0; i < voters.length; i++){
            voterList[voters[i]] = 1;
        }
    }

  /*
   * List the addresses of the contributors, which are people that sent
   * Ether to this contract.
   */
    function listContributors() external view returns (address[]){
        return contributorList;
    }

  /*
   * Returns the amount sent by the given contributor.
   */
    function getContributorAmount(address _contributor) external view returns (uint){
        return contributions[_contributor];
    }


  /*
   * When this contract is initially created, it's in the state 
   * "Accepting contributions". No proposals can be sent, no withdraw
   * and no vote can be made while in this state. After this function
   * is called, the contract state changes to "Active" in which it will
   * not accept contributions anymore and will accept all other functions
   * (submit proposal, vote, withdraw)
   */
    function endContributionPeriod() external  isOwner returns(bool){
        contributionsOpen = false;
        return contributionsOpen;
    }

  /*
   * Sends a withdraw proposal to the contract. The beneficiary would
   * be "_beneficiary" and if approved, this address will be able to
   * withdraw "value" Ethers.
   *
   * This contract should be able to handle many proposals at once.
   */
    function submitProposal(uint _value) external{
        //Make sure the contribution flag is open
        require(contributionsOpen == false, "Contribution period closed");
        //Value cannot be greater than 10%
        require(_value <= address(this).balance/10, "Proposal cannot exceed 10% of contract value");
        //Signer cannot submit a proposal
        require(voterList[msg.sender] == 0, "Proposer is a Voter");

        Proposal memory proposal;
        proposal.beneficiary = msg.sender;
        proposal.amount = _value; 
        proposal.status = "QUEUED";      
        beneficiaryProposal[msg.sender] = proposal;

        openProposalList.push(msg.sender);

        emit ProposalSubmitted(msg.sender, _value);
    }

  /*
   * Returns a list of beneficiaries for the open proposals. Open
   * proposal is the one in which the majority of voters have not
   * voted yet.
   */
    function listOpenBeneficiariesProposals() external view returns (address[]){
        return openProposalList;
    }

  /*
   * Returns the value requested by the given beneficiary in his proposal.
   */
    function getBeneficiaryProposal(address _beneficiary) external view returns (uint){
        return beneficiaryProposal[_beneficiary].amount;
    }

  /*
   * Approve the proposal for the given beneficiary
   */
    function approve(address _beneficiary) external isValidVoter{
        //require(_beneficiary != address(0x0),"Beneficiary should be a valid address");
        beneficiaryProposal[_beneficiary].approvedVoters.push(msg.sender);
        beneficiaryProposal[_beneficiary].approveCount++;

        if(beneficiaryProposal[_beneficiary].approveCount >= 2){
            beneficiaryProposal[_beneficiary].status = "APPROVED";
            totalContribution = totalContribution - beneficiaryProposal[_beneficiary].amount; 
            emit ProposalApproved(msg.sender, _beneficiary, beneficiaryProposal[_beneficiary].amount);
        }    
    }

  /*
   * Reject the proposal of the given beneficiary
   */
    function reject(address _beneficiary) external isValidVoter{
        //require(_beneficiary != address(0x0),"Beneficiary should be a valid address");
        beneficiaryProposal[_beneficiary].rejectedVoters.push(msg.sender);
        beneficiaryProposal[_beneficiary].rejectCount++;
        if(beneficiaryProposal[_beneficiary].rejectCount >= 2){
            beneficiaryProposal[_beneficiary].status = "REJECTED";
            emit ProposalRejected(msg.sender, _beneficiary, beneficiaryProposal[_beneficiary].amount);        
        }    
    }
    

  /*
   * Withdraw the specified value from the wallet.
   * The beneficiary can withdraw any value less than or equal the value
   * he/she proposed. If he/she wants to withdraw more, a new proposal
   * should be sent.
   *
   */
    function withdraw(uint _value) external{

        //check if he is a real beneficiary
        require(beneficiaryProposal[msg.sender].beneficiary != msg.sender, "You are not a beneficiary to withdraw ether");
  
        //Check the amount which should not exceed sanctioned amount
        require(beneficiaryProposal[msg.sender].amount >= _value, "You cannot withdraw more than 10% of contract value");

        msg.sender.transfer(_value);
        beneficiaryProposal[msg.sender].amount -= _value;
        emit WithdrawPerformed(msg.sender, _value);
    }

    function getTotalContribution() public view returns(uint){
        return totalContribution;
    }

    function owner() public view returns(address) {
        return _owner;
    }

}

// signer cannot submit a proposal
// beneficiary partial amount
// majority approve the proposal