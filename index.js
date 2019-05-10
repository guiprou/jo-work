const fs = require("fs");
const Papa = require('papaparse');
const config = require('./config.json');

//const test_data = [['demande1', 'A'], ['demande1', 'B'], ['demande1', 'C'], ['demande1', 'D'], ['demande1', 'E'], ['demande2', 'A'], ['demande2', 'B'], ['demande3', 'A'], ['demande3', 'B'], ['demande4', 'C'], ['demande5', 'D']];

// function which exctracts data from a csv file and returns an array
const readFile = (url, callback) => {
  let result = [];
  const content = fs.readFileSync(url, 'UTF-8');
  Papa.parse(content, {
    header: false,
    delimiter: ";",
    encoding: 'UTF-8',
    complete: results => {
      callback(results.data)
    }
  });
}

// function which populate an array sorted by a main item attached to one/multiple sub items
const populateArray = (array, mainItem, subItem) => {
  
 // check if mainItem is already or not in the array
  const itemInArray = array.some(item => {
    for (const key in item) {
       return key === mainItem
    }
  })

  // if not in array create a new entry with the mainItem and its related subItem
  if (!itemInArray) {
    const entry = [];
    entry[mainItem] = [subItem];
    array.push(entry);
  }

  // if already in array, just add the new subItem to corresponding mainItem
  else {
    array.forEach(item => {
      for (const key in item) {
        if (key === mainItem) {
          item[mainItem].push(subItem);
        }
      }
    });
  }  
  return array;
}

// main algorythm function
const processData = (data, callback) => {
  let resultByProduct = [];
  let resultByType = [];

  // for each entry create 2 arrays: one sorted by products a second one sorted by type of query
  data.forEach(query => {
    
    // type is the 1st column, product the 2nd one
    const type = query[0];
    const product = query[1];

    // filter empty cells
    if (type !== '' && type !== undefined && product !== '' && product !== undefined) {
      
      // 1) populate array sorted by product:
      resultByProduct = populateArray(resultByProduct, product, type);
      
      // 2) populate array sorted by query type:
      resultByType = populateArray(resultByType, type, product);
    }
  });

  //console.log(resultByProduct);
  //console.log(resultByType);

  // 3) Populate the final result array
  let result = [];

  // for each query, select which product is the best test case
  resultByType.forEach(type => {
    for (const key in type) {
      const queryName = key;
      const products = type[key];  
      let selectedProduct = '';
      let higherNumber = 0;
      
      // run through query's related products to pick up the best one: it'll be the product which covers the most queries
      products.forEach(candidateProduct => {
        
        // find number of queries associated to a product from the array sorted by product
        const numberOfQueries  = resultByProduct.filter(item => {
          for (const key in item) {
            return key === candidateProduct
          }
        })[0][candidateProduct].length;
        
        // compare the number of queries for the current product with previous one (by default 1st one) and keep the higher
        if (numberOfQueries > higherNumber) {
          selectedProduct = candidateProduct;
          higherNumber = numberOfQueries;
        }
      });
      
      result = populateArray(result, selectedProduct, queryName);
    }
  });
  
  // return final array once process complete
  callback(result);
}

// function which formats and writes data (array) into a txt file
const writeIntoFile = (url, data) => {
  
  // format human readable output
  let formatedData = ``;
  data.forEach(item => {
    for (const key in item) {
      formatedData += `Produit: ${key}
  Demandes:
`;
      item[key].forEach(demande => {
        formatedData += `    * ${demande}
`;
      });
    }
  });
  
  // write formated data into file
  fs.writeFile(url, formatedData, (err) => {
    if (err) console.error(err);
//    console.log("Successfully Written to File.");
  });
}

// High level algorythm:
readFile(config.inputFile, data => {
//console.log(data)
  processData(data, result => {
    console.log(result);
    writeIntoFile(config.outputFile, result);
  });
});