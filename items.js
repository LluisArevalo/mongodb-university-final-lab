/*
  Copyright (c) 2008 - 2016 MongoDB, Inc. <http://mongodb.com>

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/


var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');


function ItemDAO(database) {
    "use strict";

    this.db = database;

    this.getCategories = function(callback) {
      "use strict";

      var categories = [];
      var category = {
        _id: "All",
        num: 9999
      };

      categories.push (category);

      this.db.collection('item').aggregate ([
        {
          $group: {
            _id: { "category": "$category" },
            num: { $sum: 1 }
          }
        },
        {
          $project: { _id: 1, num: 1 }
        },
        {
          $sort: { _id: 1 }
        }
      ], function (err, result) {
        result.forEach (function (category) {
          var c = {
            _id: category._id.category,
            num: category.num
          };

          categories.push(c);
        });

        callback (categories);
      });
    };

    this.getItems = function(category, page, itemsPerPage, callback) {
      "use strict";

      var pageItems = [];

      if (category === "All") {
        this.db.collection('item').aggregate ([
          {
            $sort: { _id: 1 }
          },
          {
            $skip: page * itemsPerPage
          },
          {
            $limit: itemsPerPage
          }
          ], function (error, result) {
            result.forEach (function (item) {
              pageItems.push(item);
            });

            callback (pageItems);
        });
      } else {
        this.db.collection('item').aggregate ([
          {
            $match: { category: category }
          },
          {
            $sort: { _id: 1 }
          },
          {
            $skip: page * itemsPerPage
          },
          {
            $limit: itemsPerPage
          }
          ], function (error, result) {
            result.forEach (function (item) {
              pageItems.push(item);
            });

            callback (pageItems);
        });
      }
    };


    this.getNumItems = function(category, callback) {
      "use strict";

      var numItems = 0;
      if (category === "All" || category === "") {
        this.db.collection('item').aggregate ([
          {
            $group: {
              _id: { "category": "$category" },
              numItems: { $sum: 1 }
            }
          },
          {
            $project: { _id: 0, numItems: 1 }
          }
          ], function (err, result) {
            callback (result[0].numItems);
          });
      } else {
        this.db.collection('item').aggregate ([
          {
            $match: {
              category: category
            }
          },
          {
            $group: {
              _id: { "category": "$category" },
              numItems: { $sum: 1 }
            }
          },
          {
            $project: { _id: 0, numItems: 1 }
          }
        ], function (err, result) {
          callback (result[0].numItems);
        });
      }
    };

    this.searchItems = function(query, page, itemsPerPage, callback) {
      "use strict";

      var items = [];

      this.db.collection('item').aggregate ([
        {
          $match: { $text: { $search: query } }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $skip: page * itemsPerPage
        },
        {
          $limit: itemsPerPage
        }
      ], function (err, result) {
        result.forEach (function (item) {
          items.push(item);
        });

        callback(items);
      });
    };


    this.getNumSearchItems = function(query, callback) {
      "use strict";

      var numItems = 0;

      this.db.collection('item').aggregate ([
        {
          $match: { $text: { $search: query } }
        },
        {
          $group: {
            _id: { "text": query },
            numItems: { $sum: 1 }
          }
        }
      ], function (error, result) {
        callback(result[0].numItems);
      });
    };


    this.getItem = function(itemId, callback) {
      "use strict";

      var item = this.createDummyItem();

      this.db.collection('item').aggregate ([
        { $match: { _id: itemId } }
      ], function (error, result) {
        var item = result[0];
        callback(item);
      });
    };


    this.getRelatedItems = function(callback) {
        "use strict";

        this.db.collection("item").find({})
            .limit(4)
            .toArray(function(err, relatedItems) {
                assert.equal(null, err);
                callback(relatedItems);
            });
    };


    this.addReview = function(itemId, comment, name, stars, callback) {
      "use strict";

      var reviewDoc = {
        name: name,
        comment: comment,
        stars: stars,
        date: Date.now()
      };

      this.db.collection('item').update (
        { _id: itemId },
        { $push: { reviews: reviewDoc } },
        function (error, result) {
          callback(result);
        }
      );
    };


    this.createDummyItem = function() {
        "use strict";

        var item = {
            _id: 1,
            title: "Gray Hooded Sweatshirt",
            description: "The top hooded sweatshirt we offer",
            slogan: "Made of 100% cotton",
            stars: 0,
            category: "Apparel",
            img_url: "/img/products/hoodie.jpg",
            price: 29.99,
            reviews: []
        };

        return item;
    };
}


module.exports.ItemDAO = ItemDAO;
