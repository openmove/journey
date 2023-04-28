/*

OTP CONFIG DOCS

http://docs.opentripplanner.org/en/dev-1.x/Configuration/#graph-build-configuration

original: https://gist.github.com/stefanocudini/2e6675b145e8938e8967d4f036959c93
usage:
	cat config.template.yml | VAR1=test node envtmpl.js > config.valued.yml
*/

//const defLang = require('./src/i18n/default');
//TODO const defLang = require('./src/i18n/default');


const fs = require('fs')
const path = require('path')

const basepath = path.resolve(`${__dirname}/../src/i18n`);


const LANGS = ['en','de','it'];

(async () => {
  const defaultLang = require(`${basepath}/default`)

  console.log(`${basepath}/default`, defaultLang)
})()


/*for( const lang in LANGS) {


  console.log('langsList',basepath)

}*/
