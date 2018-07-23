import React, { Component } from 'react'
  import MultiSigContract from '../contracts/MultiSigContract.json'
//import getWeb3 from '../utils/getWeb3'
class MultiSigWallet extends Component{
    constructor(props) {
        super(props);
    
        this.state = {
          contributorsList:[],
          totalContribution: null,
          openProposalList: [],
          closedProposalList: [],
          web3: null,
          title:"testing"
        };

        this.addContributor = this.addContributor.bind(this);
        this.getContributorAmount = this.getContributorAmount.bind(this);
        this.refreshContributorValueDisplay = this.refreshContributorValueDisplay.bind(this);
        this.endContribution = this.endContribution.bind(this);
        this.displayContributors = this.displayContributors.bind(this);
        this.submitProposal = this.submitProposal.bind(this);
        this.displayProposals = this.displayProposals.bind(this);
        this.approveProposal = this.approveProposal.bind(this);
        this.rejectProposal = this.rejectProposal.bind(this);
      }

      componentWillMount() {
        this.setState({web3: window.web3})
      }

      componentDidMount(){
        this.displayDetails();
      }

      displayDetails() {
        this.displayContributors(this.displayProposals);
      }


      addContributor(){
        console.log("Inside Add contributor");
        const contract = require('truffle-contract')
        const signatureWallet = contract(MultiSigContract)
              signatureWallet.setProvider(this.state.web3.currentProvider)

        // Display Details
        this.state.web3.eth.getAccounts((error, accounts) => {
          signatureWallet.deployed().then( (instance) => {
             return instance.sendTransaction({
                from: accounts[0],
                value: this.state.web3.toWei(this.refs.etherValue.value, "ether")
                                            }).then((result) => {
                                                console.log("transResult", result);
                                            });
            }).then((result) => {
              console.log("result" + result);
              this.displayContributors();
            }).catch((error) => {
                console.log("error getting data" + error);
            });
        });
      }

      displayContributors(asyncAfterFunction) {

        console.log("Inside Display contributors");
        const contract = require('truffle-contract')
        const signatureWallet = contract(MultiSigContract)
              signatureWallet.setProvider(this.state.web3.currentProvider)
    
        // Display Details
        let signatureWalletInstance = null, contributorList = [], proposalList = [];
        let contributorDetails = [], proposerDetails = [];
        let web3Instance = this.state.web3;
        signatureWallet.deployed().then( (instance) => {
          signatureWalletInstance = instance;
          //get list of contributors
          return instance.listContributors.call()
        })
        .then((result) => {
          contributorList = result;
          
          let queue = Promise.resolve();
          contributorList.forEach((contributorAddr) => {
            queue = queue.then((result) => {
              console.log('result: ', result);
              if (result) {
                contributorDetails.push({address: result[0], amount: web3Instance.fromWei(result[1], 'ether').toString()});
              }
              return signatureWalletInstance.getContributorAmount.call(contributorAddr);
            });
          });

          queue.then((result) => {
            if (result) {
              contributorDetails.push({address: result[0], amount: web3Instance.fromWei(result[1], 'ether').toString()});
            }
            console.log('Contributor Queue end: ', contributorDetails);
            if (!asyncAfterFunction) {
              this.setState({contributorList: contributorDetails});
            }
            else {
              asyncAfterFunction({contributorsList: contributorDetails});
            }
            
          });
        })
        .catch((error) => {
          console.log("Could not get contributors and/or proposals::", error);
        });

      }

