const express = require('express');
const mongoose = require('mongoose');
const userRouter = require('./routes/userRoute');
const view = require('./routes/view');
const port = 5000;
const app = express();
require('dotenv').config();

mongoose.set('strictQuery', false);
const connectDB = async () => {
  try {
    // mongodb connection string
    const con = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`mongoDB connected: ${con.connection.host}`);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
connectDB();

// parse incoming json request
app.use(express.json());

app.set('view engine', 'ejs');

// load route
app.use('/api', userRouter);
app.use('/', view);

app.get('/', (req, res) => {
  res.send('Hello');
});

app.listen(port, () => {
  console.log(`server is running on http://localhost:${port}`);
});
