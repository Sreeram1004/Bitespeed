const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Needed for Render
});



app.post("/identify", async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: "Email or phoneNumber is required" });
    }

    const query = `SELECT * FROM Contact WHERE email = $1 OR phoneNumber = $2;`;
    const { rows } = await pool.query(query, [email, phoneNumber]);

    let primaryContact = null;
    let secondaryContacts = [];

    if (rows.length > 0) {
      primaryContact = rows.find(contact => contact.linkPrecedence === "primary") || rows[0];
      secondaryContacts = rows.filter(contact => contact.id !== primaryContact.id);

      const isNewEmail = email && !rows.some(contact => contact.email === email);
      const isNewPhone = phoneNumber && !rows.some(contact => contact.phoneNumber === phoneNumber);

      if (isNewEmail || isNewPhone) {
        const insertQuery = `INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt)
                             VALUES ($1, $2, $3, 'secondary', NOW(), NOW()) RETURNING *;`;
        const newContact = await pool.query(insertQuery, [phoneNumber, email, primaryContact.id]);
        secondaryContacts.push(newContact.rows[0]);
      }
    } else {
      const insertQuery = `INSERT INTO Contact (phoneNumber, email, linkPrecedence, createdAt, updatedAt)
                           VALUES ($1, $2, 'primary', NOW(), NOW()) RETURNING *;`;
      const newContact = await pool.query(insertQuery, [phoneNumber, email]);
      primaryContact = newContact.rows[0];
    }

    const response = {
      contact: {
        primaryContactId: primaryContact.id,
        emails: [primaryContact.email, ...secondaryContacts.map(c => c.email)].filter(Boolean),
        phoneNumbers: [primaryContact.phoneNumber, ...secondaryContacts.map(c => c.phoneNumber)].filter(Boolean),
        secondaryContactIds: secondaryContacts.map(c => c.id),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
