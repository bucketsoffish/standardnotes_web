process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const https = require('https');

const BASE_URL = 'somedomain.tld';
const PORT = 443;
// const BASE_URL = '3.80.219.16';
// const PORT = 63443;
const TEST_ENDPOINT = '/v1/users';

const randomString = (length = 10) => {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const sendRequest = () => {
	const email = `${randomString()}@example.com`;
	const identifier = randomString();
	// const email = 'cooluser';
	// const identifier = 'cooluser';
	const requestBody = JSON.stringify({
	  api: '20200115',
	  password: '0e3eb906710abe18c770665c5d40dfffb5a09f7e72d38e9c65de6c3550a2091d',
	  email: email,
	  regToken: 'QJbH6GiEFDU7xSfNSbPD4e',
	  ephemeral: false,
	  identifier: identifier,
	  pw_nonce: 'f6cfb09921f45f837b0bf40b5347aede3e2f0d6e9d21c32af0e60b2c422488c5',
	  version: '004',
	  origination: 'registration',
	  created: '1679672270328',
	});
  
	const requestOptions = {
	  hostname: BASE_URL,
	  port: PORT,
	  path: TEST_ENDPOINT,
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/json',
		'Content-Length': Buffer.byteLength(requestBody),
	  },
	};
  
	return new Promise((resolve, reject) => {
	  const req = https.request(requestOptions, res => {
		console.log('Request status code:', res.statusCode);
		let responseData = '';
  
		res.on('data', chunk => {
		  responseData += chunk;
		});
  
		res.on('end', () => {
		  try {
			const jsonResponse = JSON.parse(responseData);
			console.log('JSON response:', jsonResponse);
			resolve();
		  } catch (error) {
			console.error('Error parsing JSON response:', error.message);
			reject(error);
		  }
		});
	  });
  
	  req.on('error', error => {
		console.error('Request failed:', error.message);
		reject(error);
	  });
  
	  req.write(requestBody);
	  req.end();
	});
  };

const getRandomInt = (min, max) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  const runTest = async () => {
	const numberOfBursts = 100;
	console.log(`Sending ${numberOfBursts} bursts of requests to ${BASE_URL}:${PORT}${TEST_ENDPOINT}`);
	for (let i = 0; i < numberOfBursts; i++) {
	  const burstSize = getRandomInt(100, 500);
	  console.log(`Sending burst #${i + 1} with ${burstSize} requests`);
	  for (let j = 0; j < burstSize; j++) {
		sendRequest();
	  }
	  const interval = getRandomInt(500, 1000);
	  await new Promise((resolve) => setTimeout(resolve, interval));
	}
  };

runTest();