      displayProposals(otherState={}) {

        console.log("contributors:: ", otherState);
        console.log("Inside Display proposals");
        const contract = require('truffle-contract')
        const signatureWallet = contract(MultiSigContract)
              signatureWallet.setProvider(this.state.web3.currentProvider)
    
        // Display Details
        let signatureWalletInstance = null, openProposalList = [], closedProposalList = [];
        let openProposerDetails = [], closedProposerDetails = [];
        let web3Instance = this.state.web3;
        signatureWallet.deployed().then( (instance) => {
          signatureWalletInstance = instance;
          //get list of contributors
          return signatureWalletInstance.getProposalAddressList.call()        })
        .then((result) => {
          openProposalList = result[0];

          let queue = Promise.resolve();
          openProposalList.forEach((proposerAddr) => {
            queue = queue.then((result) => {
              console.log('result: ', result);
              if (result) {
                openProposerDetails.push({address: result[0], ether: web3Instance.fromWei(result[1].toNumber(), 'ether'), approveCount: result[2].toString(), rejectCount: result[3].toString()});
              }
              return signatureWalletInstance.getProposalDetails.call(proposerAddr);
            });
          });

          queue.then((result) => {
            if (result) {
              openProposerDetails.push({address: result[0], ether: web3Instance.fromWei(result[1].toNumber(), 'ether'), approveCount: result[2].toString(), rejectCount: result[3].toString()});
            }
          });

          closedProposalList = result[1];

          closedProposalList.forEach((proposerAddr) => {
            queue = queue.then((result) => {
              console.log('result: ', result);
              if (result) {
                closedProposerDetails.push({address: result[0], ether: web3Instance.fromWei(result[1].toString(), 'ether'), approveCount: result[2].toString(), rejectCount: result[3].toString()});
              }
              return signatureWalletInstance.getProposalDetails.call(proposerAddr);
            });
          });

          queue.then((result) => {
            if (result) {
              closedProposerDetails.push({address: result[0], ether: web3Instance.fromWei(result[1].toNumber(), 'ether'), approveCount: result[2].toString(), rejectCount: result[3].toString()});
            }

            this.setState({
              ...otherState,
              openProposalList: openProposerDetails,
              closedProposalList: closedProposerDetails
            });
          });
        })
        .catch((error) => {
          console.log("Could not get contributors and/or proposals::", error);
        });

      }
      

      async getContributorAmount(address){
        const refreshContributorValueDisplay = this.refreshContributorValueDisplay;
        console.log("inside get contributor");
        const contract = require('truffle-contract')
        const signatureWallet = contract(MultiSigContract)
              signatureWallet.setProvider(this.state.web3.currentProvider)
        
        var addrValue = {};
        const promises = address.map( (addr) => {
        // Display Details
        this.state.web3.eth.getAccounts((error, accounts) => {
          signatureWallet.deployed().then( (instance) => {             
            console.log(instance);
             return instance.getContributorAmount.call(addr);
            }).then((result) =>{
              addrValue[addr] = this.state.web3.fromWei(result, 'ether').toString();
              console.log("result-" + this.state.web3.fromWei(result, 'ether').toString());
        })
        .catch((error) => {
            console.log("error getting data" + error);
          })
        })        
      });
      
      await Promise.all(promises);
      console.log("addr Value:",addrValue, Object.keys(addrValue), Object.values(addrValue));
      this.setState({contributorsList: address.map((e) => {return {address: e, value: addrValue[e] }; } )});
    }
    

      refreshContributorValueDisplay(address, value) {
        const {contributorsList} = this.state;
        console.log(this.state.web3.fromWei(value, 'ether'));
        this.setState({contributorsList: contributorsList.map((e) => {
          return {address: e.address, value: (e.address === address ? this.state.web3.fromWei(value, 'ether').toString() : e.value)};
        })});
      }

      endContribution(){
        console.log("Inside End Contribution");
        const contract = require('truffle-contract')
        const signatureWallet = contract(MultiSigContract)
              signatureWallet.setProvider(this.state.web3.currentProvider)
    
        // Call End Contibution
        this.state.web3.eth.getAccounts((error, accounts) => {
          signatureWallet.defaults({
            from: accounts[0],
            gas: 4712388,
            gasPrice: 100000000000
          });
          signatureWallet.deployed().then( (instance) => {             
             return instance.endContributionPeriod({from: accounts[0]});
            }).then((result) =>{
             console.log("Called Successfully End Contribution", result); 
        })
        .catch((error) => {
            console.log("error setting End Contribution" + error);
          })
        })

      }

