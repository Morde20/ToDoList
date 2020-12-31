require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

const mykey = process.env.KEY;

mongoose.connect(
  "mongodb+srv://admin:" +
    mykey +
    "@todolistdb.exgba.mongodb.net/toDoListDb?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

mongoose.set("useFindAndModify", false);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("item", itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("list", listSchema);

const today = date.getDate();

app.get("/", function (req, res) {
  try{
  Item.find({}, function (err, foundItems) {
    res.render("list", {
      listTitle: today,
      newListItems: foundItems,
    });
  });
  }catch(e){
    console.log(e)
  }
});

app.get("/:listName", function (req, res) {
  const listName = req.params.listName;
  
  List.findOne(
    {
      name: listName,
    },
    function (err, foundList) {
      if (!err) {
        if (!foundList) {
          const list = new List({
            name: listName,
          });

          list.save();

          res.redirect("/" + listName);
        } else {
          res.render("list", {
            listTitle: foundList.name,
            newListItems: foundList.items,
          });
        }
      }
    }
  );
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === today) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === today) {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err) {
        if (!err) {
          res.redirect("/" + listName);
        } else {
          console.log(err);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started");
});
