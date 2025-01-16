// Import dependencies
const express = require('express');
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const fuzzy = require("./fuzzy.js");
const app = express();
const dotenv = require("dotenv")
const port = process.env.PORT || 3000;
const admin = require('./admin.js')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookie = require('cookie-parser')
app.use(cookie())

function verifyUser(req, res, next) {
  const token = req.cookies.user;
  if (token) {
    jwt.verify(token, '123', (err, user) => {
      console.log(user, err)
      if (err) {
        req.user = null;
      } else {
        req.user = user;
      }

      next();
    });
  } else {
    req.user = null;
    next();
  }
}

// Middleware for form data and JSON
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the 'uploads' folder
app.use('/uploads', express.static('uploads'));

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'laptop_recommendation'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Database connected');
});

app.get("/login", (req, res) => {
  res.render('login');
})

app.use('/admin', admin)

// Home route with search functionality
app.get('/', verifyUser, (req, res) => {
  const merek = req.query.merek || ''; // Retrieve search query
  const harga = req.query.harga || ''; // Retrieve search query
  const prosesor = req.query.prosesor || ''; // Retrieve search query
  const gpu = req.query.gpu || ''; // Retrieve search query
  const display = req.query.display || ''; // Retrieve search query
  const ram = req.query.ram || ''; // Retrieve search query
  const penyimpanan = req.query.penyimpanan || ''; // Retrieve search query
  const daya_tahan_baterai = req.query.daya_tahan_baterai || ''; // Retrieve search query
  const berat = req.query.berat || ''; // Retrieve search query

  let query = 'SELECT * FROM laptops';
  let conditions = [];
  let params = [];

  let all_data = {
    merek, harga, prosesor, gpu, display, ram, penyimpanan, daya_tahan_baterai, berat
  };

  Object.keys(all_data).forEach(d => {
    if (all_data[d].length > 0) {
      const value = parseFloat(all_data[d]);
      if (!isNaN(value) && !all_data[d].match(/[a-zA-Z]/igm)) {
        conditions.push(`(${d} BETWEEN 0 AND ${all_data[d]})`)
      } else {
        conditions.push(`(${d} LIKE '${all_data[d]}')`);
      };
    }
  });

  // Append WHERE clause if conditions exist
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  db.query(query, params, (err, results) => {
    if (err) throw err;
    let rekomendasi = results.map(laptop => {
      return {
        nilairekomendasi: fuzzy(laptop.harga, laptop.ram, laptop.penyimpanan, laptop.daya_tahan_baterai, laptop.berat),
        laptop
      }
    })
    let laptops = []
    rekomendasi = rekomendasi.filter(laptop => {
      if (laptop.nilairekomendasi >= 60) {
        return true
      } else {
        laptops.push(laptop.laptop)
        return false
      }
    });
    // Render the index page with search results
    res.render('index', {
      laptops,
      rekomendasi,
      user: req.user
    });
  });
});
app.post('/login', async (req, res) => {
  const password = req.body.password;
  db.query(
    'SELECT * FROM user WHERE email = ? ', [req.body.email],
    async (err, result) => {
      if (err) {
        res.clearCookie('user')
        res.redirect('/login')
      };
      const resul = result[0] || { password: '' };
      const corect = await bcrypt.compare(password, resul.password);
      if (corect) {
        const token = jwt.sign({
          email: result[0].email,
        }, '123', {
          expiresIn: '1d'
        })
        res.cookie('user', token, {
          maxAge: 900000
        })
        res.redirect('/admin')
      } else {
        res.clearCookie('user')
        res.redirect('/login')


      }
    }
  )
})

app.get('/logout', (req, res) => {
  res.clearCookie('user')
  res.redirect('/login')
})

// Middleware for handling SPA (if needed)
app.get('*', (req, res) => {
  res.status(404).send('Page not found');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});