const escpos = require('escpos');
 
// Select the adapter based on your printer type
// const device  = new escpos.USB();
// const device  = new escpos.Network('localhost');
// const device  = new escpos.Serial('/dev/usb/lp0');
 
// const options = { encoding: "GB18030" /* default */ }
// encoding is optional
 
 
function printTest(printerCfg = { address: '/dev/ttyS1' }) { 
  return new Promise((resolve, reject) => {
    const device  = new escpos.Serial(printerCfg.address);
    const printer = new escpos.Printer(device, {});

    device.open(function(error){

      if (error) {
        reject(error);
      }

      printer
      .font('a')
      .align('ct')
      .style('bu')
      .size(1, 1)
      .text('The quick brown fox jumps over the lazy dog')
      .barcode('1234567', 'EAN8')
      .qrimage('https://github.com/song940/node-escpos', function(err){
        this.cut();
        this.close();
        resolve();
      });
    });
  })
  .catch(err => {console.log("Found Error");console.log(err);})
}


async function printReceipt(data, printerCfg = { address: '/dev/ttyS1' }) { 
  return new Promise((resolve, reject) => {
    const device  = new escpos.Serial(printerCfg.address);
    const printer = new escpos.Printer(device, {});

    device.open(async function(error){

      if (error) {
        reject(error);
      }

      await printer
      .align('ct')
      .size(2,1)
      .style('B')
      .text("RECEIPT")
      .newLine()
      .size(1,1)

      if (data.operatorInfo) {
        if (data.operatorInfo.name) {
          await printer.text(data.operatorInfo.name)
        }

        if (data.operatorInfo.website) {
          await printer.text(data.operatorInfo.website)
        }

        if (data.operatorInfo.email) {
          await printer.text(data.operatorInfo.email)
        }

        if (data.operatorInfo.phone) {
          await printer.text(`tel. ${data.operatorInfo.phone}`)
        }

        if (data.operatorInfo.companyNumber) {
          await printer.text(data.operatorInfo.companyNumber)
        }

        await printer.newLine()
      }

      if (data.location) {
        const locationText = `Location: ${data.location}`
        await Promise.all(locationText.match(/.{1,50}/g).map(async(it) => {
          await printer.text(it)
        }));
        
        await printer.newLine();
      }

      await printer.text(`Customer: ${data.customer}`)
      
      await printer.text('Session:')
      await printer.text(`  ${data.session}`)

      await printer.newLine()

      await printer.text(`Time: ${data.time}`)

      await printer.text(`Direction: ${data.direction}`)

      await printer.text(`Fiat: ${data.fiat}`)

      await printer.text(`Crypto: ${data.crypto}`)

      await printer.text(`Rate: ${data.rate}`)

      await printer.newLine();

      await printer.text(`TXID: `)

      if (data.txId) {
        await printer.text(`  ${data.txId.slice(0, data.txId.length / 2)}`)

        await printer.text(`  ${data.txId.slice(data.txId.length / 2)}`)
      }

      await printer.newLine();

      const addressCpy = data.address;

      await printer.text('Address:')

      await printer.text(`  ${data.address.slice(0, Math.ceil(data.address.length / 2))}`)

      await printer.text(`  ${data.address.slice(Math.ceil(data.address.length / 2))}`)

      await printer.newLine();

      // QRcode
      await printer.qrimage(data.address, async function(err){

        if(err) {
          reject(err);
        }

        await printer.newLine();
        await printer.cut();
        await printer.close();

        resolve();

      })

    }) 

  })
  .catch(err => {console.log("Found Error");console.log(err);})
}

async function printWallet (wallet, printerCfg) {
  return new Promise((resolve, reject) => {
    const device  = new escpos.Serial(printerCfg.address);
    const printer = new escpos.Printer(device, {});

    device.open(async function(error){

      if (error) {
        reject(error);
      }

      await printer.style('B').size(2,1).text('BTC PAPER WALLET');
      await printer.newLine().size(1,1);

      await printer.text('Spend');
      await printer.text('PRIVATE KEY');

      await printer.text(wallet.privateKey.slice(0, wallet.privateKey.length / 2));
      await printer.text(wallet.privateKey.slice(wallet.privateKey.length / 2));

      // QR Code
      await printer.qrimage(wallet.privateKey, async function(err) {

        if(err) {
          reject(err);
        }

        await printer.newLine();
        await printer.cut();
        await printer.close();

        resolve();

      });

    })
  })
  .catch(err => {console.log("Found Error");console.log(err);})
}


function checkStatus () {
  return Promise.resolve('status unavailable for cashino printers')
}


module.exports = {printTest, checkStatus, printReceipt, printWallet};
