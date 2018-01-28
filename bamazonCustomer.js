// Pull in required dependencies
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

// validateInput makes sure that the user is supplying only positive integers for their inputs
function positiveInput(value) {
    var sign = Math.sign(value);

    if (sign === 1) {
        return true;
    } else {
        return 'Please enter a positive number.';
    }
}

// displayInventory will retrieve the current inventory from the database and output it to the console
function displayInventory() {
    // console.log('___ENTER displayInventory___');

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

        console.log('...................\n');

        // //Prompt the user for item/quantity they would like to purchase
        // promptUserPurchase();
    })
}

// promptUserPurchase will prompt the user for the item/quantity they would like to purchase
function promptUserPurchase() {


    // Prompt the user to select an item
    inquirer.prompt([
        {
            type: 'input',
            name: 'item_id',
            message: 'Please enter the Item ID which you would like to purchase.',
            validate: positiveInput,
            filter: Number
        },
        {
            type: 'input',
            name: 'quantity',
            message: 'How many do you need?',
            validate: positiveInput,
            filter: Number
        }
    ]).then(function(input) {

        var item = input.item_id;
        var quantity = input.quantity;

        // Query db to confirm that the given item ID exists in the desired quantity
        var queryInv = 'SELECT * FROM products WHERE ?';

        con.query(queryInv, {item_id: item}, function(err, data) {
            if (err) throw err;

            // If the user has selected an invalid item ID, data array will be empty

            if (data.length === 0) {
                console.log('ERROR: Invalid Item ID. Please select a valid Item ID.');
                displayInventory();

            } else {
                var productData = data[0];

                // console.log('productData = ' + JSON.stringify(productData));
                // console.log('productData.stock_quantity = ' + productData.stock_quantity);

                // If the quantity requested by the user is in stock
                if (quantity <= productData.stock_quantity) {
                    console.log('Congratulations, the product you requested is in stock! Placing order!');

                    // Construct the updating query string
                    var updateQueryInv = 'UPDATE products SET stock_quantity = ' + (productData.stock_quantity - quantity) + ' WHERE item_id = ' + item;
                    // console.log('updateQueryStr = ' + updateQueryStr);

                    // Update the inventory
                    con.query(updateQueryInv, function(err, data) {
                        if (err) throw err;

                        console.log('Your order has been placed! Your total is $' + productData.price_USD * quantity);
                        console.log('Thank you for shopping with us!');
                        console.log("\n---------------------------------------------------------------------\n");

                        // End the database connection
                        con.end();
                    })
                } else {
                    console.log('Sorry, there is not enough product in stock, your order can not be placed as is.');
                    console.log('Please modify your order.');
                    console.log("\n---------------------------------------------------------------------\n");

                    displayInventory();
                }
            }
        })
    })
}
displayInventory();

setTimeout(promptUserPurchase, 3000);

