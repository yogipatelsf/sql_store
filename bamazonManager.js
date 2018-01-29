var inquirer = require('inquirer');
var mysql = require('mysql');

// Define the MySQL connection parameters
var con = mysql.createConnection({
    host: 'localhost',
    port: 3306,

    // Your username
    user: 'root',

    // Your password
    password: '',
    database: 'bamazon'
});

// console.log("connection", connection);
con.connect(function(err) {
    if (err) throw err;
    console.log('connect as ID: ', con.threadId);

});

// promptManagerAction will present menu options to the manager and trigger appropriate logic
function promptManager() {

    // Prompt the manager to select an option
    inquirer.prompt([
        {
            type: 'list',
            name: 'option',
            message: 'Please select an option:',
            choices: ['View Products for Sale', 'View Low Inventory', 'Add to Inventory', 'Add New Product'],
            filter: function (val) {
                if (val === 'View Products for Sale') {
                    return 'sale';
                } else if (val === 'View Low Inventory') {
                    return 'lowInventory';
                } else if (val === 'Add to Inventory') {
                    return 'addInventory';
                } else if (val === 'Add New Product') {
                    return 'newProduct';
                }
            }
        }
    ]).then(function(input) {

        // Trigger the appropriate action based on the user input
        if (input.option ==='sale') {
            displayInventory();
        } else if (input.option === 'lowInventory') {
            displayLowInventory();
        } else if (input.option === 'addInventory') {
            addInventory();
        } else if (input.option === 'newProduct') {
            createNewProduct();
        }


    })
}

// displayInventory will retrieve the current inventory from the database and output it to the console
function displayInventory() {

    // Construct the db query string
    queryInv = 'SELECT * FROM products';

    // Make the db query
    con.query(queryInv, function(err, data) {
        if (err) throw err;

        console.log('Existing Inventory: ');
        console.log('...................\n');

        var crypto = '';
        for (var i = 0; i < data.length; i++) {
            crypto = '';
            crypto += 'Item ID: ' + data[i].item_id + '  //  ';
            crypto += 'Product Name: ' + data[i].product_name + '  //  ';
            crypto += 'Department: ' + data[i].department_name + '  //  ';
            crypto += 'Price: $' + data[i].price_USD + '  //  ';
            crypto += 'Quantity: ' + data[i].stock_quantity + '\n';

            console.log(crypto);


        }

        console.log("...................\n");
        promptManager();

    })
}

// displayLowInventory will display a list of products with the available quantity below 100
function displayLowInventory() {

    // Construct the db query string
    queryInv = 'SELECT * FROM products WHERE stock_quantity < 100';

    // Make the db query
    con.query(queryInv, function(err, data) {
        if (err) throw err;

        console.log('Low Inventory Items (below 100): ');
        console.log('................................\n');

        var crypto = '';
        for (var i = 0; i < data.length; i++) {
            crypto = '';
            crypto += 'Item ID: ' + data[i].item_id + '  //  ';
            crypto+= 'Product Name: ' + data[i].product_name + '  //  ';
            crypto += 'Department: ' + data[i].department_name + '  //  ';
            crypto += 'Price: $' + data[i].price_USD + '  //  ';
            crypto += 'Quantity: ' + data[i].stock_quantity + '\n';

            console.log(crypto);

        }

        console.log("................................\n");
        promptManager();


    })
}

// positiveInteger makes sure that the user is supplying only positive integers for their inputs
function positiveInteger(value) {
    var sign = Math.sign(value);

    if (sign === 1) {
        return true;
    } else {
        return 'Please enter a positive number for quantity.';
    }
}

// positiveNumeric makes sure that the user is supplying only positive numbers for their inputs
function positiveNumeric(value) {
    // Value must be a positive number
    var positive = parseFloat(value) > 0;

    if (positive) {
        return true;
    } else {
        return 'Please enter a positive number for the unit price.'
    }
}

// addInventory will guide a user in adding additional quantity to an existing item
function addInventory() {

    // Prompt the user to select an item
    inquirer.prompt([
        {
            type: 'input',
            name: 'item_id',
            message: 'Please enter the Item ID for stock_count update.',
            validate: positiveInteger,
            filter: Number
        },
        {
            type: 'input',
            name: 'quantity',
            message: 'How many would you like to add?',
            validate: positiveInteger,
            filter: Number
        }
    ]).then(function(input) {

        var item = input.item_id;
        var addQuantity = input.quantity;

        // Query db to confirm that the given item ID exists and to determine the current stock_count
        var queryInv = 'SELECT * FROM products WHERE ?';

        con.query(queryInv, {item_id: item}, function(err, data) {
            if (err) throw err;

            // If the user has selected an invalid item ID, data array will be empty

            if (data.length === 0) {
                console.log('ERROR: Invalid Item ID. Please select a valid Item ID.');
                addInventory();

            } else {
                var productData = data[0];


                console.log('Updating Inventory...');

                // Construct the updating query string
                var updateQueryInv = 'UPDATE products SET stock_quantity = ' + (productData.stock_quantity + addQuantity) + ' WHERE item_id = ' + item;

                // Update the inventory
                con.query(updateQueryInv, function(err, data) {
                    if (err) throw err;

                    console.log('Stock count for Item ID ' + item + ' has been updated to ' + (productData.stock_quantity + addQuantity) + '.');
                    console.log("\n---------------------------------------------------------------------\n");

                    promptManager();
                })
            }
        })
    })
}

// createNewProduct will guide the user in adding a new product to the inventory
function createNewProduct() {

    // Prompt the user to enter information about the new product
    inquirer.prompt([
        {
            type: 'input',
            name: 'product_name',
            message: 'Please enter the new product name.',
        },
        {
            type: 'input',
            name: 'department_name',
            message: 'Which department does the new product belong to?',
        },
        {
            type: 'input',
            name: 'price_USD',
            message: 'What is the price per unit?',
            validate: positiveNumeric
        },
        {
            type: 'input',
            name: 'stock_quantity',
            message: 'How many items are in stock?',
            validate: positiveNumeric
        }
    ]).then(function(input) {

        console.log('Adding New Item: \n    product_name = ' + input.product_name + '\n' +
            '    department_name = ' + input.department_name + '\n' +
            '    price_USD = ' + input.price_USD + '\n' +
            '    stock_quantity = ' + input.stock_quantity);

        // Create the insertion query string
        var queryInv = 'INSERT INTO products SET ?';

        // Add new product to the db
        con.query(queryInv, input, function (error, results, fields) {
            if (error) throw error;

            console.log('New product has been added to the inventory under Item ID ' + results.insertId + '.');
            console.log("\n---------------------------------------------------------------------\n");

          promptManager();
        });
    })
}

promptManager();

