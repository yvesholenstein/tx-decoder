const abiJson = '[{"inputs": [{"internalType": "address","name": "_logic","type": "address"},{"internalType": "bytes","name": "_data","type": "bytes"}],"stateMutability": "payable","type": "constructor"},{"anonymous": false,"inputs": [{"indexed": false,"internalType": "address","name": "previousAdmin","type": "address"},{"indexed": false,"internalType": "address","name": "newAdmin","type": "address"}],"name": "AdminChanged","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "beacon","type": "address"}],"name": "BeaconUpgraded","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "implementation","type": "address"}],"name": "Upgraded","type": "event"},{"stateMutability": "payable","type": "fallback"},{"stateMutability": "payable","type": "receive"}]';

const abi = JSON.parse(abiJson);
console.log('ABI items:', abi.map(item => ({ type: item.type, name: item.name })));

const functions = abi.filter(item => item.type === 'function');
console.log('Functions count:', functions.length);

const hasFallbackOrReceive = abi.some(item => item.type === 'fallback' || item.type === 'receive');
console.log('Has fallback/receive:', hasFallbackOrReceive);

const shouldWarn = functions.length === 0 && hasFallbackOrReceive;
console.log('Should show warning:', shouldWarn);
