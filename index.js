const neo4j = require('neo4j-driver').v1;

const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'tressecret'));
const session = driver.session();

const request = require('request');

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


    const days = example['#data'][0].set['root.current_week'].days;
    const menus = [];
    for (const day of days) {
        menus.push({
            midi: getRecettes(day.midi.recettes),
            soir: getRecettes(day.soir.recettes),
        });
    }
    console.log(JSON.stringify(menus, null, 2));

}


main().catch(e => console.error(e));

function getIngredients(ingredientList){
    const items=[];
    for (const ing of ingredientList){
        const tab=ing.split('&nbsp;');
        items.push({
            name : tab[0],
            quantity : tab[1],
            unit : tab[2]
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
            title : r.title
        });


    }
    return items;
}
