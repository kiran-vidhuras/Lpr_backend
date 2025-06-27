const Contact = require('../models/Contact');

exports.submitContact = async (req, res) => {
  try {
    const { name, email,phone, message } = req.body;
    const contact = new Contact({ name, email, phone,message });
    await contact.save();
    res.status(201).json({ message: 'Contact submitted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
