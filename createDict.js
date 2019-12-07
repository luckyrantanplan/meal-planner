function createDict() {
    const expat = require('node-expat');
    const fs = require('fs');
    const zlib = require('zlib');
    const p = expat.createParser();
    let startTags = 0;
    let endTags = 0;
    let toBeCaptured = false;
    let captureText = "";
    const lemmes = {};
    let featNumber = "";
    let oneLemme = {};
    let captureLemma = false;
    let lemmaCurrent = "";
    p.on('startElement', (name, attrs) => {
        if (name === "lemma") {
            captureLemma = true;
        }
        if (name === 'pos' && attrs.name && attrs.name === "noun") {
            toBeCaptured = true;
        } //<feat name='number' value='masculine'/>
        if (name === 'feat' && attrs.name === 'number') {
            featNumber = attrs.value;
        }
        startTags++;
    });
    p.on('endElement', (name) => {
        if (name === "lemma") {
            captureLemma = false;
        }
        if (toBeCaptured && name === "inflected") {
            oneLemme[featNumber] = captureText;
        }
        if (name === "entry") {
            toBeCaptured = false;
            if (oneLemme.hasOwnProperty('singular')) {
                if (oneLemme.plural !== oneLemme.singular) {
                    lemmes[oneLemme.plural] = oneLemme.singular;
                }
            }
            else if (oneLemme.plural !== lemmaCurrent) {
                lemmes[oneLemme.plural] = lemmaCurrent;
            }
            oneLemme = {};
        }
        endTags++;
    });
    p.on('text', function (text) {
        if (captureLemma) {
            lemmaCurrent = text.trim();
        }
        if (toBeCaptured && text.trim() !== "") {
            if (/^[A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(text.trim())) {
                captureText = text.trim();
            }
            else {
                toBeCaptured = false;
            }
        }
    });
    p.on('end', () => {
        fs.writeFileSync('./dico.json', JSON.stringify(lemmes, null, 0));
        console.log('ended');
    });
    p.on('close', () => {
        console.log('closed');
    });
    p.on('error', function (error) {
        assert.fail('Error', error);
    });
    const xmlData = fs.createReadStream('dela-fr-public-u8.dic.xml.gz');
    xmlData.pipe(zlib.createGunzip()).pipe(p);
    console.log("end");
}

module.exports = createDict;