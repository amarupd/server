const config = {
    server: 'AMAR\\AMARDUTT',
    // server: "192.168.1.43",
    // server: 'DESKTOP-9PUG3BB',//
    // server:"PIYUSH_SINGH\\PIYUSH",
    // server:'erpsvr',
    // server:'DESKTOP-U57CKVJ',
    // server:'192.168.2.2',
    // server:"136.232.69.114",
    // server:"192.168.45.219",
    // sever:"",
    // server:"ERPSRV\\SQLEXPRESS",
    user:'sa',
    // password:'R00t@321',
    password:'amar',
    // password:"piyush",
    port:1433,
    database: 'Icsoft',
    // database: 'AEAPL',
    // database:'IcSoft',`
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