      submitProposal(value){
 
        console.log("Inside Submit Proposal", value);
        const contract = require('truffle-contract')
        const signatureWallet = contract(MultiSigContract)
              signatureWallet.setProvider(this.state.web3.currentProvider)

        // Call End Contibution
        this.state.web3.eth.getAccounts((error, accounts) => {
          //Increase the default gas
          signatureWallet.defaults({
            from: accounts[0],
            gas: 4712388,
            gasPrice: 100000000000
          });

          signatureWallet.deployed().then( (instance) => { 
            console.log("value in wei", value);    
             return instance.submitProposal(this.state.web3.toWei(value, 'ether'));
            }).then((result) =>{
             console.log("Called Submit proposal", result);
             this.displayProposals();
        })
        .catch((error) => {
            console.log("Error submitting proposal" + error);
          })
        })

      }


      async getProposalDetails(address){

        console.log("inside proposal details");
        const contract = require('truffle-contract')
        const signatureWallet = contract(MultiSigContract)
             signatureWallet.setProvider(this.state.web3.currentProvider)
        
        let contractInstance = null;
        signatureWallet.deployed().then( (instance) => { 
          contractInstance = instance;
        })
        .catch((error) => console.log('Error obtaining contract instance:: ', error));
        
        var addrValue = {};
        const promises = address.map( (addr) => {
        // Display Details
        this.state.web3.eth.getAccounts((error, accounts) => {
          signatureWallet.deployed().then( (instance) => {             
            console.log(instance);
             return instance.getProposalDetails.call(addr);
            }).then((result) =>{
              addrValue[addr] = result;
              //this.state.web3.fromWei(result, 'ether').toString();
              console.log("result-",result, addr);
        })
        .catch((error) => {
            console.log("error getting data" + error);
          })
        })        
      });
      
      await Promise.all(promises);
      console.log("addr Value:",addrValue, Object.keys(addrValue), Object.values(addrValue));
      this.setState({openProposalList: address.map((e) => {return {address: e, ether: addrValue[e][0], appCount:addrValue[e][1],rejCount:addrValue[e][2] }; } )});
    }

    approveProposal(proposalAddress){
      console.log("Inside Approve proposal");
      const contract = require('truffle-contract')
      const signatureWallet = contract(MultiSigContract)
            signatureWallet.setProvider(this.state.web3.currentProvider)
  
      // Call End Contibution
      this.state.web3.eth.getAccounts((error, accounts) => {
        signatureWallet.defaults({
          from: accounts[0],
          gas: 4712388,
          gasPrice: 100000000000
        });
        signatureWallet.deployed().then( (instance) => {             
           return instance.approve(proposalAddress, {from: accounts[0]});
          }).then((result) =>{
           console.log("Called Successfully Approve proposal", result); 
           this.displayProposals();
      })
      .catch((error) => {
          console.log("Error approving address" + error);
        })
      })

    }

    rejectProposal(proposalAddress){
      console.log("Inside Approve proposal");
      const contract = require('truffle-contract')
      const signatureWallet = contract(MultiSigContract)
            signatureWallet.setProvider(this.state.web3.currentProvider)
  
      // Call End Contibution
      this.state.web3.eth.getAccounts((error, accounts) => {
        signatureWallet.defaults({
          from: accounts[0],
          gas: 4712388,
          gasPrice: 100000000000
        });
        signatureWallet.deployed().then( (instance) => {             
           return instance.reject(proposalAddress, {from: accounts[0]});
          }).then((result) =>{
           console.log("Called Successfully Approve proposal", result); 
           this.displayProposals();
      })
      .catch((error) => {
          console.log("Error approving address" + error);
        })
      })

    }

