IDXApp = {
  web3Provider: null,
  contracts: {},

  init: function() {
    // Load coin/asset List.
    IDXApp.displayMarket('../IDX/underlying-issue.json','issue');
    // $.getJSON('../IDX/underlying-issue.json', function(data) {
    //   var underlyingRow = $('#uRow-issue');
    //   var underlyingTemplate = $('#uTemplate-issue');
    //
    //   for (i = 0; i < data.length; i ++) {
    //     // Fill in fields for html
    //     underlyingTemplate.find('.underlying-name').text(data[i].name);
    //     underlyingTemplate.find('.underlying-price').text(data[i].price);
    //
    //     //pass the data attribute fields
    //     underlyingTemplate.find('.btn-select-underlying').attr('data-name', data[i].name);
    //     underlyingTemplate.find('.btn-select-underlying').attr('data-price', data[i].price);
    //
    //     underlyingRow.append(underlyingTemplate.html());
    //   }
    // });
    return IDXApp.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance
    if (typeof web3 !== 'undefined') {
      IDXApp.web3Provider = web3.currentProvider;
    } else {
    // If no injected web3 instance is detected, fall back to Ganache
      IDXApp.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(IDXApp.web3Provider);

    return IDXApp.initContract();
  },

  initContract: function() {
    $.getJSON('IDX.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var IDXArtifact = data;
      IDXApp.contracts.IDX = TruffleContract(IDXArtifact);

      // Set the provider for our contract
      IDXApp.contracts.IDX.setProvider(IDXApp.web3Provider);

      // Control views
      return IDXApp.viewControl();
    });

    return IDXApp.bindEvents();
  },

  bindEvents: function() {
    // handler for select underlying
    $(document).on('click', '.btn-select-underlying', IDXApp.handleUnderlyingSelection);

    // handler for remove underlying
    $(document).on('click', '.btn-remove-underlying', IDXApp.handleUnderlyingRemoval);

    // handler for change weight
    $(document).on('change', '.underlying-weight', IDXApp.handleUnderlyingWeightCalculation);
    $(document).on('change', '#fundInitialPx', IDXApp.handleUnderlyingWeightCalculation);

    // handler for using selected bond and option to create contract
    $(document).on('click', '.btn-IDX-create', IDXApp.handleIDXCreation);
    $(document).on('click', '.btn-IDX-issue', IDXApp.handleIDXIssue);

    // handler for display to created contract
    $(document).on('click', '.btn-IDX-display', IDXApp.displayIDX);

    // handler for update price
    $(document).on('click', '.btn-content-display', IDXApp.displayIDXContent);
    $(document).on('click', '.btn-update-price', IDXApp.handleUpdatePrice);

    // handler for rebalance
    $(document).on('click', '.btn-market-display', IDXApp.displayMarketforRebalance);
    $(document).on('click', '.btn-rebalance', IDXApp.handleRebalance);

    // handler for pay contract
    $(document).on('click', '.btn-pay-contract', IDXApp.handlePayContract);

    // handler for display balance
    $(document).on('click', '.btn-IDX-balance', IDXApp.displayBalance);

    // handler for send fund
    $(document).on('click', '.btn-IDX-send', IDXApp.handleIDXSend);

    // handler for user subscribe and redeem
    $(document).on('click', '.btn-view-subscribe', IDXApp.displayIDXSubscribe);
    $(document).on('click', '.btn-view-redeem', IDXApp.displayIDXRedeem);
    $(document).on('click', '.btn-IDX-subscribe', IDXApp.handleIDXSubscribe);
    $(document).on('click', '.btn-IDX-redeem', IDXApp.handleIDXRedeem);

  },

  // control what to display according to the state and user
  viewControl: function() {

    var IDXInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      IDXApp.contracts.IDX.deployed().then(function(instance) {
        IDXInstance = instance;

        // Check if the fund is issued
        return IDXInstance.getIfIssued.call();
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
          return IDXInstance.getIssuer.call();
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
            document.getElementsByClassName('btn-IDX-display')[0].classList.add("btn-issuer");
          } else {
            // investor panel
            document.getElementById('menu').classList.add("nav-investor");
            //document.getElementById('issuer-menu').style.display = "none";
            document.getElementById('issuer-view').style.display = "none";
            //document.getElementById('investor-menu').style.display = "";
            document.getElementById('investor-view').style.display = "";
            document.getElementById('user').innerText = "Investor View";
            document.getElementsByClassName('btn-IDX-display')[0].classList.add("btn-investor");
          }
          // Always display the IDX funds created
          return IDXApp.displayIDX();
      }).then(function() {
          return IDXApp.displayBalance();
      }).catch(function(err) {
          console.log(err.message);
      });
    });
  },

  // Add underlying selected into the bottom selectedBondRow
  handleUnderlyingSelection: function(event) {

    var selectedUnderlyingName = $(event.target).data('name');
    var selectedUnderlyingPrice = $(event.target).data('price');
    var purpose = $(event.target).data('purpose');

    var selectedUnderlyingRow = $('#selecteduRow-'+purpose);
    var underlyingTemplate = $('#selecteduTemplate');
    // Fill in fields for html
    underlyingTemplate.find('.underlying-name').text(selectedUnderlyingName);
    underlyingTemplate.find('.underlying-price').text(selectedUnderlyingPrice);

    // Only allow one bond
    // Need to clear HTML before add
    selectedUnderlyingRow.innerHTML = "";
    selectedUnderlyingRow.append(underlyingTemplate.html());
  },

  // Delete underlying selected
  handleUnderlyingRemoval: function(event) {

    event.currentTarget.parentNode.parentNode.parentNode.removeChild(event.currentTarget.parentNode.parentNode);

  },

  // refresh the amount according to weight enter
  handleUnderlyingWeightCalculation: function(event) {
    //console.log(event.currentTarget.id);
    //var tableName = event.currentTarget.parentNode.parentNode.parentNode.id;
    var tableName;
    if (event.currentTarget.id == "fundInitialPx") {
      tableName = "selecteduRow-issue"; // issue table by default
    } else { // event is table input
      tableName = event.currentTarget.parentNode.parentNode.parentNode.id;
    }
    var basePrice;
    if (tableName == "selecteduRow-issue") {
      basicPrice = document.getElementById('fundInitialPx').value;
    } else { //"selecteduRow-rebalance"
      basicPrice = document.getElementById('fund-nav-rebalance').innerText;
    }

    //var selectedUnderlyingRow = $('#selecteduRow-issue');
    //var basicPrice = document.getElementById(basePriceId).value;
    if (basicPrice != "") {
      //console.log(basicPrice);
      var table = document.getElementById(tableName);
      var totalWeight = 0;
      for (var i = 0, row; row = table.rows[i]; i++) {
        //iterate through rows
        //console.log(row);
        var price = row.cells[1].innerText; // price
        var weight = row.cells[3].firstElementChild.value; //weight
        //console.log(price);
        //console.log(weight);
        var amount = Math.round(basicPrice*weight/100/price* 100000000) / 100000000;
        //console.log(amount);
        row.cells[4].innerText = amount;

        // check if weight exceed 100%
        totalWeight = Number(weight) + totalWeight;
      }
      // Check total weight
      //console.log(totalWeight);
      if (totalWeight > 100) {
        alert('Total weight cannot exceed 100%!');
      }
    }

  },

  // Issue the IDX with input fields
  handleIDXCreation: function(event) {

    event.preventDefault();

    // check if weight equals to 100%
    var table = document.getElementById("selecteduRow-issue");
    var totalWeight = 0;
    for (var i = 0, row; row = table.rows[i]; i++) {
      //iterate through rows
      var weight = row.cells[3].firstElementChild.value; //weight
      // console.log(weight);
      totalWeight = Number(weight) + totalWeight;
    }
    //console.log(totalWeight);
    if (totalWeight > 100) {
      alert('Total weight has to be 100%');
      return Error('Total weight has to be 100%');
    }

    var initialPx = web3.toWei(document.getElementById('fundInitialPx').value, 'ether');
    var fundName = document.getElementById('fundName').value;
    var offset = new Date().getTimezoneOffset()*60*1000;
    var fundIssueDate = (Date.parse(document.getElementById('fundIssueDate').value)+offset)/1000;
    var fundFee = web3.toWei(document.getElementById('fundFee').value/100, 'ether');
    var amountIssue = document.getElementById('fundAmount').value;

    // Underlying Information
    var selectedRows = $('#selecteduRow-issue');
    var uName=[];
    for (i = 0; i < selectedRows.find('.underlying-name').length; i++) {
      uName.push(selectedRows.find('.underlying-name')[i].innerText);
    }
    var uPrice = [];
    for (i = 0; i < selectedRows.find('.underlying-price').length; i++) {
      uPrice.push(web3.toWei(parseFloat(selectedRows.find('.underlying-price')[i].innerText), 'ether'));
    }
    var uWeight = [];
    for (i = 0; i < selectedRows.find('.underlying-weight').length; i++) {
      uWeight.push(web3.toWei(selectedRows.find('.underlying-weight')[i].value/100, 'ether'));
    }
    var uAmount = [];
    for (i = 0; i < selectedRows.find('.underlying-amount').length; i++) {
      uAmount.push(web3.toWei(parseFloat(selectedRows.find('.underlying-amount')[i].innerText), 'ether'));
    }

    var IDXInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      IDXApp.contracts.IDX.deployed().then(function(instance) {
        IDXInstance = instance;
        // Issue IDX fund
        // Execute newIssue1/2 as a transaction by sending account
        return IDXInstance.newIssue(uName,
                                    uWeight,
                                    uPrice,//uAmount
                                    initialPx,
                                    fundName,
                                    fundIssueDate,
                                    fundFee,
                                    amountIssue,
                                    {from: account, gas:3000000});
      }).then(function() {
        // console.log(uName);
        // console.log(uWeight);
        // console.log(uPrice);
        // console.log(initialPx);
        // console.log(fundName);
        // console.log(fundIssueDate);
        // console.log(fundFee);
        // console.log(amountIssue);

        // Reload window to change view
        return location.reload();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  displayIDX: function() {

    var IDXInstance;
    IDXApp.contracts.IDX.deployed().then(function(instance) {
      IDXInstance = instance;

      return IDXInstance.getFundName.call();
    }).then(function(name) {
        var nameString = web3.toUtf8(name);
        document.getElementById("fund-name").innerText = nameString;
        //$("#payoff").attr("src", "IDX/payoff.JPG");
        return IDXInstance.getIssuer.call();
    }).then(function(issuer) {
        document.getElementById("fund-issuer").innerText = issuer;
        return IDXInstance.getOutstanding.call();
    }).then(function(outstanding) {
        document.getElementById("fund-outstanding").innerText = outstanding.toNumber();
        // if (outstanding.toNumber()>0) {
        //   document.getElementById("payoff").style.display = "";
        // }
        return IDXInstance.getNAV.call();
    }).then(function(nav) {
        //round to 2 decimal
        var roundedNAV = Math.round(web3.fromWei(nav.toNumber(), 'ether') * 100) / 100;
        document.getElementById("fund-nav").innerText = roundedNAV;
        document.getElementById("fund-nav-rebalance").innerText = roundedNAV;
        return IDXInstance.getBasket.call();
    }).then(function(result) {
        //console.log(result);
        //document.getElementById("IDX-Underlying").style.display = "";
        var uRow = $('#IDXuRow');
        var uTemplate = $('#IDXuTemplate');
        // clear the table first
        document.getElementById('IDXuRow').innerHTML = '';
        for (i = 0; i < result[0].length; i ++) {
            uTemplate.find('.underlying-name').text(web3.toUtf8(result[0][i].toString()));
            uTemplate.find('.underlying-amount').text(web3.fromWei(result[1][i].toNumber(), 'ether'));
            uTemplate.find('.underlying-price').text(web3.fromWei(result[2][i].toNumber(), 'ether'));
            uRow.append(uTemplate.html());
        }
    }).catch(function(err) {
        console.log(err.message);
    });

  },

  handleIDXIssue: function(event) {

    event.preventDefault();
    var amountIssue = document.getElementById('fundAmountAdditional').value;

    var IDXInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      IDXApp.contracts.IDX.deployed().then(function(instance) {
        IDXInstance = instance;

        // Issue more IDX fund
        return IDXInstance.additionalIssue(amountIssue,{from: account, gas:300000});
      }).then(function(name) {
          document.getElementById('fundAmountAdditional').value = "";
          // Reload window to change view
          return location.reload();
      }).catch(function(err) {
         console.log(err.message);
      });
    });

  },

  displayIDXContent: function() {

    var IDXInstance;

    IDXApp.contracts.IDX.deployed().then(function(instance) {
      IDXInstance = instance;

      return IDXInstance.getBasket.call();
      }).then(function(result) {
        //console.log(result);
        document.getElementById("IDX-Underlying-update").style.display = '';
        var uRow = $('#IDXuRow-update');
        var uTemplate = $('#IDXuTemplate-update');
        // clear the table first
        document.getElementById('IDXuRow-update').innerHTML = '';
        for (i = 0; i < result[0].length; i ++) {
            uTemplate.find('.underlying-name').text(web3.toUtf8(result[0][i].toString()));
            uTemplate.find('.underlying-amount').text(web3.fromWei(result[1][i].toNumber(), 'ether'));
            //uTemplate.find('.underlying-price').text(web3.fromWei(result[2][i].toNumber(), 'ether'));
            uRow.append(uTemplate.html());
        }
        // Change button displayed
        $('.btn-content-display')[0].style.display = 'none';
        $('.btn-update-price')[0].style.display = '';
      }).catch(function(err) {
          console.log(err.message);
    });

  },

  handleUpdatePrice: function() {

    event.preventDefault();

    var uName=[];
    var uPrice=[];
    //console.log($('#IDXeoRow').find('.eo-name').length);
    for (i = 0; i < $('#IDXuRow-update').find('.underlying-name').length; i ++) {
        uName.push($('#IDXuRow-update').find('.underlying-name')[i].innerText);
        uPrice.push(web3.toWei(parseFloat($('#IDXuRow-update').find('.underlying-price')[i].value), 'ether'));
    }
    //console.log(uName);
    //console.log(uPrice);

    var IDXInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      IDXApp.contracts.IDX.deployed().then(function(instance) {
        IDXInstance = instance;

        // Issue IDX fund
        return IDXInstance.updatePrice(uName,uPrice,{from: account, gas:300000});
      }).then(function(success) {
          // Change button displayed
          $('.btn-content-display')[0].style.display = '';
          $('.btn-update-price')[0].style.display = 'none';
          document.getElementById("IDX-Underlying-update").style.display = 'none';
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  displayMarket: function(jsonFile, purpose) {
    // for issue:
    // jsonFile = '../IDX/underlying-issue.json';
    // purpose = "issue";
    // for rebalance:
    // jsonFile = '../IDX/underlying-rebal.json';
    // purpose = "rebalance";

    // Load coin/asset List.
    //document.getElementById('uTables-'+purpose).style.display = '';
    $.getJSON(jsonFile, function(data) {
      var underlyingRow = $('#uRow-'+purpose);
      var underlyingTemplate = $('#uTemplate');
      document.getElementById('uRow-'+purpose).innerHTML = '';
      for (i = 0; i < data.length; i ++) {
        // Fill in fields for html
        underlyingTemplate.find('.underlying-name').text(data[i].name);
        underlyingTemplate.find('.underlying-price').text(data[i].price);

        //pass the data attribute fields
        underlyingTemplate.find('.btn-select-underlying').attr('data-name', data[i].name);
        underlyingTemplate.find('.btn-select-underlying').attr('data-price', data[i].price);
        underlyingTemplate.find('.btn-select-underlying').attr('data-purpose', purpose);

        underlyingRow.append(underlyingTemplate.html());
      }
    });

  },

  displayMarketforRebalance: function() {
    // Load coin/asset List.
    IDXApp.displayMarket('../IDX/underlying-rebal.json','rebalance');
    document.getElementById('uTables-rebalance').style.display = '';
    //document.getElementsByClassName('btn-rebalance').style.display = '';
  },

  handleRebalance: function() {

    event.preventDefault();

    // check if weight equals to 100%
    var table = document.getElementById("selecteduRow-rebalance");
    var totalWeight = 0;
    for (var i = 0, row; row = table.rows[i]; i++) {
      //iterate through rows
      var weight = row.cells[3].firstElementChild.value; //weight
      // console.log(weight);
      totalWeight = Number(weight) + totalWeight;
    }
    //console.log(totalWeight);
    if (totalWeight > 100) {
      alert('Total weight has to be 100%');
      return Error('Total weight has to be 100%');
    }

    var basePx = web3.toWei(document.getElementById('fund-nav-rebalance').innerText, 'ether');

    // Underlying Information
    var selectedRows = $('#selecteduRow-rebalance');
    var uName=[];
    for (i = 0; i < selectedRows.find('.underlying-name').length; i++) {
      uName.push(selectedRows.find('.underlying-name')[i].innerText);
    }
    var uPrice = [];
    for (i = 0; i < selectedRows.find('.underlying-price').length; i++) {
      uPrice.push(web3.toWei(parseFloat(selectedRows.find('.underlying-price')[i].innerText), 'ether'));
    }
    var uWeight = [];
    for (i = 0; i < selectedRows.find('.underlying-weight').length; i++) {
      uWeight.push(web3.toWei(selectedRows.find('.underlying-weight')[i].value/100, 'ether'));
    }
    var uAmount = [];
    for (i = 0; i < selectedRows.find('.underlying-amount').length; i++) {
      uAmount.push(web3.toWei(parseFloat(selectedRows.find('.underlying-amount')[i].innerText), 'ether'));
    }

    var IDXInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      IDXApp.contracts.IDX.deployed().then(function(instance) {
        IDXInstance = instance;
        // Issue IDX fund
        // Execute newIssue1/2 as a transaction by sending account
        return IDXInstance.rebalance(uName,
                                    uWeight,
                                    uPrice,//uAmount
                                    basePx,
                                    {from: account, gas:3000000});
      }).then(function() {
        console.log(uName);
        console.log(uWeight);
        console.log(uPrice);
        console.log(basePx);

        // Reload window to change view
        return location.reload();
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  handlePayContract: function(event) {

    event.preventDefault();

    var amountPay = web3.toWei(document.getElementById('pay-contract').value, 'ether');
    var IDXInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      IDXApp.contracts.IDX.deployed().then(function(instance) {
        IDXInstance = instance;

        // Pay
        return IDXInstance.payContract({from: account, gas:300000, value:amountPay});
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  displayBalance: function() {

    var IDXInstance;

    IDXApp.contracts.IDX.deployed().then(function(instance) {
      IDXInstance = instance;
      //console.log(IDXInstance);

      return IDXInstance.getFundBalance.call();
    }).then(function(balance) {
        //console.log(balance);
        document.getElementById("fund-balance").innerText = balance.toNumber();
        return IDXInstance.getContractETHBalance.call();
    }).then(function(ETHbalance) {
        console.log("Contract has ETH:" + ETHbalance);
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleIDXSend: function(event) {

    event.preventDefault();
    var amountSend = document.getElementById('fundAmountSend').value;
    var addressSend = document.getElementById('addressSend').value;
    var IDXInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      IDXApp.contracts.IDX.deployed().then(function(instance) {
        IDXInstance = instance;

        // User Send
        return IDXInstance.sendFund(addressSend,amountSend,{from: account, gas:300000});
      }).then(function(sufficient) {
          //console.log(sufficient);
          document.getElementById("fundAmountSend").value = "";
          document.getElementById("addressSend").value = "";
          document.getElementById("send-status").innerText = "Fund sent successfully.";
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  displayIDXSubscribe: function(event) {

    var amountSubscribe = document.getElementById('fundAmountSubscribe').value;

    var IDXInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      IDXApp.contracts.IDX.deployed().then(function(instance) {
        IDXInstance = instance;

        // View User Subscribe Payable
        return IDXInstance.userGetSubscribePayable.call(amountSubscribe);
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

  displayIDXRedeem: function(event) {

    var amountRedeem = document.getElementById('fundAmountRedeem').value;

    var IDXInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      IDXApp.contracts.IDX.deployed().then(function(instance) {
        IDXInstance = instance;

        // View User Redeem Receivable
        return IDXInstance.userGetRedeemReceivable.call(amountRedeem);
      }).then(function(ETHreceivable) {
          //console.log(ETHreceivable.toString());
          //round to 2 decimal
          //document.getElementById("eth-redeem").innerText = web3.fromWei(ETHreceivable.toNumber(), 'ether');
          //round to 2 decimal
          var roundedReceivable = Math.round(web3.fromWei(ETHreceivable.toNumber(), 'ether') * 100) / 100;
          document.getElementById("eth-redeem").innerText = roundedReceivable;
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  handleIDXSubscribe: function(event) {

    event.preventDefault();
    var amountSubscribe = document.getElementById('fundAmountSubscribe').value;

    var IDXInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      IDXApp.contracts.IDX.deployed().then(function(instance) {
        IDXInstance = instance;

        // User Subscribe
        return IDXInstance.userGetSubscribePayable.call(amountSubscribe);
      }).then(function(ETHpayable) {
          //console.log(ETHpayable.toString());
          document.getElementById("eth-subscribe").innerText = web3.fromWei(ETHpayable.toNumber(), 'ether');
          return IDXInstance.userSubscribe(amountSubscribe,
            {from: account, gas:300000, value:ETHpayable.toNumber()});
      }).then(function(success) {
          document.getElementById('fundAmountSubscribe').value="";
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  handleIDXRedeem: function(event) {

    event.preventDefault();
    var amountRedeem = document.getElementById('fundAmountRedeem').value;

    var IDXInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      IDXApp.contracts.IDX.deployed().then(function(instance) {
        IDXInstance = instance;

        // User Redeem
        return IDXInstance.userRedeem(amountRedeem,{from: account, gas:300000});
      }).then(function(success) {
          document.getElementById('fundAmountRedeem').value="";
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  }

};

// $(function() {
//   $(window).load(function() {
//     IDXApp.init();
//   });
// });
