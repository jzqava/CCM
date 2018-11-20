SLFApp = {
  web3Provider: null,
  contracts: {},

  init: function() {
    // No need to load anything

    return SLFApp.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance
    if (typeof web3 !== 'undefined') {
      SLFApp.web3Provider = web3.currentProvider;
    } else {
    // If no injected web3 instance is detected, fall back to Ganache
      SLFApp.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(SLFApp.web3Provider);

    return SLFApp.initContract();
  },

  initContract: function() {
    $.getJSON('SLF.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var SLFArtifact = data;
      SLFApp.contracts.SLF = TruffleContract(SLFArtifact);

      // Set the provider for our contract
      SLFApp.contracts.SLF.setProvider(SLFApp.web3Provider);

      // Control views
      return SLFApp.viewControl();
    });

    return SLFApp.bindEvents();
  },

  bindEvents: function() {
    // handler for using selected bond and option to create contract
    $(document).on('click', '.btn-SLF-create', SLFApp.handleSLFCreation);
    $(document).on('click', '.btn-SLF-issue', SLFApp.handleSLFIssue);

    // handler for display to created contract
    $(document).on('click', '.btn-SLF-display', SLFApp.displaySLF);

    // handler for update price
    $(document).on('click', '.btn-update-price', SLFApp.handleUpdatePrice);

    // handler for pay contract
    $(document).on('click', '.btn-pay-contract', SLFApp.handlePayContract);

    // handler for display balance
    $(document).on('click', '.btn-SLF-balance', SLFApp.displayBalance);

    // handler for send note
    $(document).on('click', '.btn-SLF-send', SLFApp.handleSLFSend);

    // handler for user subscribe and redeem
    $(document).on('click', '.btn-view-subscribe', SLFApp.displaySLFSubscribe);
    $(document).on('click', '.btn-view-redeem', SLFApp.displaySLFRedeem);
    $(document).on('click', '.btn-SLF-subscribe', SLFApp.handleSLFSubscribe);
    $(document).on('click', '.btn-SLF-redeem', SLFApp.handleSLFRedeem);

  },

  // control what to display according to the state and user
  viewControl: function() {

    var SLFInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      SLFApp.contracts.SLF.deployed().then(function(instance) {
        SLFInstance = instance;

        // Check if the note is issued
        return SLFInstance.getIfIssued.call();
      }).then(function(isIssued) {
          if (isIssued == true) {
            // Fill in all the tier names
            // already issued
            document.getElementById('Pre-Issuance').style.display = "none";
            document.getElementById('Post-Issuance').style.display = "";
          } else {
            // not issued
            // issuer's view only
            document.getElementById('Pre-Issuance').style.display = "";
            document.getElementById('Post-Issuance').style.display = "none";
          }
          // Check if user or issuer is using the panel
          return SLFInstance.getIssuer.call();
      }).then(function(issuer) {
          //console.log(issuer);
          if (account == issuer) {
            // issuer panel
            document.getElementById('menu').classList.add("nav-issuer");
            //document.getElementById('issuer-menu').style.display = "";
            document.getElementById('issuer-view').style.display = "";
            //document.getElementById('investor-menu').style.display = "none";
            document.getElementById('investor-view').style.display = "none";
            document.getElementById('user').innerText = "Issuer View";
            document.getElementsByClassName('btn-SLF-display')[0].classList.add("btn-issuer");
          } else {
            // investor panel
            document.getElementById('menu').classList.add("nav-investor");
            //document.getElementById('issuer-menu').style.display = "none";
            document.getElementById('issuer-view').style.display = "none";
            //document.getElementById('investor-menu').style.display = "";
            document.getElementById('investor-view').style.display = "";
            document.getElementById('user').innerText = "Investor View";
            document.getElementsByClassName('btn-SLF-display')[0].classList.add("btn-investor");
          }
          // Always display the SLF notes created
          return SLFApp.displaySLF();
      }).then(function() {
          return SLFApp.displayTierNames();
          //return SLFApp.displayBalance();
      }).catch(function(err) {
          console.log(err.message);
      });
    });
  },

  // Issue the SLF with input fields
  handleSLFCreation: function(event) {

    event.preventDefault();

    var offset = new Date().getTimezoneOffset()*60*1000;
    var fundName = document.getElementById('fundName').value;
    var fundIssueDate = (Date.parse(document.getElementById('fundIssueDate').value)+offset)/1000;
    var fundMaturityDate = (Date.parse(document.getElementById('fundMaturityDate').value)+offset)/1000;
    //var fundCommission = web3.toWei(document.getElementById('fundCommission').value/100, 'ether');
    var underlying = document.getElementById('fundUnderlying').value;
    var initialPx = web3.toWei(document.getElementById('fundInitialPx').value, 'ether');
    var minLiqVal = web3.toWei(document.getElementById('fundMinLiqVal').value/100, 'ether');
    var maxLiqVal = web3.toWei(document.getElementById('fundMaxLiqVal').value/100, 'ether');
    var amountIssue = document.getElementById('fundAmount').value;

    // Tier Information
    var FItier = $('#FItier-data');
    var EQtier = $('#EQtier-data');
    var FItierName = FItier.find('.tier-name')[0].value;
    var FItierWeight = web3.toWei(FItier.find('.tier-weight')[0].value/100, 'ether');
    var FItierCommission = web3.toWei(FItier.find('.tier-commission')[0].value/100, 'ether');
    var FItierInterest = web3.toWei(FItier.find('.tier-interest')[0].value/100, 'ether');
    var EQtierName = EQtier.find('.tier-name')[0].value;
    var EQtierWeight = web3.toWei(EQtier.find('.tier-weight')[0].value/100, 'ether');
    var EQtierCommission = web3.toWei(EQtier.find('.tier-commission')[0].value/100, 'ether');

    // Check weight totals to 100
    if (Number(FItierWeight) + Number(EQtierWeight) != Number(web3.toWei(1, 'ether')))
    {
      //console.log(Number(FItierWeight) + Number(EQtierWeight));
      //console.log(Number(web3.toWei(1, 'ether')));
      window.alert('Total percentage need to be 100%');
      return Error('Total percentage need to be 100%');
    }

    var SLFInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      SLFApp.contracts.SLF.deployed().then(function(instance) {
        SLFInstance = instance;
        // Issue SLF note
        // Execute newIssue1/2 as a transaction by sending account
        return SLFInstance.newIssue1(FItierName,
                                     FItierWeight,
                                     FItierCommission,
                                     FItierInterest,
                                     EQtierName,
                                     EQtierWeight,
                                     EQtierCommission,
                                     {from: account, gas:3000000});
      }).then(function() {
        // console.log(FItierName);
        // console.log(FItierWeight);
        // console.log(FItierInterest);
        // console.log(EQtierName);
        // console.log(EQtierWeight);
        return SLFInstance.newIssue2(fundName,
                                    fundIssueDate,
                                    fundMaturityDate,
                                    underlying,
                                    initialPx,
                                    minLiqVal,
                                    maxLiqVal,
                                    amountIssue,
                                    {from: account, gas:3000000});
      }).then(function() {
        // console.log(fundName);
        // console.log(fundIssueDate);
        // console.log(fundMaturityDate);
        // console.log(fundCommission);
        // console.log(underlying);
        // console.log(initialPx);
        // console.log(minLiqVal);
        // console.log(maxLiqVal);
        // console.log(amountIssue);

        // Reload window to change view
        return location.reload();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  displaySLF: function() {

    var SLFInstance;
    SLFApp.contracts.SLF.deployed().then(function(instance) {
      SLFInstance = instance;

      return SLFInstance.getNoteName.call();
    }).then(function(name) {
        var nameString = web3.toUtf8(name);
        document.getElementById("fund-name").innerText = nameString;
        $("#payoff").attr("src", "SLF/payoff.JPG");
        // // Display different chart according to the name
        // if (nameString.includes("NPPN", 0)) {
        //   $("#payoff").attr("src", "SLF/payoff.JPG");
        // } else {
        //   $("#payoff").attr("src", "SLF/payoff.JPG");
        // }
        return SLFInstance.getIssuer.call();
    }).then(function(issuer) {
        document.getElementById("fund-issuer").innerText = issuer;
        return SLFInstance.getOutstanding.call();
    }).then(function(outstanding) {
        document.getElementById("fund-outstanding").innerText = outstanding.toNumber();
        if (outstanding.toNumber()>0) {
          document.getElementById("payoff").style.display = "";
        }
        return SLFInstance.getFIOutstanding.call();
    }).then(function(FIoutstanding) {
        document.getElementById("fi-outstanding").innerText = FIoutstanding.toNumber();
        return SLFInstance.getEQOutstanding.call();
    }).then(function(EQoutstanding) {
        document.getElementById("eq-outstanding").innerText = EQoutstanding.toNumber();
        return SLFInstance.getNAV.call();
    }).then(function(nav) {
        //round to 2 decimal
        var roundedNAV = Math.round(web3.fromWei(nav.toNumber(), 'ether') * 100) / 100;
        document.getElementById("fund-nav").innerText = roundedNAV;
        return SLFInstance.getFINAV.call();
    }).then(function(nav) {
        //round to 2 decimal
        var roundedNAV = Math.round(web3.fromWei(nav.toNumber(), 'ether') * 100) / 100;
        document.getElementById("FI-nav").innerText = roundedNAV;
        return SLFInstance.getEQNAV.call();
    }).then(function(nav) {
        //round to 2 decimal
        var roundedNAV = Math.round(web3.fromWei(nav.toNumber(), 'ether') * 100) / 100;
        document.getElementById("EQ-nav").innerText = roundedNAV;
        return SLFInstance.getUnderlyingName.call();
    }).then(function(name) {
        document.getElementById("fund-underlying").innerText = web3.toUtf8(name);
        return SLFInstance.getUnderlyingInitialPx.call();
    }).then(function(price) {
        document.getElementById("fund-initial-px").innerText = web3.fromWei(price.toNumber(), 'ether');
        return SLFInstance.getUnderlyingCurrentPx.call();
    }).then(function(price) {
        document.getElementById("fund-current-px").innerText = web3.fromWei(price.toNumber(), 'ether');
        return SLFInstance.getIssueDate.call();
    }).then(function(issueDate) {
        document.getElementById("fund-issuedate").innerText = moment(issueDate.toNumber()*1000).format("MM-DD-YYYY");
        return SLFInstance.getMaturity.call();
    }).then(function(maturityDate) {
        document.getElementById("fund-maturitydate").innerText = moment(maturityDate.toNumber()*1000).format("MM-DD-YYYY");
        return SLFInstance.getMinLiqPct.call();
    }).then(function(minLiq) {
        document.getElementById("fund-min-liq").innerText = web3.fromWei(minLiq.toNumber(), 'ether')*100;
        return SLFInstance.getMaxLiqPct.call();
    }).then(function(maxLiq) {
      document.getElementById("fund-max-liq").innerText = web3.fromWei(maxLiq.toNumber(), 'ether')*100;
      return SLFInstance.getIfLiquidated.call();
    }).then(function(isLiq) {
      if(isLiq == true) {
        document.getElementById("fund-status").innerText = "Liquidated";
        document.getElementById("liq-only").style.display = "";
      }
      return SLFInstance.getLiqDate.call();
    }).then(function(liqDate) {
      document.getElementById("liq-date").innerText = moment(liqDate.toNumber()*1000).format("MM-DD-YYYY");
      return SLFInstance.getLiqVal.call();
    }).then(function(liqVal) {
      document.getElementById("liq-val").innerText = web3.fromWei(liqVal.toNumber(), 'ether');
      return SLFInstance.getLiqEQVal.call();
    }).then(function(liqEQVal) {
      document.getElementById("liq-eq-val").innerText = web3.fromWei(liqEQVal.toNumber(), 'ether');
    }).catch(function(err) {
        console.log(err.message);
    });

  },

  handleSLFIssue: function(event) {

    event.preventDefault();
    var amountIssue = document.getElementById('fundAmountAdditional').value;

    var SLFInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      SLFApp.contracts.SLF.deployed().then(function(instance) {
        SLFInstance = instance;

        // Issue more SLF note
        return SLFInstance.additionalIssue(amountIssue,{from: account, gas:300000});
      }).then(function(name) {
          document.getElementById('fundAmountAdditional').value = "";
          // Reload window to change view
          return location.reload();
      }).catch(function(err) {
         console.log(err.message);
      });
    });

  },

  handleUpdatePrice: function() {

    event.preventDefault();

    var currentPrice = web3.toWei(document.getElementById('underlying-price').value, 'ether');
    var offset = new Date().getTimezoneOffset()*60;
    var currentDate = parseInt((new Date().getTime() / 1000).toFixed(0));
    var updateDate = currentDate - offset;
    //console.log(currentPrice);
    //console.log(updateDate);

    var SLFInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      SLFApp.contracts.SLF.deployed().then(function(instance) {
        SLFInstance = instance;
        // Update price
        return SLFInstance.updatePrice(currentPrice,updateDate,{from: account, gas:300000});
      }).then(function(success) {
        // Reload window to change view
        return location.reload();
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  displayTierNames: function() {

    var SLFInstance;
    var tierNameDropDowns = $('#investor-view').find('.tier-name');
    var FItierName =document.getElementById('tierfi-name');
    var EQtierName =document.getElementById('tiereq-name');

    SLFApp.contracts.SLF.deployed().then(function(instance) {
      SLFInstance = instance;

      return SLFInstance.getFITierName.call();
    }).then(function(FIName) {
        //console.log(web3.toUtf8(FIName));
        // Fill in the option value
        FItierName.innerText = web3.toUtf8(FIName);
        for (var i = 0; i < tierNameDropDowns.length; i++) {
          // Create new option element
          var opt = document.createElement("option");
          opt.value= web3.toUtf8(FIName);
          opt.innerHTML = web3.toUtf8(FIName);
          // then append it to the select element
          tierNameDropDowns[i].appendChild(opt);
        }
        return SLFInstance.getEQTierName.call();
    }).then(function(EQName) {
        //console.log(web3.toUtf8(EQName));
        EQtierName.innerText = web3.toUtf8(EQName);
        for (var i = 0; i < tierNameDropDowns.length; i++) {
          // Create new option element
          var opt = document.createElement("option");
          opt.value= web3.toUtf8(EQName);
          opt.innerHTML = web3.toUtf8(EQName);
          // then append it to the select element
          tierNameDropDowns[i].appendChild(opt);
        }
    }).then(function() {
        return SLFApp.displayBalance();
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handlePayContract: function(event) {

    event.preventDefault();

    var amountPay = web3.toWei(document.getElementById('pay-contract').value, 'ether');
    var SLFInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      SLFApp.contracts.SLF.deployed().then(function(instance) {
        SLFInstance = instance;

        // Pay
        return SLFInstance.payContract({from: account, gas:300000, value:amountPay});
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  displayBalance: function() {

    //var tierName = document.getElementById("tier-for-balance").value;
    var tierFIName = document.getElementById('tierfi-name').innerText;
    var tierEQName = document.getElementById('tiereq-name').innerText;
    var SLFInstance;

    SLFApp.contracts.SLF.deployed().then(function(instance) {
      SLFInstance = instance;
      //console.log(SLFInstance);

      return SLFInstance.getBalance.call(tierFIName);
    }).then(function(balance) {
        //console.log(balance.toNumber());
        document.getElementById("fund-fibalance").innerText = balance.toNumber();
        return SLFInstance.getBalance.call(tierEQName);
    }).then(function(balance) {
        //console.log(balance.toNumber());
        document.getElementById("fund-eqbalance").innerText = balance.toNumber();
        return SLFInstance.getContractETHBalance.call();
    }).then(function(ETHbalance) {
        console.log("Contract has ETH:" + ETHbalance);
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleSLFSend: function(event) {

    event.preventDefault();
    var tierName = document.getElementById("tier-for-send").value;
    var amountSend = document.getElementById('fundAmountSend').value;
    var addressSend = document.getElementById('addressSend').value;
    var SLFInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      SLFApp.contracts.SLF.deployed().then(function(instance) {
        SLFInstance = instance;

        // User Send
        return SLFInstance.sendNote(tierName,addressSend,amountSend,{from: account, gas:300000});
      }).then(function(sufficient) {
          //console.log(sufficient);
          document.getElementById("noteAmountSend").value = "";
          document.getElementById("addressSend").value = "";
          document.getElementById("send-status").innerText = "Note sent successfully.";
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  displaySLFSubscribe: function(event) {

    var tierName = document.getElementById("tier-for-subscribe").value;
    var amountSubscribe = document.getElementById('noteAmountSubscribe').value;

    var SLFInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      SLFApp.contracts.SLF.deployed().then(function(instance) {
        SLFInstance = instance;

        // View User Subscribe Payable
        return SLFInstance.userGetSubscribePayable.call(tierName,amountSubscribe);
      }).then(function(ETHpayable) {
          //console.log(ETHpayable.toString());
          //document.getElementById("eth-subscribe").innerText = web3.fromWei(ETHpayable.toNumber(), 'ether');
          //round to 2 decimal
          var roundedPayable = Math.round(web3.fromWei(ETHpayable.toNumber(), 'ether') * 100) / 100;
          document.getElementById("eth-subscribe").innerText = roundedPayable;
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  displaySLFRedeem: function(event) {

    var tierName = document.getElementById("tier-for-redeem").value;
    var amountRedeem = document.getElementById('noteAmountRedeem').value;

    var SLFInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      SLFApp.contracts.SLF.deployed().then(function(instance) {
        SLFInstance = instance;

        // View User Redeem Receivable
        return SLFInstance.userGetRedeemReceivable.call(tierName,amountRedeem);
      }).then(function(ETHreceivable) {
          //console.log(ETHreceivable.toString());
          //document.getElementById("eth-redeem").innerText = web3.fromWei(ETHreceivable.toNumber(), 'ether');
          //round to 2 decimal
          var roundedReceivable = Math.round(web3.fromWei(ETHreceivable.toNumber(), 'ether') * 100) / 100;
          document.getElementById("eth-redeem").innerText = roundedReceivable;
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  handleSLFSubscribe: function(event) {

    event.preventDefault();
    var tierName = document.getElementById("tier-for-subscribe").value;
    var amountSubscribe = document.getElementById('noteAmountSubscribe').value;

    var SLFInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      SLFApp.contracts.SLF.deployed().then(function(instance) {
        SLFInstance = instance;

        // User Subscribe
        return SLFInstance.userGetSubscribePayable.call(tierName,amountSubscribe);
      }).then(function(ETHpayable) {
          //console.log(ETHpayable.toString());
          document.getElementById("eth-subscribe").innerText = web3.fromWei(ETHpayable.toNumber(), 'ether');
          return SLFInstance.userSubscribe(tierName,amountSubscribe,
            {from: account, gas:300000, value:ETHpayable.toNumber()});
      }).then(function(success) {
          document.getElementById('noteAmountSubscribe').value="";
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  handleSLFRedeem: function(event) {

    event.preventDefault();
    var tierName = document.getElementById("tier-for-redeem").value;
    var amountRedeem = document.getElementById('noteAmountRedeem').value;

    var SLFInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      SLFApp.contracts.SLF.deployed().then(function(instance) {
        SLFInstance = instance;

        // User Redeem
        return SLFInstance.userRedeem(tierName,amountRedeem,{from: account, gas:300000});
      }).then(function(success) {
          document.getElementById('noteAmountRedeem').value="";
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  }

};

// $(function() {
//   $(window).load(function() {
//     SLFApp.init();
//   });
// });
