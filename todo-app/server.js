import express from 'express';
import pgp from 'pg-promise';

const app = express();
const port = 3000;

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Use urlencoded to parse form data
app.use(express.urlencoded({ extended: true }));

//so that express serves static files from the public directory
app.use(express.static('public'));

app.use(express.json());

// Initialize PostgreSQL connection
const db = pgp()('postgresql://user:password@db/yourdb');

// Query to create table if it doesn't exist
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    task TEXT NOT NULL
  )
`;

db.none(createTableQuery)
  .then(() => console.log("Table successfully created"))
  .catch(err => console.error(err));

app.get('/', (req, res) => {
  db.manyOrNone('SELECT id, task FROM tasks')
    .then(data => res.render('index', { tasks: data, error: null }
    ))
    .catch(err => res.status(500).send('Something went wrong!'));
});

//handeling deletion

app.post('/delete-task', (req, res) => {
    const taskId = req.body.taskId;

    console.log(req.body)

    if (!taskId) {
        return res.status(400).send('Task ID is required');
    }
    
    db.none('DELETE FROM tasks WHERE id=$1', [taskId])
        .then(() => res.redirect('/'))
        .catch(err => res.status(500).send('Something went wrong!'));
});


app.post('/add-task', (req, res) => {
  let newTask = req.body.newTask.trim();
  if (!newTask) {
    db.manyOrNone('SELECT task FROM tasks')
    .then(data => res.render('index', { tasks: data, error: 'Invalid input. Please enter a task.' }))
    .catch(err => res.status(500).send('Something went wrong!'));
  } else {
    db.none('INSERT INTO tasks(task) VALUES($1)', [newTask])
      .then(() => res.redirect('/'))
      .catch(err => res.status(500).send('Something went wrong!'));
  }
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}).on('error', (err) => {
  console.error(`Server error: ${err}`);
});
