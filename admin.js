// Import dependencies
const express = require('express');
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const fuzzy = require("./fuzzy.js");
const app = express.Router();
const dotenv = require("dotenv")
const port = process.env.PORT || 3000;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookie = require('cookie-parser')
app.use(cookie())

function verifyUser(req, res, next){
    const token = req.cookies.user;
    if (token){
        jwt.verify(token, '123', (err, user) => {
            if (err) {
                res.redirect('/login')
            }
    
            req.user = user;
            next();
        });
    }else{
        res.redirect('/login')
    }
}

app.use(verifyUser)

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage
});

// Middleware for form data and JSON
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

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

    // Add conditions dynamically based on valid input (not empty and not '0')
    if (merek && merek !== '0') {
        conditions.push('merek LIKE ?');
        params.push(`%${merek}%`);
    }
    if (harga && harga !== '0') {
        conditions.push('harga <= ?');
        params.push(harga);
    }
    if (prosesor && prosesor !== '0') {
        conditions.push('prosesor LIKE ?');
        params.push(`%${prosesor}%`);
    }
    if (gpu && gpu !== '0') {
        conditions.push('gpu LIKE ?');
        params.push(`%${gpu}%`);
    }
    if (display && display !== '0') {
        conditions.push('display LIKE ?');
        params.push(`%${display}%`);
    }
    if (ram && ram !== '0') {
        conditions.push('ram LIKE ?');
        params.push(`%${ram}%`);
    }
    if (penyimpanan && penyimpanan !== '0') {
        conditions.push('penyimpanan LIKE ?');
        params.push(`%${penyimpanan}%`);
    }
    if (daya_tahan_baterai && daya_tahan_baterai !== '0') {
        conditions.push('daya_tahan_baterai LIKE ?');
        params.push(`%${daya_tahan_baterai}%`);
    }
    if (berat && berat !== '0') {
        conditions.push('berat LIKE ?');
        params.push(`%${berat}%`);
    }

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
        res.render('admin', {
            laptops,
            rekomendasi
        });
    });
});

// Route to render the add laptop form
app.get('/add', (req, res) => {
    res.render('add');
});

// Route to add a new laptop
app.post('/add', upload.single('gambar'), (req, res) => {
    const {
        nama,
        harga,
        prosesor,
        ram,
        penyimpanan,
        daya_tahan_baterai,
        berat,
        link,
        merek,
        gpu,
        display
    } = req.body;
    const gambar = req.file ? req.file.filename : null;

    const query = 'INSERT INTO laptops (nama, harga, prosesor, ram, penyimpanan, daya_tahan_baterai, berat, gambar, link, merek, gpu, display) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [nama, harga, prosesor, ram, penyimpanan, daya_tahan_baterai, berat, gambar, link, merek, gpu, display], (err, result) => {
        if (err) throw err;
        res.redirect('/admin');
    });
});

// Route to render the edit laptop form
app.get('/edit/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM laptops WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) throw err;
        if (results.length === 0) return res.status(404).send('Laptop not found');
        res.render('edit', {
            laptop: results[0]
        });
    });
});

// Route to update laptop details
app.post('/edit/:id', upload.single('gambar'), (req, res) => {
    const id = req.params.id;
    const {
        nama,
        harga,
        prosesor,
        ram,
        penyimpanan,
        daya_tahan_baterai,
        berat,
        link,
        merek,
        gpu,
        display
    } = req.body;
    const gambar = req.file ? req.file.filename : null;

    const query = gambar ?
        'UPDATE laptops SET nama = ?, harga = ?, prosesor = ?, ram = ?, penyimpanan = ?, daya_tahan_baterai = ?, berat = ?, gambar = ?, link = ?, merek = ?, gpu = ?, display = ? WHERE id = ?' :
        'UPDATE laptops SET nama = ?, harga = ?, prosesor = ?, ram = ?, penyimpanan = ?, daya_tahan_baterai = ?, berat = ?, link = ?, merek = ?, gpu = ?, display = ? WHERE id = ?';

    const values = gambar ? [nama, harga, prosesor, ram, penyimpanan, daya_tahan_baterai, berat, gambar, link, merek, gpu, display, id] : [nama, harga, prosesor, ram, penyimpanan, daya_tahan_baterai, berat, link, merek, gpu, display, id];

    db.query(query, values, (err, result) => {
        if (err) throw err;
        res.redirect('/admin');
    });
});

// Route to delete a laptop
app.post('/delete/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM laptops WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) throw err;
        res.redirect('/admin');
    });
});
module.exports = app;