    withdrawProposalValue(address, withdrawValue){
      console.log("Inside withdrawProposalValue");
      const contract = require('truffle-contract')
      const signatureWallet = contract(MultiSigContract)
            signatureWallet.setProvider(this.state.web3.currentProvider)
  
      // Call End Contibution
      this.state.web3.eth.getAccounts((error, accounts) => {
        signatureWallet.defaults({
          from: accounts[0],
          gas: 4712388,
          gasPrice: 100000000000
        });
        signatureWallet.deployed().then( (instance) => {             
           return instance.withdraw(this.state.web3.toWei(withdrawValue,"ether"), {from: accounts[0]});
          }).then((result) =>{
           console.log("Called Successfully withdraw proposal", result); 
           this.displayProposals();
      })
      .catch((error) => {
          console.log("Error withdraw proposal" + error);
        })
      })

    }

      render() {
        
        const {contributorsList, openProposalList, closedProposalList} = this.state;
        const contributorsHTML = contributorsList.map( contributor => {
          return <tr> <td>{contributor.address}</td> 
                <td><span>{contributor.amount}</span></td></tr> });

        const openProposalHTML = openProposalList.map( proposer => {
          return <tr> <td>{proposer.address}</td> 
                  <td><span>{proposer.ether}</span></td>
                  <td><span>{proposer.approveCount}</span></td>
                  <td><span>{proposer.rejectCount}</span></td>
                  <td><span><input type="button" value="Approve" onClick={ () => this.approveProposal(proposer.address) }/></span></td>
                  <td><span><input type="button" value="Reject" onClick={ () => this.rejectProposal(proposer.address) }/></span></td>                </tr>
        });
        
        const closedProposalHTML = closedProposalList.map( proposer => {
          return <tr> <td>{proposer.address}</td> 
                  <td><span>{proposer.ether}</span></td>
                  <td><span>{proposer.availableEther}</span></td>
                  <td><span>{proposer.approveCount}</span></td>
                  <td><span>{proposer.rejectCount}</span></td>
                  <td>
                    <span>
                      { proposer.approveCount >= 2 ? 
                          <div style={{display: 'inline-flex'}}>
                            <input type="number" ref="proposerAvblAmt" maxValue={ proposer.ether } onChange={(e) => { if(e.target.value > proposer.ether) {alert('Cannot withdraw more than ' + proposer.ether)} } } />
                            <input type="button" value="Withdraw" onClick={ () => this.withdrawProposalValue(proposer.address, 10) }/> 
                          </div>
                          : "Rejected"}
                    </span>
                  </td>
                </tr>
        });
        
        return (
          <div className="MultiSigWallet">
            Contribution Value(ether): <input type="text" ref="etherValue" /><nbsp /> <input type="button" value="submit" onClick={this.addContributor}/>
            <br /><table border="1">
                <tr>Contributor Details</tr >
                <tr> <td>addresses</td> <td> Value</td> </tr>
                {contributorsHTML}
                <tr><td> Total Contribution</td> <td>{ this.state.totalContribution}</td> </tr>
            </table> <br />
            <input type="button" value="End Contribution" onClick={this.endContribution} />
            <br />
            <h>Submit Proposals</h> <br />
            Proposer value: <input type="value" ref="proposalValue" />
            <input type="button" value = "Submit Proposal" onClick={ () => this.submitProposal(this.refs.proposalValue.value)} />
            <br />

            <table border ="1">
              <tr> Open Proposal Details </tr>
              <tr><td>Proposer Address</td> <td> Proposer Value</td> <td> Approved Count</td> <td>Rejected Count</td></tr>
              {openProposalHTML}
            </table>

            <table border ="1">
              <tr> Closed Proposal Details </tr>
              <tr><td>Proposer Address</td> <td> Actual Proposer Value</td> <td> Available Proposer Value</td> <td> Approved Count</td> <td>Rejected Count</td></tr>
              {closedProposalHTML}
            </table>
          </div>
        );
    }
}

export default MultiSigWallet; 