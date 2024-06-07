// const data = await fs.readFile('./config.json');
const configuration=require("./configuration.json")
const port=configuration.port
// const configuration = JSON.parse(data);
const config = {
    server: 'AMAR\\AMARDUTT',
    // server: "192.168.1.43",
    // server: 'DESKTOP-9PUG3BB',//
    // server:"PIYUSH_SINGH\\PIYUSH",
    // server:`${configuration.server}`,// aeapl
    // server:'erpsvr',
    // server:'DESKTOP-U57CKVJ',
    // server:'192.168.2.2',
    // server:"192.168.45.219",
    // server:"192.168.0.56",// kipl  ip
    // server:"ERPSRV\\SQLEXPRESS",
    user:"sa",//`${configuration.user}`,
    // password:`${configuration.password}`,
    // password:"P@ssw0rd", // kipl password
    password:'amar',
    // password:"piyush",
    port:port,
    database: 'Icsoft',
    // database: 'AEAPL',
    // database:`${configuration.database}`,
    driver: 'msnodesqlv8',
    options: {
      trustedConnection: true,
      // encrypt:true,
      trustServerCertificate: true,
      // enableSNI: false,
      // secureOptions: require('constants').SSL_OP_NO_TLSv1_2,
    },
  };

  module.exports = config;