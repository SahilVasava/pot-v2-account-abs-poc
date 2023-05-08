let accounts: any = null;

if (typeof window !== 'undefined') {
  // Import the library only if the code is running in the browser
  accounts = require('@zerodevapp/sdk/dist/src/accounts');
}

export default accounts;
