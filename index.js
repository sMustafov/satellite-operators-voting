const contractAddress ='ct_267G1eQqZcTAwEQeadv8doAFxoqUvpJC5eb6Z6vimfcegD4C6N';
var client = null;
var operatorArray = [];
var operatorsLength = 0;

function renderOperators() {
  operatorArray = operatorArray.sort(function(a,b){return b.votes-a.votes})
  var template = $('#template').html();
  Mustache.parse(template);
  var rendered = Mustache.render(template, {operatorArray});
  $('#operatorBody').html(rendered);
}

async function callStatic(func, args, types) {
  const calledGet = await client.contractCallStatic(contractAddress,
  'sophia-address', func, {args}).catch(e => console.error(e));

  const decodedGet = await client.contractDecodeData(types,
  calledGet.result.returnValue).catch(e => console.error(e));

  return decodedGet;
}

async function contractCall(func, args, value, types) {
  const calledSet = await client.contractCall(contractAddress, 'sophia-address',
  contractAddress, func, {args, options: {amount:value}}).catch(async e => {
    const decodedError = await client.contractDecodeData(types,
    e.returnValue).catch(e => console.error(e));
  });

  return
}


window.addEventListener('load', async () => {
  $("#loader").show();

  client = await Ae.Aepp();

  const getOperatorsLength = await callStatic('getOperatorsLength','()','int');
  operatorsLength = getOperatorsLength.value;

  for (let i = 1; i <= operatorsLength; i++) {
    const operator = await callStatic('getOperator',`(${i})`,'(address, string, int, int, int)');

    operatorArray.push({
      operatorName: operator.value[1].value,
      operatorAltitude : operator.value[2].value,
      operatorLag: operator.value[3].value,
      operatorLng: operator.value[4].value,
      votes: operator.value[5].value,
      index: i,
    })
  }

  renderOperators();

  $("#loader").hide();
});

jQuery("#operatorBody").on("click", ".voteBtn", async function(event){
  $("#loader").show();

  const value = $(this).siblings('input').val();
  const dataIndex = event.target.id;

  await contractCall('voteOperator',`(${dataIndex})`,value,'(int)');

  const foundIndex = operatorArray.findIndex(operator => operator.index == dataIndex);
  operatorArray[foundIndex].votes += parseInt(value, 10);

  renderOperators();

  $("#loader").hide();
});

$('#registerBtn').click(async function(){
  $("#loader").show();

  const name = ($('#operatorName').val()),
        altitude = ($('#operatorAltitude').val())
        lag = ($('#operatorLag').val())
        lng = ($('#operatorLng').val());

  await contractCall('registerOperator',`("${name}","${altitude}","${lag}","${lng}")`, 0,'(int)');

  operatorArray.push({
    operatorName: name,
    operatorAltitude : altitude,
    operatorLag: lag,
    operatorLng: lng,
    votes: 0,
    index: operatorArray.length + 1
  })

  renderOperators();

  $("#loader").hide();
});
