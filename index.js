const neo4j = require('neo4j-driver').v1;

const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'tressecret'));
const session = driver.session();

const request = require('request');
const stringSimilarity = require('string-similarity');

const NUMERIC_REGEXP = /[-]{0,1}[\d]*[.]{0,1}[\d]+/g;
function requestPromise(options) {

    return new Promise((callback, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                reject(error);
            }
            else {
                callback(response);
            }
        });
    })
}




async function getJsonMenus() {


    const response = await requestPromise({
        url: 'https://www.la-fabrique-a-menus.fr/backoffice/services/json',
        method: 'POST',
        form: {
            method: "pg_front.action",
            target_id: "root.current_week",
            action: 'generate',
            params: [{
                "selected_template_day": "day/7",
                "person_count": 4,
                "day_type": "MIDI_SOIR"
            }]
        }
    });

    console.log(response.body, null, 2);
    return JSON.parse(response.body);
}

async function addPerson() {
    const personName = 'Alice';
    const result = await session.run(
        'CREATE (a:Person {name: $name}) RETURN a',
        { name: personName }
    );


    const singleRecord = result.records[0];
    const node = singleRecord.get(0);

    console.log(node.properties.name);



    session.close();
    // on application exit:
    driver.close();
}



async function main() {



    // await getJsonMenus();

    const example = JSON.parse(require('./exampleMenu').body);

    const person_count = Number(example['#data'][0].set['root.current_week'].week_parameters.person_count);
    const days = example['#data'][0].set['root.current_week'].days;
    const menus = [];
    for (const day of days) {
        menus.push({
            midi: getRecettes(day.midi.recettes),
            soir: getRecettes(day.soir.recettes),
        });
    }

    const courses = example['#data'][0].set['root.current_week'].courses;
    const courseIngredients = {
        condiments: courses.condiments.split(/\s*,\s*/).map(e => {
            return {
                name: normalizeName(e),
                rayon: "condiments"
            };
        })
    };


    for (const col of courses.columns) {
        for (const rayon of col.rayons) {
            courseIngredients[rayon.title] = getRayonComponent(rayon.components, rayon.title);
        }
    }

    // join courses and menus to determine equivalence between gram and custom unit

    const AllIngredient = {};

    for (const menu of menus) {
        getAllIngredientFromMenu(menu.midi, AllIngredient);
        getAllIngredientFromMenu(menu.soir, AllIngredient);
    }

    const extraCourses = [];

    for (const rayon in courseIngredients) {
        for (const ingredient of courseIngredients[rayon]) {
            if (AllIngredient.hasOwnProperty(ingredient.name)) {
                AllIngredient[ingredient.name].push(ingredient);
            } else {
                extraCourses.push(ingredient);
                console.log(ingredient.name + " is not in recipes !");
            }

        }
    }

    let extraMenu = [];
    for (const ingredient in AllIngredient) {
        let isCourseOK = false;
        for (const item of AllIngredient[ingredient]) {
            if (item.rayon) {
                isCourseOK = true;
            }
        }
        if (!isCourseOK) {
            extraMenu.push(ingredient);
        }
    }

    for (ingredient of extraCourses) {
        const matches = stringSimilarity.findBestMatch(ingredient.name, extraMenu);
        console.log(matches.bestMatch);

        if (matches.bestMatch.rating > 0.5) {
            AllIngredient[matches.bestMatch.target].push(ingredient);
        }
        extraMenu = extraMenu.filter((value, index, arr) => {

            return value !== matches.bestMatch.target;

        });
    }

    let allNames = Object.keys(AllIngredient).filter(w => {

        return !extraMenu.includes(w);
    });

    for (ingredient of extraMenu) {
        const matches = stringSimilarity.findBestMatch(ingredient, allNames);
        console.log(JSON.stringify(matches.bestMatch));

    }

    console.log(JSON.stringify(menus, null, 2));

}


function getAllIngredientFromMenu(menu, AllIngredient) {
    for (const recettes of menu) {
        for (const ingredient of recettes.ingredients) {
            if (!AllIngredient[ingredient.name]) {
                AllIngredient[ingredient.name] = [];
            }
            mergeIngredients(AllIngredient, ingredient, recettes.person_count);
        }
    }
}

function mergeIngredients(AllIngredient, ingredient, divisor) {

    for (const item of AllIngredient[ingredient.name]) {
        if (item.unit === ingredient.unit) {
            item.quantity += 4 * ingredient.quantity / divisor;
            return;
        }
    }
    AllIngredient[ingredient.name].push({
        name: ingredient.name,
        quantity: 4 * ingredient.quantity / divisor,
        unit: ingredient.unit
    });
}

function createDict() {

    const expat = require('node-expat')
    const fs = require('fs');

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
                lemmes[oneLemme.plural] = oneLemme.singular;
            } else {
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
            } else {
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




    const xmlData = fs.createReadStream('dela-fr-public-u8.dic.xml', { encoding: 'utf8' });
    xmlData.pipe(p);


    console.log("end");



}

const dicoPlurals = require('./dico.json');
function normalizeName(s) {

    const words = s.split(/\s+/);
    const result = [];
    for (const word of words) {
        const key = word.toLowerCase().replace(/œ/g, 'oe');
        result.push(dicoPlurals[key] || key);
    }
    return result.join(' ');
}



main().catch(e => console.error(e));


function getMeasure(quantity) {
    if (typeof quantity === 'number') {
        return quantity;
    }
    return Number(quantity.split('&nbsp;')[0].match(NUMERIC_REGEXP));
}



function getRayonComponent(components, rayon) {
    const items = [];
    for (const c of components) {

        const tab = getMeasure(c.quantity);
        items.push({
            gram: c.gram,
            name: normalizeName(c.id),
            quantity: tab,
            unit: normalizeName(c.measure.measure),
            rayon
        })
    }
    return items;
}


function getIngredients(ingredientList) {
    const items = [];
    for (const ing of ingredientList) {
        const tab = ing.split('&nbsp;');

        items.push({
            name: normalizeName(tab[0]),
            quantity: Number(tab[1].match(NUMERIC_REGEXP)),
            unit: normalizeName(tab[2] || 'unité')
        })
    }
    return items;
}

function getRecettes(recettes) {
    const items = [];
    for (const r of recettes) {
        items.push({
            id: r.nid,
            ingredients: getIngredients(r.field_recipe_ingredients_list),
            person_count: r.field_recipe_person_count,
            type: r.field_recipe_type,
            instructions: r.field_recipe_description,
            title: r.title
        });


    }
    return items;
}
