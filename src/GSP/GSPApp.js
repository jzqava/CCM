GSPApp = {
  web3Provider: null,
  contracts: {},

  init: function() {
    // Load Bond List.
    $.getJSON('../GSP/bond.json', function(data) {
      var bondRow = $('#bondRow');
      var bondTemplate = $('#bondTemplate');

      for (i = 0; i < data.length; i ++) {
        // Fill in fields for html
        bondTemplate.find('.bond-name').text(data[i].name);
        bondTemplate.find('.bond-yield').text(data[i].yield);
        bondTemplate.find('.bond-issueDate').text(data[i].issueDate);
        bondTemplate.find('.bond-maturity').text(data[i].maturityDate);
        bondTemplate.find('.bond-price').text(data[i].price);

        //pass the data attribute fields
        //bondTemplate.find('.btn-select-bond').attr('data-id', data[i].id);
        bondTemplate.find('.btn-select-bond').attr('data-name', data[i].name);
        bondTemplate.find('.btn-select-bond').attr('data-yield', data[i].yield);
        bondTemplate.find('.btn-select-bond').attr('data-issuedate', data[i].issueDate);
        bondTemplate.find('.btn-select-bond').attr('data-maturity', data[i].maturityDate);
        bondTemplate.find('.btn-select-bond').attr('data-price', data[i].price);

        bondRow.append(bondTemplate.html());
      }
    });

    //  load EuropeanOption list here
    $.getJSON('../GSP/europeanOption.json', function(data) {
      var eoRow = $('#eoRow');
      var eoTemplate = $('#eoTemplate');

      for (i = 0; i < data.length; i ++) {
        // Fill in fields for html
        eoTemplate.find('.eo-name').text(data[i].name);
        var CallPut = "Call";
        if (data[i].isCall == true) {
          CallPut = "Call";
        } else {
          CallPut = "Put";
        }
        //eoTemplate.find('.eo-iscall').text(data[i].isCall);
        eoTemplate.find('.eo-iscall').text(CallPut);
        eoTemplate.find('.eo-underlying').text(data[i].underlying);
        eoTemplate.find('.eo-strike').text(data[i].strike);
        eoTemplate.find('.eo-expiration').text(data[i].expiration);
        eoTemplate.find('.eo-price').text(data[i].price);

        //pass the data attribute fields
        eoTemplate.find('.btn-select-eo').attr('data-name', data[i].name);
        eoTemplate.find('.btn-select-eo').attr('data-iscall', data[i].isCall);
        eoTemplate.find('.btn-select-eo').attr('data-underlying', data[i].underlying);
        eoTemplate.find('.btn-select-eo').attr('data-strike', data[i].strike);
        eoTemplate.find('.btn-select-eo').attr('data-expiration', data[i].expiration);
        eoTemplate.find('.btn-select-eo').attr('data-price', data[i].price);

        eoRow.append(eoTemplate.html());
      }
    });

    return GSPApp.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance
    if (typeof web3 !== 'undefined') {
      GSPApp.web3Provider = web3.currentProvider;
    } else {
    // If no injected web3 instance is detected, fall back to Ganache
      GSPApp.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(GSPApp.web3Provider);

    return GSPApp.initContract();
  },

  initContract: function() {
    $.getJSON('GSP.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var GSPArtifact = data;
      GSPApp.contracts.GSP = TruffleContract(GSPArtifact);

      // Set the provider for our contract
      GSPApp.contracts.GSP.setProvider(GSPApp.web3Provider);

      // Control views
      return GSPApp.viewControl();
    });

    return GSPApp.bindEvents();
  },

  bindEvents: function() {
    // handler for select bond and select option
    $(document).on('click', '.btn-select-bond', GSPApp.handleBondSelection);
    $(document).on('click', '.btn-select-eo', GSPApp.handleEOSelection);

    // handler for remove bond and remove option
    $(document).on('click', '.btn-remove-bond', GSPApp.handleBondRemoval);
    $(document).on('click', '.btn-remove-eo', GSPApp.handleEORemoval);

    // handler for using selected bond and option to create contract
    $(document).on('click', '.btn-GSP-create', GSPApp.handleGSPCreation);
    $(document).on('click', '.btn-GSP-issue', GSPApp.handleGSPIssue);

    // handler for display to created contract
    $(document).on('click', '.btn-GSP-display', GSPApp.displayGSP);

    // handler for update price
    $(document).on('click', '.btn-content-display', GSPApp.displayGSPContent);
    $(document).on('click', '.btn-update-price', GSPApp.handleUpdatePrice);

    // handler for pay contract
    $(document).on('click', '.btn-pay-contract', GSPApp.handlePayContract);

    // handler for display balance
    $(document).on('click', '.btn-GSP-balance', GSPApp.displayBalance);

    // handler for send note
    $(document).on('click', '.btn-GSP-send', GSPApp.handleGSPSend);

    // handler for user subscribe and redeem
    $(document).on('click', '.btn-view-subscribe', GSPApp.displayGSPSubscribe);
    $(document).on('click', '.btn-view-redeem', GSPApp.displayGSPRedeem);
    $(document).on('click', '.btn-GSP-subscribe', GSPApp.handleGSPSubscribe);
    $(document).on('click', '.btn-GSP-redeem', GSPApp.handleGSPRedeem);

  },

  // control what to display according to the state and user
  viewControl: function() {

    var GSPInstance;
    //var issuerColor = "#426E86";
    //var investorColor = "#F9BA32";

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      GSPApp.contracts.GSP.deployed().then(function(instance) {
        GSPInstance = instance;

        // Check if the note is issued
        return GSPInstance.getIfIssued.call();
      }).then(function(isIssued) {
          if (isIssued == true) {
            // already issued
            document.getElementById('Pre-Issuance').style.display = "none";
            document.getElementById('Post-Issuance').style.display = "";
          } else {
            // not issued
            // issuer's view only
            //document.body.style.backgroundColor = "#D6EAF8";
            //document.getElementById('menu').style.backgroundColor = "#D6EAF8";
            document.getElementById('Pre-Issuance').style.display = "";
            document.getElementById('Post-Issuance').style.display = "none";
          }
          // Check if user or issuer is using the panel
          return GSPInstance.getIssuer.call();
      }).then(function(issuer) {
          //console.log(issuer);
          if (account == issuer) {
            // issuer panel
            //document.body.style.backgroundColor = "#D6EAF8";
            //document.getElementById('menu').style.backgroundColor = issuerColor;
            document.getElementById('menu').classList.add("nav-issuer");
            //document.getElementById('issuer-menu').style.display = "";
            document.getElementById('issuer-view').style.display = "";
            //document.getElementById('investor-menu').style.display = "none";
            document.getElementById('investor-view').style.display = "none";
            document.getElementById('user').innerText = "Issuer View";
            document.getElementsByClassName('btn-GSP-display')[0].classList.add("btn-issuer");
          } else {
            // investor panel
            //document.body.style.backgroundColor = "#FDEBD0";
            //document.getElementById('menu').style.backgroundColor = investorColor;
            document.getElementById('menu').classList.add("nav-investor");
            //document.getElementById('issuer-menu').style.display = "none";
            document.getElementById('issuer-view').style.display = "none";
            //document.getElementById('investor-menu').style.display = "";
            document.getElementById('investor-view').style.display = "";
            document.getElementById('user').innerText = "Investor View";
            document.getElementsByClassName('btn-GSP-display')[0].classList.add("btn-investor");
          }
          // Always display the GSP notes created
          return GSPApp.displayGSP();
      }).then(function() {
            return GSPApp.displayBalance();
      }).catch(function(err) {
          console.log(err.message);
      });
    });
  },

  // Add bond selected into the bottom selectedBondRow
  handleBondSelection: function(event) {
    var selectedBondRow = $('#selectedBondRow');
    var bondTemplate = $('#selectedBondTemplate');

    //var bondId = parseInt($(event.target).data('id'));
    var selectedBondName = $(event.target).data('name');
    var selectedBondYield = $(event.target).data('yield');
    var selectedBondIssueDate = $(event.target).data('issuedate');
    var selectedBondMaturity = $(event.target).data('maturity');
    var selectedBondPrice = $(event.target).data('price');

    // Fill in fields for html
    bondTemplate.find('.bond-name').text(selectedBondName);
    bondTemplate.find('.bond-yield').text(selectedBondYield);
    bondTemplate.find('.bond-issueDate').text(selectedBondIssueDate);
    bondTemplate.find('.bond-maturity').text(selectedBondMaturity);
    bondTemplate.find('.bond-price').text(selectedBondPrice);

    // Only allow one bond
    // Need to clear HTML before add
    selectedBondRow.innerHTML = "";
    selectedBondRow.append(bondTemplate.html());
  },

  // Add european option selected into the bottom EuropeanOption
  handleEOSelection: function(event) {
    var selectedEORow = $('#selectedEuropeanOptionRow');
    var EOTemplate = $('#selectedEOTemplate');

    var selectedEOName = $(event.target).data('name');
    var CallPut = "Call";
    if ($(event.target).data('iscall')==true) {
      CallPut = "Call";
    } else {
      CallPut = "Put";
    }
    var selectedEOIscall = CallPut;
    var selectedEOUnderlying = $(event.target).data('underlying');
    var selectedEOStrike = $(event.target).data('strike');
    var selectedEOExpiration = $(event.target).data('expiration');
    var selectedEOPrice = $(event.target).data('price');

    // Fill in fields for html
    EOTemplate.find('.eo-name').text(selectedEOName);
    EOTemplate.find('.eo-iscall').text(selectedEOIscall);
    EOTemplate.find('.eo-underlying').text(selectedEOUnderlying);
    EOTemplate.find('.eo-strike').text(selectedEOStrike);
    EOTemplate.find('.eo-expiration').text(selectedEOExpiration);
    EOTemplate.find('.eo-price').text(selectedEOPrice);

    // Change toggle id to a unique one
    var rand = Math.floor((Math.random() * 100) + 1);
    EOTemplate.find('.eo-long')[0].id = "eoswitch" + rand;
    EOTemplate.find('.onoffswitch-label')[0].htmlFor = "eoswitch" + rand;

    selectedEORow.append(EOTemplate.html());
  },

  // Delete bond selected from the bottom selectedBondRow
  handleBondRemoval: function(event) {

    event.currentTarget.parentNode.parentNode.parentNode.removeChild(event.currentTarget.parentNode.parentNode);

  },

  handleEORemoval: function(event) {

    event.currentTarget.parentNode.parentNode.parentNode.removeChild(event.currentTarget.parentNode.parentNode);
  },

  handleGSPCreation: function(event) {

    event.preventDefault();

    var offset = new Date().getTimezoneOffset()*60*1000;
    var noteName = document.getElementById('noteName').value;
    var noteIssueDate = (Date.parse(document.getElementById('noteIssueDate').value)+offset)/1000;
    var noteMaturityDate = (Date.parse(document.getElementById('noteMaturityDate').value)+offset)/1000;
    //console.log(offset);
    //console.log(noteIssueDate);
    //console.log(noteMaturityDate);
    var noteCommission = web3.toWei(document.getElementById('noteCommission').value, 'ether');
    var amountIssue = document.getElementById('noteAmount').value;

    // Bond Information
    var selectedBondRow = $('#selectedBondRow');
    var bondName = selectedBondRow.find('.bond-name').text();
    var bondIssueDateInUnixTimestamp = Date.parse(selectedBondRow.find('.bond-issueDate').text())/ 1000;
    var bondMaturityInUnixTimestamp  = Date.parse(selectedBondRow.find('.bond-maturity').text())/ 1000;
    var bondYld = web3.toWei(selectedBondRow.find('.bond-yield').text(), 'ether');
    var bondPrice = web3.toWei(selectedBondRow.find('.bond-price').text(), 'ether');
    var bondContractSize = document.getElementsByClassName("bond-size")[0].value;
    var bondLong = document.getElementsByClassName("bond-long")[0].checked;
    //console.log(bondLong);

    // EO Information
    var selectedEORow = $('#selectedEuropeanOptionRow');
    var eoName=[];
    for (i = 0; i < selectedEORow.find('.eo-name').length; i++) {
      eoName.push(selectedEORow.find('.eo-name')[i].innerText);
    }
    var eoIsCall=[];
    for (i = 0; i < selectedEORow.find('.eo-iscall').length; i++) {
      var temp = selectedEORow.find('.eo-iscall')[i].innerText;
      var isCall = (temp === "Call");
      eoIsCall.push(isCall);
    }
    var eoUnderlying = [];
    for (i = 0; i < selectedEORow.find('.eo-underlying').length; i++) {
      eoUnderlying.push(selectedEORow.find('.eo-underlying')[i].innerText);
    }
    var eoStrike = [];
    for (i = 0; i < selectedEORow.find('.eo-strike').length; i++) {
      eoStrike.push(web3.toWei(parseFloat(selectedEORow.find('.eo-strike')[i].innerText), 'ether'));
    }
    var eoExpiration = [];
    for (i = 0; i < selectedEORow.find('.eo-expiration').length; i++) {
      eoExpiration.push(Date.parse(selectedEORow.find('.eo-expiration')[i].innerText)/1000);
    }
    var eoPrice = [];
    for (i = 0; i < selectedEORow.find('.eo-price').length; i++) {
      eoPrice.push(web3.toWei(parseFloat(selectedEORow.find('.eo-price')[i].innerText), 'ether'));
    }
    var eoContractSize = [];
    for (i = 0; i < selectedEORow.find('.eo-size').length; i++) {
      eoContractSize.push(parseFloat(selectedEORow.find('.eo-size')[i].value));
    }
    var eoLong = [];
    for (i = 0; i < selectedEORow.find('.eo-long').length; i++) {
      //console.log(selectedEORow.find('.eo-long')[i].checked);
      eoLong.push(selectedEORow.find('.eo-long')[i].checked);
    }

    //test value
    //var bondName = "cad 5 year";
    //var bondIssueDate = new Date('2018-07-01');
    //var bondIssueDateInUnixTimestamp = bondIssueDate / 1000;
    //var bondMaturity = new Date('2023-07-01');
    //var bondMaturityInUnixTimestamp = bondMaturity / 1000;
    //var bondYld = 2.08;
    //var bondPrice = web3.toWei(90, 'ether');
    //var bondContractSize = web3.toWei(1, 'ether');
    //var bondLong = true;
    //var eoName = ["Bitcoin 8000 Call","SPY 300 Call"];
    //var eoIsCall = [true,false];
    //var eoUnderlying = ["Bitcoin","SPY"]; //array.push()
    //var eoStrike = [10000,2500];
    //var eoExpiration = ["2023-07-01","2023-07-01"];
    //var eoPrice = [0.5,1]; // for 1 or for 100 shares?
    //var eoContractSize = [10,5];
    //var eoLong = [true,true];

    var GSPInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      GSPApp.contracts.GSP.deployed().then(function(instance) {
        GSPInstance = instance;
        // Issue GSP note
        // Execute newIssue1/2/3 as a transaction by sending account
        return GSPInstance.newIssue1AddBond(bondName,
                                            bondIssueDateInUnixTimestamp,
                                            bondMaturityInUnixTimestamp,
                                            bondYld,
                                            bondPrice,
                                            bondContractSize,
                                            bondLong,
                                            {from: account, gas:3000000});
      }).then(function() {
        // console.log(bondName);
        // console.log(bondIssueDateInUnixTimestamp);
        // console.log(bondMaturityInUnixTimestamp);
        // console.log(bondYld);
        // console.log(bondPrice);
        // console.log(bondContractSize);
        // console.log(bondLong);
        return GSPInstance.newIssue2AddEuropeanOptions(eoName,
                                                      eoIsCall,
                                                      eoUnderlying,
                                                      eoStrike,
                                                      eoExpiration,
                                                      eoPrice,
                                                      eoContractSize,
                                                      eoLong,
                                                      {from: account, gas:3000000});
      }).then(function() {
        // console.log(eoName);
        // console.log(eoIsCall);
        // console.log(eoUnderlying);
        // console.log(eoStrike);
        // console.log(eoExpiration);
        // console.log(eoPrice);
        // console.log(eoContractSize);
        // console.log(eoLong);
        return GSPInstance.newIssue3(noteName,
                                    noteIssueDate,
                                    noteMaturityDate,
                                    noteCommission,
                                    amountIssue,
                                    {from: account, gas:3000000});
      }).then(function() {
        // console.log(noteName);
        // console.log(noteIssueDate);
        // console.log(noteMaturityDate);
        // console.log(noteCommission);
        // console.log(amountIssue);

        // Reload window to change view
        location.reload();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  handleGSPIssue: function(event) {

    event.preventDefault();
    var amountIssue = document.getElementById('noteAmountAdditional').value;

    var GSPInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      GSPApp.contracts.GSP.deployed().then(function(instance) {
        GSPInstance = instance;

        // Issue GSP note
        return GSPInstance.additionalIssue(amountIssue,{from: account, gas:300000});
      }).then(function(name) {
          document.getElementById('noteAmountAdditional').value = "";
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  displayGSP: function() {

    var GSPInstance;
    //moment.tz.add(PackedZoneString);
    //moment.tz.add('America/New_York|EST EDT|50 40|0101|1Lz50 1zb0 Op0');
    GSPApp.contracts.GSP.deployed().then(function(instance) {
      GSPInstance = instance;

      return GSPInstance.getNoteName.call();
    }).then(function(name) {
        var nameString = web3.toUtf8(name);
        //console.log(nameString);
        document.getElementById("note-name").innerText = nameString;
        // Display different chart according to the name
        if (nameString.includes("NPPN", 0)) {
          $("#payoff").attr("src", "GSP/NPPN payoff.JPG");
        } else {
          $("#payoff").attr("src", "GSP/PPN payoff.JPG");
        }
        return GSPInstance.getIssuer.call();
    }).then(function(issuer) {
        //console.log(issuer);
        document.getElementById("note-issuer").innerText = issuer;
        return GSPInstance.getOutstanding.call();
    }).then(function(outstanding) {
        //console.log(outstanding.toNumber());
        document.getElementById("note-outstanding").innerText = outstanding.toNumber();
        if (outstanding.toNumber()>0) {
          document.getElementById("payoff").style.display = "";
        }
        return GSPInstance.getNAV.call();
    }).then(function(nav) {
        //console.log(nav.toNumber());
        document.getElementById("note-nav").innerText = web3.fromWei(nav.toNumber(), 'ether');
        return GSPInstance.getIssueDate.call();
    }).then(function(issueDate) {
        //console.log(issueDate.toNumber());
        document.getElementById("note-issuedate").innerText = moment(issueDate.toNumber()*1000).format("MM-DD-YYYY");
        return GSPInstance.getMaturity.call();
    }).then(function(maturityDate) {
        //console.log(maturityDate.toNumber());
        document.getElementById("note-maturitydate").innerText = moment(maturityDate.toNumber()*1000).format("MM-DD-YYYY");
    }).catch(function(err) {
        console.log(err.message);
    });

  },

  displayGSPContent: function() {

    var GSPInstance;

    GSPApp.contracts.GSP.deployed().then(function(instance) {
      GSPInstance = instance;

      return GSPInstance.getBond.call();
    }).then(function(result) {
        //bondName, contractSize, isLong, bondPrice
        document.getElementById("GSP-bond").style.display = "";
        //console.log(web3.fromWei(result[3].toNumber(), 'ether'));

        var bondRow = $('#GSPbondRow');
        var bondTemplate = $('#GSPbondTemplate');
        //Display Bond Information
        bondTemplate.find('.bond-name').text(web3.toUtf8(result[0].toString()));
        bondTemplate.find('.bond-size').text(result[1].toString());
        var bondLongShort;
        if (result[2].toString() == "true") {
          bondLongShort = "Long";
        } else {
          bondLongShort = "Short";
        }
        bondTemplate.find('.bond-long').text(bondLongShort);
        //bondTemplate.find('.bond-oldprice').text(web3.fromWei(result[3].toNumber(), 'ether'));
        bondRow.append(bondTemplate.html());

        return GSPInstance.getEuropeanOption.call();
    }).then(function(result) {
        //bytes32[] memory eoName,uint[] eoContractSize,bool[] eoIsLong,uint[] eoPrice
        document.getElementById("GSP-eo").style.display = '';
        //console.log(web3.fromWei(result[3][0].toNumber(), 'ether'));

        var eoRow = $('#GSPeoRow');
        var eoTemplate = $('#GSPeoTemplate');

        for (i = 0; i < result[0].length; i ++) {
            eoTemplate.find('.eo-name').text(web3.toUtf8(result[0][i].toString()));
            eoTemplate.find('.eo-size').text(result[1][i].toString());
            var eoLongShort;
            if (result[2][i].toString() == "true") {
              eoLongShort = "Long";
            } else {
              eoLongShort = "Short";
            }
            eoTemplate.find('.eo-long').text(eoLongShort);
            //eoTemplate.find('.eo-oldprice').text(web3.fromWei(result[3][i].toNumber(), 'ether'));
            eoRow.append(eoTemplate.html());
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

    //var bondName = $('#GSPbondRow').find('.bond-name').text();
    var bondPrice = web3.toWei($('#GSPbondRow').find('.bond-price')[0].value, 'ether');

    var eoName=[];
    var eoPrice=[];
    //console.log($('#GSPeoRow').find('.eo-name').length);
    for (i = 0; i < $('#GSPeoRow').find('.eo-name').length; i ++) {
        eoName.push($('#GSPeoRow').find('.eo-name')[i].innerText);
        eoPrice.push(web3.toWei(parseFloat($('#GSPeoRow').find('.eo-price')[i].value), 'ether'));
    }
    //console.log(eoName);
    //console.log(eoPrice);

    var GSPInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      GSPApp.contracts.GSP.deployed().then(function(instance) {
        GSPInstance = instance;

        // Issue GSP note
        return GSPInstance.updatePrice(bondPrice,eoName,eoPrice,{from: account, gas:300000});
      }).then(function(success) {
          // Change button displayed
          $('.btn-content-display')[0].style.display = '';
          $('.btn-update-price')[0].style.display = 'none';
          document.getElementById("GSP-bond").style.display = 'none';
          document.getElementById("GSP-eo").style.display = 'none';
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  handlePayContract: function(event) {

    event.preventDefault();

    var amountPay = web3.toWei(document.getElementById('pay-contract').value, 'ether');
    var GSPInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      GSPApp.contracts.GSP.deployed().then(function(instance) {
        GSPInstance = instance;

        // Pay
        return GSPInstance.payContract({from: account, gas:300000, value:amountPay});
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  displayBalance: function() {

    var GSPInstance;

    GSPApp.contracts.GSP.deployed().then(function(instance) {
      GSPInstance = instance;
      //console.log(GSPInstance);

      return GSPInstance.getNoteBalance.call();
    }).then(function(balance) {
        //console.log(balance);
        document.getElementById("note-balance").innerText = balance.toNumber();
        return GSPInstance.getContractETHBalance.call();
    }).then(function(ETHbalance) {
        console.log("Contract has ETH:" + ETHbalance);
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleGSPSend: function(event) {

    event.preventDefault();
    var amountSend = document.getElementById('noteAmountSend').value;
    var addressSend = document.getElementById('addressSend').value;
    var GSPInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      GSPApp.contracts.GSP.deployed().then(function(instance) {
        GSPInstance = instance;

        // User Send
        return GSPInstance.sendNote(addressSend,amountSend,{from: account, gas:3000000});
      }).then(function(sufficient) {
          console.log(sufficient);
          document.getElementById("noteAmountSend").value = "";
          document.getElementById("addressSend").value = "";
          document.getElementById("send-status").innerText = "Note sent successfully.";
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  displayGSPSubscribe: function(event) {

    var amountSubscribe = document.getElementById('noteAmountSubscribe').value;

    var GSPInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      GSPApp.contracts.GSP.deployed().then(function(instance) {
        GSPInstance = instance;

        // View User Subscribe Payable
        return GSPInstance.userGetSubscribePayable.call(amountSubscribe);
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

  displayGSPRedeem: function(event) {

    var amountRedeem = document.getElementById('noteAmountRedeem').value;

    var GSPInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      GSPApp.contracts.GSP.deployed().then(function(instance) {
        GSPInstance = instance;

        // View User Redeem Receivable
        return GSPInstance.userGetRedeemReceivable.call(amountRedeem);
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

  handleGSPSubscribe: function(event) {

    event.preventDefault();
    var amountSubscribe = document.getElementById('noteAmountSubscribe').value;

    var GSPInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      GSPApp.contracts.GSP.deployed().then(function(instance) {
        GSPInstance = instance;

        // User Subscribe
        return GSPInstance.userGetSubscribePayable.call(amountSubscribe);
      }).then(function(ETHpayable) {
          //console.log(ETHpayable.toString());
          document.getElementById("eth-subscribe").innerText = web3.fromWei(ETHpayable.toNumber(), 'ether');
          return GSPInstance.userSubscribe(amountSubscribe,
            {from: account, gas:300000, value:ETHpayable.toNumber()});
      }).then(function(success) {
          document.getElementById('noteAmountSubscribe').value="";
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

  handleGSPRedeem: function(event) {

    event.preventDefault();
    var amountRedeem = document.getElementById('noteAmountRedeem').value;

    var GSPInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      GSPApp.contracts.GSP.deployed().then(function(instance) {
        GSPInstance = instance;

        // User Redeem
        return GSPInstance.userRedeem(amountRedeem,{from: account, gas:300000});
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
//     GSPApp.init();
//   });
// });
