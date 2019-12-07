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


class IngredientFinder {

    constructor(courseIngredients) {
        this.allIngredientName = courseIngredients.map(e => e.name);
        this.ingredientSet = new Set(this.allIngredientName);
    }

    find(ingredient) {
        if (this.ingredientSet.has(ingredient)) {
            return ingredient;
        }
        console.log(`ingredient ${ingredient} not found , try to find equivalent`);
        const matches = stringSimilarity.findBestMatch(ingredient, this.allIngredientName);
        console.log(JSON.stringify(matches.bestMatch));

        return matches.bestMatch.target;
    }

}

async function main() {



    // await getJsonMenus();

    const example = JSON.parse(require('./exampleMenu').body);

    const person_count = Number(example['#data'][0].set['root.current_week'].week_parameters.person_count);

    const courses = example['#data'][0].set['root.current_week'].courses;
    const courseIngredients = courses.condiments.split(/\s*,\s*/).map(e => {
        return {
            name: normalizeName(e),
            rayon: "condiments"
        };
    });
    courseIngredients.push({
        name: 'pain',
        rayon: "condiments"
    });

    for (const col of courses.columns) {
        for (const rayon of col.rayons) {
            const newele = getRayonComponent(rayon.components, rayon.title);
            for (const item of newele) {
                courseIngredients.push(item);
            }
        }
    }


    const ingrFinder = new IngredientFinder(courseIngredients);

    const days = example['#data'][0].set['root.current_week'].days;
    const menus = [];
    for (const day of days) {
        menus.push({
            recettes: getRecettes(day.midi.recettes, ingrFinder),
            mealTime: day.midi.midi_soir
        });
        menus.push({
            recettes: getRecettes(day.soir.recettes, ingrFinder),
            mealTime: day.soir.midi_soir
        });
    }
    // join courses and menus to determine equivalence between gram and custom unit

    const AllIngredient = {};

    for (const menu of menus) {

        for (const recette of menu.recettes) {
            for (const ingredient of recette.ingredients) {
                if (!AllIngredient[ingredient.name]) {
                    AllIngredient[ingredient.name] = [];
                }
                mergeIngredients(AllIngredient, ingredient, recette.person_count);
            }
        }
    }

    for (const ingredient of courseIngredients) {
        if (AllIngredient.hasOwnProperty(ingredient.name)) {

            const useIngredient = AllIngredient[ingredient.name];
            const message = ` ${ingredient.name} ${ingredient.gram/person_count} g or  ${ingredient.quantity/person_count}  ${ingredient.unit} =  `;
            const usage = [];
            for (const item of useIngredient) {
                usage.push(`${item.quantity} ${item.unit} `);
            }
            console.log(` ${message}  ${usage.join('+')} `);
            //if (useIngredient.length!=1 || ingredient.unit !== useIngredient[0].unit) {


            //}
        }
    }
    console.log(JSON.stringify(menus, null, 2));

}



function mergeIngredients(AllIngredient, ingredient, divisor) {

    for (const item of AllIngredient[ingredient.name]) {
        if (item.unit === ingredient.unit) {
            item.quantity += ingredient.quantity / divisor;
            return;
        }
    }
    AllIngredient[ingredient.name].push({
        name: ingredient.name,
        quantity: ingredient.quantity / divisor,
        unit: ingredient.unit
    });
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


//createDict();
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


function getIngredients(ingredientList, ingrFinder) {
    const items = [];
    for (const ing of ingredientList) {
        const tab = ing.split('&nbsp;');

        items.push({
            name: ingrFinder.find(normalizeName(tab[0])),
            quantity: Number(tab[1].match(NUMERIC_REGEXP)),
            unit: normalizeName(tab[2] || 'unité')
        })
    }
    return items;
}

function getRecettes(recettes, ingrFinder) {
    const items = [];
    for (const r of recettes) {
        items.push({
            id: r.nid,
            ingredients: getIngredients(r.field_recipe_ingredients_list, ingrFinder),
            person_count: r.field_recipe_person_count,
            type: r.field_recipe_type,
            instructions: r.field_recipe_description,
            title: r.title
        });


    }
    return items;
}
