//jshint esversion:6

// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyByNJwf00memgOq_9SnQ_ZBc0Ns8X16NBc",
//   authDomain: "todolist-373214.firebaseapp.com",
//   projectId: "todolist-373214",
//   storageBucket: "todolist-373214.appspot.com",
//   messagingSenderId: "1078033490657",
//   appId: "1:1078033490657:web:0ef05e11798973adf04da0",
//   measurementId: "G-304F6D75K8"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const express = require('express');
// const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// mongoose.set('useNewUrlParser', true);

const options = {
	useUnifiedTopology: true,
	useNewUrlParser: true,
};

// THIS WORKS TO CONNECT TO MONGODB ON LOCALHOST
// mongoose.connect('mongodb://localhost:27017/todolistDB', options);

//THIS WORKS TO CONNECT TO MONGO ATLAS (HOSTED DATABASE)!
mongoose.connect('mongodb+srv://admin-newman:KtLiaCnHa7sRMICl@cluster0.ea91drh.mongodb.net/todolistDB', options);

// THIS WORKS FROM TERMINAL DEFAULT PROMPT
// mongosh "mongodb://ac-kza7qm6-shard-00-00.ea91drh.mongodb.net:27017,ac-kza7qm6-shard-00-01.ea91drh.mongodb.net:27017,ac-kza7qm6-shard-00-02.ea91drh.mongodb.net:27017/todolistDB?replicaSet=atlas-pzisu5-shard-0" --ssl --authenticationDatabase admin --username admin-newman --password KtLiaCnHa7sRMICl

const itemsSchema = {
	name: String,
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
	name: 'Welcome to your todolist!',
});

const item2 = new Item({
	name: 'Hit the + button to add a new item.',
});

const item3 = new Item({
	name: '<-- Hit this to delete an item.',
});

const defaultItems = [item1, item2, item3];

const listSchema = {
	name: String,
	items: [itemsSchema],
};

const List = mongoose.model('List', listSchema);

app.get('/', function (req, res) {
	Item.find({}, function (err, foundItems) {
		if (foundItems.length === 0) {
			Item.insertMany(defaultItems, function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log('Successfully savevd default items to DB.');
				}
			});
			res.redirect('/');
		} else {
			res.render('list', {
				listTitle: 'Today',
				newListItems: foundItems,
			});
		}
	});
});

app.get('/:customListName', function (req, res) {
	const customListName = _.capitalize(req.params.customListName);

	List.findOne({ name: customListName }, function (err, foundList) {
		if (!err) {
			if (!foundList) {
				//Create a new list
				const list = new List({
					name: customListName,
					items: defaultItems,
				});
				list.save();
				res.redirect('/' + customListName);
			} else {
				//Show an existing list

				res.render('list', {
					listTitle: foundList.name,
					newListItems: foundList.items,
				});
			}
		}
	});
});

app.post('/', function (req, res) {
	const itemName = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		name: itemName,
	});

	if (listName === 'Today') {
		item.save();
		res.redirect('/');
	} else {
		List.findOne({ name: listName }, function (err, foundList) {
			foundList.items.push(item);
			foundList.save();
			res.redirect('/' + listName);
		});
	}
});

app.post('/delete', function (req, res) {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === 'Today') {
		Item.findByIdAndRemove(checkedItemId, function (err) {
			if (!err) {
				console.log('Successfully deleted checked item.');
				res.redirect('/');
			}
		});
	} else {
		List.findOneAndUpdate(
			{ name: listName },
			{ $pull: { items: { _id: checkedItemId } } },
			function (err, foundList) {
				if (!err) {
					res.redirect('/' + listName);
				}
			}
		);
	}
});

app.get('/about', function (req, res) {
	res.render('about');
});

// let port = process.env.PORT;
// if (port == null || port == "") {
// 	port = 3000;
// }


// Use this app.listen only for localhost
app.listen(3000, function () {
	console.log('Server started on port 3000');
});

// Google Cloud Deployment requires this port constant...
const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`todolist_done: listening on port ${port}`);
});
